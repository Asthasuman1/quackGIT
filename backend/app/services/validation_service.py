from __future__ import annotations

import os
import platform
import shutil
import signal
import subprocess
import tempfile
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable


@dataclass
class ValidationResult:
    """
    Result of a repository validation command.
    """

    status: str
    command: list[str]
    exit_code: int | None
    stdout: str
    stderr: str
    duration_seconds: float

    timed_out: bool = False
    error: str | None = None

    # Step 14 sandbox / execution metadata.
    sandbox_mode: str = "LOCAL_RESTRICTED"
    network_isolated: bool = False
    environment_isolated: bool = True
    workspace_restricted: bool = True
    resource_limits_applied: bool = False

    def to_dict(self) -> dict:
        return {
            "status": self.status,
            "command": self.command,
            "exit_code": self.exit_code,
            "stdout": self.stdout,
            "stderr": self.stderr,
            "duration_seconds": self.duration_seconds,
            "timed_out": self.timed_out,
            "error": self.error,
            "sandbox_mode": self.sandbox_mode,
            "network_isolated": self.network_isolated,
            "environment_isolated": self.environment_isolated,
            "workspace_restricted": self.workspace_restricted,
            "resource_limits_applied": self.resource_limits_applied,
        }


class ValidationService:
    """
    Controlled repository validation runner.

    Step 14 adds defense-in-depth around repository execution.

    Controls include:

    - shell=False
    - explicit argv lists only
    - bounded timeout
    - process-group creation
    - process-tree termination on timeout
    - captured stdout/stderr
    - bounded output
    - sensitive environment-variable removal
    - isolated HOME/TEMP directories
    - isolated Python user-site behavior
    - explicit repository workspace validation
    - targeted pytest execution only
    - POSIX resource limits when supported
    - Windows process-group handling
    - no dependency installation
    - no AI-generated command execution

    IMPORTANT:

    This is a restricted local execution layer, not a complete OS
    security sandbox.

    In particular, on Windows and ordinary host subprocess execution,
    filesystem and network access cannot be fully blocked using Python
    subprocess alone.

    A production deployment for arbitrary untrusted public PRs should
    eventually execute this service inside a disposable container or
    equivalent hardened isolation boundary.
    """

    DEFAULT_TIMEOUT_SECONDS = 60
    MAX_TIMEOUT_SECONDS = 300

    MAX_OUTPUT_CHARS = 50_000

    # Resource ceilings used where the operating system supports them.
    DEFAULT_MAX_CPU_SECONDS = 120
    DEFAULT_MAX_MEMORY_MB = 1_024
    DEFAULT_MAX_PROCESSES = 128
    DEFAULT_MAX_OPEN_FILES = 2_048

    # Environment variables that are useful for ordinary development
    # and repository tooling.
    SAFE_ENV_EXACT_KEYS = {
        "PATH",
        "Path",
        "PATHEXT",
        "SystemRoot",
        "SYSTEMROOT",
        "WINDIR",
        "TEMP",
        "TMP",
        "TMPDIR",
        "HOME",
        "USERPROFILE",
        "LOCALAPPDATA",
        "APPDATA",
        "PROGRAMDATA",
        "ProgramFiles",
        "ProgramFiles(x86)",
        "ProgramW6432",
        "CommonProgramFiles",
        "CommonProgramFiles(x86)",
        "VIRTUAL_ENV",
        "LANG",
        "LC_ALL",
        "LC_CTYPE",
        "PYTHONUTF8",
        "PYTHONIOENCODING",
        "TERM",
        "CI",
        "NO_COLOR",
    }

    # Prefixes that are safe to preserve for ordinary local tooling.
    SAFE_ENV_PREFIXES = (
        "JAVA_HOME",
        "GOROOT",
        "GOPATH",
        "CARGO_HOME",
        "RUSTUP_HOME",
        "NODE_PATH",
        "NVM_HOME",
        "DOTNET_ROOT",
        "ANDROID_HOME",
        "ANDROID_SDK_ROOT",
    )

    # Any environment key matching these patterns is removed even if
    # it would otherwise be inherited.
    SENSITIVE_ENV_TOKENS = (
        "TOKEN",
        "SECRET",
        "PASSWORD",
        "PASSWD",
        "API_KEY",
        "PRIVATE_KEY",
        "ACCESS_KEY",
        "CLIENT_SECRET",
        "AUTHORIZATION",
        "COOKIE",
        "CREDENTIAL",
        "SIGNING_KEY",
        "WEBHOOK_SECRET",
    )

    def __init__(
        self,
        *,
        default_timeout_seconds: int = DEFAULT_TIMEOUT_SECONDS,
        max_cpu_seconds: int = DEFAULT_MAX_CPU_SECONDS,
        max_memory_mb: int = DEFAULT_MAX_MEMORY_MB,
        max_processes: int = DEFAULT_MAX_PROCESSES,
        max_open_files: int = DEFAULT_MAX_OPEN_FILES,
    ):
        self.default_timeout_seconds = min(
            max(1, default_timeout_seconds),
            self.MAX_TIMEOUT_SECONDS,
        )

        self.max_cpu_seconds = max(
            1,
            max_cpu_seconds,
        )

        self.max_memory_mb = max(
            128,
            max_memory_mb,
        )

        self.max_processes = max(
            16,
            max_processes,
        )

        self.max_open_files = max(
            256,
            max_open_files,
        )

    # ============================================================
    # Public API
    # ============================================================

    def run_command(
        self,
        command: list[str],
        *,
        cwd: str | Path,
        timeout_seconds: int | None = None,
        environment: dict[str, str] | None = None,
        workspace_root: str | Path | None = None,
    ) -> ValidationResult:
        """
        Run one explicitly supplied repository command.

        The command must be an argv list. Shell command strings are
        rejected.

        The process receives a restricted environment and isolated
        HOME/TEMP directories.

        On POSIX, resource limits are applied where supported.

        On Windows, a new process group is created so a timeout can
        terminate the process tree.

        Network access is NOT claimed to be fully blocked by this
        local runner.
        """

        self._validate_command(command)

        working_directory = Path(cwd)

        if not working_directory.exists():
            raise ValueError(
                "Validation working directory does not exist: "
                f"{working_directory}"
            )

        if not working_directory.is_dir():
            raise ValueError(
                "Validation working directory is not a directory: "
                f"{working_directory}"
            )

        working_directory = working_directory.resolve()

        if workspace_root is None:
            workspace_root_path = working_directory
        else:
            workspace_root_path = Path(
                workspace_root
            ).resolve()

        self._validate_workspace_root(
            workspace_root_path
        )

        self._validate_cwd_inside_workspace(
            working_directory,
            workspace_root_path,
        )

        timeout = (
            timeout_seconds
            if timeout_seconds is not None
            else self.default_timeout_seconds
        )

        timeout = min(
            max(1, int(timeout)),
            self.MAX_TIMEOUT_SECONDS,
        )

        sandbox_home = Path(
            tempfile.mkdtemp(
                prefix="quackgit-validation-home-"
            )
        )

        sandbox_tmp = Path(
            tempfile.mkdtemp(
                prefix="quackgit-validation-tmp-"
            )
        )

        process_environment = self._build_environment(
            environment=environment,
            sandbox_home=sandbox_home,
            sandbox_tmp=sandbox_tmp,
        )

        resource_limits_applied = (
            platform.system() != "Windows"
            and self._posix_resource_limits_supported()
        )

        process_kwargs = self._build_process_options(
            resource_limits_applied=resource_limits_applied,
        )

        start_time = time.monotonic()
        completed = None

        try:
            try:
                completed = subprocess.Popen(
                    command,
                    cwd=str(working_directory),
                    env=process_environment,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    text=True,
                    shell=False,
                    **process_kwargs,
                )

                try:
                    stdout, stderr = completed.communicate(
                        timeout=timeout
                    )

                    duration = (
                        time.monotonic()
                        - start_time
                    )

                    stdout = self._truncate_output(
                        stdout or ""
                    )

                    stderr = self._truncate_output(
                        stderr or ""
                    )

                    status = (
                        "VALIDATED"
                        if completed.returncode == 0
                        else "OBSERVED"
                    )

                    return ValidationResult(
                        status=status,
                        command=list(command),
                        exit_code=completed.returncode,
                        stdout=stdout,
                        stderr=stderr,
                        duration_seconds=round(
                            duration,
                            3,
                        ),
                        timed_out=False,
                        error=None,
                        sandbox_mode="LOCAL_RESTRICTED",
                        network_isolated=False,
                        environment_isolated=True,
                        workspace_restricted=True,
                        resource_limits_applied=(
                            resource_limits_applied
                        ),
                    )

                except subprocess.TimeoutExpired as exc:
                    duration = (
                        time.monotonic()
                        - start_time
                    )

                    self._terminate_process_tree(
                        completed
                    )

                    stdout, stderr = (
                        completed.communicate()
                    )

                    if not stdout:
                        stdout = (
                            exc.stdout
                            if exc.stdout is not None
                            else ""
                        )

                    if not stderr:
                        stderr = (
                            exc.stderr
                            if exc.stderr is not None
                            else ""
                        )

                    return ValidationResult(
                        status="NOT_REPRODUCED",
                        command=list(command),
                        exit_code=None,
                        stdout=self._truncate_output(
                            self._normalise_process_output(
                                stdout
                            )
                        ),
                        stderr=self._truncate_output(
                            self._normalise_process_output(
                                stderr
                            )
                        ),
                        duration_seconds=round(
                            duration,
                            3,
                        ),
                        timed_out=True,
                        error=(
                            "Validation timed out after "
                            f"{timeout} seconds and the "
                            "process tree was terminated."
                        ),
                        sandbox_mode="LOCAL_RESTRICTED",
                        network_isolated=False,
                        environment_isolated=True,
                        workspace_restricted=True,
                        resource_limits_applied=(
                            resource_limits_applied
                        ),
                    )

            except FileNotFoundError as exc:
                duration = (
                    time.monotonic()
                    - start_time
                )

                return ValidationResult(
                    status="NOT_TESTED",
                    command=list(command),
                    exit_code=None,
                    stdout="",
                    stderr="",
                    duration_seconds=round(
                        duration,
                        3,
                    ),
                    timed_out=False,
                    error=(
                        "Validation executable was not found: "
                        f"{exc}"
                    ),
                    sandbox_mode="LOCAL_RESTRICTED",
                    network_isolated=False,
                    environment_isolated=True,
                    workspace_restricted=True,
                    resource_limits_applied=(
                        resource_limits_applied
                    ),
                )

            except PermissionError as exc:
                duration = (
                    time.monotonic()
                    - start_time
                )

                return ValidationResult(
                    status="NOT_TESTED",
                    command=list(command),
                    exit_code=None,
                    stdout="",
                    stderr="",
                    duration_seconds=round(
                        duration,
                        3,
                    ),
                    timed_out=False,
                    error=(
                        "Validation command could not be "
                        f"executed: {exc}"
                    ),
                    sandbox_mode="LOCAL_RESTRICTED",
                    network_isolated=False,
                    environment_isolated=True,
                    workspace_restricted=True,
                    resource_limits_applied=(
                        resource_limits_applied
                    ),
                )

            except OSError as exc:
                duration = (
                    time.monotonic()
                    - start_time
                )

                return ValidationResult(
                    status="NOT_TESTED",
                    command=list(command),
                    exit_code=None,
                    stdout="",
                    stderr="",
                    duration_seconds=round(
                        duration,
                        3,
                    ),
                    timed_out=False,
                    error=str(exc),
                    sandbox_mode="LOCAL_RESTRICTED",
                    network_isolated=False,
                    environment_isolated=True,
                    workspace_restricted=True,
                    resource_limits_applied=(
                        resource_limits_applied
                    ),
                )

        finally:
            shutil.rmtree(
                sandbox_home,
                ignore_errors=True,
            )

            shutil.rmtree(
                sandbox_tmp,
                ignore_errors=True,
            )

    # ============================================================
    # Pytest
    # ============================================================

    def run_pytest(
        self,
        *,
        cwd: str | Path,
        test_paths: list[str] | None = None,
        timeout_seconds: int | None = None,
    ) -> ValidationResult:
        """
        Run pytest against explicitly selected test paths.

        A full-repository pytest execution is intentionally disabled.

        Every test path must resolve inside the supplied working
        directory.
        """

        if not test_paths:
            return ValidationResult(
                status="NOT_TESTED",
                command=[],
                exit_code=None,
                stdout="",
                stderr="",
                duration_seconds=0.0,
                timed_out=False,
                error=(
                    "No targeted test paths were supplied. "
                    "Full-repository pytest execution is disabled "
                    "by default."
                ),
                sandbox_mode="LOCAL_RESTRICTED",
                network_isolated=False,
                environment_isolated=True,
                workspace_restricted=True,
                resource_limits_applied=False,
            )

        working_directory = Path(
            cwd
        ).resolve()

        try:
            safe_test_paths = (
                self._validate_relative_test_paths(
                    working_directory,
                    test_paths,
                )
            )
        except ValueError as exc:
            return ValidationResult(
                status="NOT_TESTED",
                command=[],
                exit_code=None,
                stdout="",
                stderr="",
                duration_seconds=0.0,
                timed_out=False,
                error=str(exc),
                sandbox_mode="LOCAL_RESTRICTED",
                network_isolated=False,
                environment_isolated=True,
                workspace_restricted=True,
                resource_limits_applied=False,
            )

        command = [
            "python",
            "-m",
            "pytest",
            *safe_test_paths,
        ]

        return self.run_command(
            command,
            cwd=working_directory,
            workspace_root=working_directory,
            timeout_seconds=timeout_seconds,
        )

    # ============================================================
    # Python test
    # ============================================================

    def run_python_test(
        self,
        *,
        cwd: str | Path,
        test_path: str,
        timeout_seconds: int | None = None,
    ) -> ValidationResult:
        """
        Run one explicitly selected Python test file.

        The test path must remain inside the supplied repository
        workspace.
        """

        if not test_path or not test_path.strip():
            raise ValueError(
                "Test path cannot be empty."
            )

        working_directory = Path(
            cwd
        ).resolve()

        try:
            safe_paths = (
                self._validate_relative_test_paths(
                    working_directory,
                    [test_path],
                )
            )
        except ValueError as exc:
            return ValidationResult(
                status="NOT_TESTED",
                command=[],
                exit_code=None,
                stdout="",
                stderr="",
                duration_seconds=0.0,
                timed_out=False,
                error=str(exc),
                sandbox_mode="LOCAL_RESTRICTED",
                network_isolated=False,
                environment_isolated=True,
                workspace_restricted=True,
                resource_limits_applied=False,
            )

        command = [
            "python",
            safe_paths[0],
        ]

        return self.run_command(
            command,
            cwd=working_directory,
            workspace_root=working_directory,
            timeout_seconds=timeout_seconds,
        )

    # ============================================================
    # Command validation
    # ============================================================

    @staticmethod
    def _validate_command(
        command: list[str],
    ) -> None:
        if not isinstance(command, list):
            raise TypeError(
                "Validation commands must be provided as a list."
            )

        if not command:
            raise ValueError(
                "Validation command cannot be empty."
            )

        if any(
            not isinstance(part, str)
            or not part.strip()
            for part in command
        ):
            raise ValueError(
                "Every validation command argument must be "
                "a non-empty string."
            )

    @staticmethod
    def _validate_workspace_root(
        workspace_root: Path,
    ) -> None:
        if not workspace_root.exists():
            raise ValueError(
                "Validation workspace root does not exist: "
                f"{workspace_root}"
            )

        if not workspace_root.is_dir():
            raise ValueError(
                "Validation workspace root is not a directory: "
                f"{workspace_root}"
            )

    @staticmethod
    def _validate_cwd_inside_workspace(
        working_directory: Path,
        workspace_root: Path,
    ) -> None:
        try:
            working_directory.relative_to(
                workspace_root
            )
        except ValueError as exc:
            raise ValueError(
                "Validation working directory must remain inside "
                "the supplied workspace root."
            ) from exc

    @staticmethod
    def _validate_relative_test_paths(
        workspace: Path,
        test_paths: Iterable[str],
    ) -> list[str]:
        safe_paths: list[str] = []

        for test_path in test_paths:
            if not isinstance(
                test_path,
                str,
            ):
                raise ValueError(
                    "Validation test paths must be strings."
                )

            if not test_path.strip():
                raise ValueError(
                    "Validation test path cannot be empty."
                )

            candidate = (
                workspace / test_path
            ).resolve()

            try:
                candidate.relative_to(
                    workspace
                )
            except ValueError as exc:
                raise ValueError(
                    "Validation test path escapes the "
                    "repository workspace: "
                    f"{test_path}"
                ) from exc

            if not candidate.is_file():
                raise ValueError(
                    "Validation test file does not exist: "
                    f"{test_path}"
                )

            # Return a normalized relative path rather than an
            # absolute path.
            relative = candidate.relative_to(
                workspace
            )

            safe_paths.append(
                relative.as_posix()
            )

        return safe_paths

    # ============================================================
    # Environment
    # ============================================================

    def _build_environment(
        self,
        *,
        environment: dict[str, str] | None,
        sandbox_home: Path,
        sandbox_tmp: Path,
    ) -> dict[str, str]:
        """
        Build an execution environment without inheriting arbitrary
        host secrets.

        The current host environment is reduced to an explicit
        allowlist plus a small number of safe toolchain prefixes.

        Caller-provided variables are accepted only after sensitive
        variables are filtered.
        """

        source_environment = dict(
            os.environ
        )

        isolated_environment: dict[str, str] = {}

        for key, value in source_environment.items():
            if self._is_sensitive_environment_key(
                key
            ):
                continue

            if (
                key in self.SAFE_ENV_EXACT_KEYS
                or key.startswith(
                    self.SAFE_ENV_PREFIXES
                )
            ):
                isolated_environment[key] = str(
                    value
                )

        # Preserve PATH even if the platform uses a slightly unusual
        # capitalization.
        if "PATH" in source_environment:
            isolated_environment["PATH"] = (
                source_environment["PATH"]
            )

        if "Path" in source_environment:
            isolated_environment["Path"] = (
                source_environment["Path"]
            )

        # Explicit caller overrides, again filtered for secrets.
        if environment:
            for key, value in environment.items():
                normalized_key = str(
                    key
                ).strip()

                if not normalized_key:
                    continue

                if self._is_sensitive_environment_key(
                    normalized_key
                ):
                    continue

                isolated_environment[
                    normalized_key
                ] = str(value)

        # Replace host-controlled home/temp locations.
        isolated_environment["HOME"] = str(
            sandbox_home
        )

        isolated_environment["TEMP"] = str(
            sandbox_tmp
        )

        isolated_environment["TMP"] = str(
            sandbox_tmp
        )

        isolated_environment["TMPDIR"] = str(
            sandbox_tmp
        )

        isolated_environment["PYTHONNOUSERSITE"] = "1"
        isolated_environment["PIP_NO_INPUT"] = "1"
        isolated_environment["GIT_TERMINAL_PROMPT"] = "0"
        isolated_environment["CI"] = "1"
        isolated_environment["NO_COLOR"] = "1"

        # Prevent inherited Python path manipulation.
        isolated_environment.pop(
            "PYTHONPATH",
            None,
        )

        # Prevent inherited proxy credentials/configuration from
        # leaking into the repository process.
        for key in list(
            isolated_environment
        ):
            upper_key = key.upper()

            if upper_key in {
                "HTTP_PROXY",
                "HTTPS_PROXY",
                "ALL_PROXY",
                "NO_PROXY",
            }:
                isolated_environment.pop(
                    key,
                    None,
                )

        return isolated_environment

    @classmethod
    def _is_sensitive_environment_key(
        cls,
        key: str,
    ) -> bool:
        upper_key = key.upper()

        return any(
            token in upper_key
            for token in cls.SENSITIVE_ENV_TOKENS
        )

    # ============================================================
    # Process creation / resource limits
    # ============================================================

    def _build_process_options(
        self,
        *,
        resource_limits_applied: bool,
    ) -> dict:
        system = platform.system()

        options: dict = {}

        if system == "Windows":
            creation_flags = getattr(
                subprocess,
                "CREATE_NEW_PROCESS_GROUP",
                0,
            )

            options["creationflags"] = (
                creation_flags
            )

            return options

        # POSIX:
        #
        # start_new_session=True creates a process group, allowing
        # the timeout path to terminate the whole tree.
        options["start_new_session"] = True

        if resource_limits_applied:
            options["preexec_fn"] = (
                self._build_posix_preexec_function()
            )

        return options

    def _build_posix_preexec_function(self):
        """
        Build a child-process setup function for POSIX resource
        limits.

        Imported lazily so Windows never attempts to import resource.
        """

        try:
            import resource
        except ImportError:
            return None

        max_cpu = self.max_cpu_seconds
        max_memory = self.max_memory_mb * 1024 * 1024
        max_processes = self.max_processes
        max_open_files = self.max_open_files

        def apply_limits():
            # CPU time.
            try:
                resource.setrlimit(
                    resource.RLIMIT_CPU,
                    (
                        max_cpu,
                        max_cpu + 1,
                    ),
                )
            except (
                OSError,
                ValueError,
            ):
                pass

            # Address space / virtual memory.
            if hasattr(
                resource,
                "RLIMIT_AS",
            ):
                try:
                    resource.setrlimit(
                        resource.RLIMIT_AS,
                        (
                            max_memory,
                            max_memory,
                        ),
                    )
                except (
                    OSError,
                    ValueError,
                ):
                    pass

            # Process count.
            if hasattr(
                resource,
                "RLIMIT_NPROC",
            ):
                try:
                    resource.setrlimit(
                        resource.RLIMIT_NPROC,
                        (
                            max_processes,
                            max_processes,
                        ),
                    )
                except (
                    OSError,
                    ValueError,
                ):
                    pass

            # Open file descriptors.
            if hasattr(
                resource,
                "RLIMIT_NOFILE",
            ):
                try:
                    soft, hard = resource.getrlimit(
                        resource.RLIMIT_NOFILE
                    )

                    target = min(
                        max_open_files,
                        hard
                        if hard != resource.RLIM_INFINITY
                        else max_open_files,
                    )

                    resource.setrlimit(
                        resource.RLIMIT_NOFILE,
                        (
                            min(soft, target),
                            target,
                        ),
                    )
                except (
                    OSError,
                    ValueError,
                ):
                    pass

        return apply_limits

    @staticmethod
    def _posix_resource_limits_supported() -> bool:
        if platform.system() == "Windows":
            return False

        try:
            import resource
        except ImportError:
            return False

        return hasattr(
            resource,
            "setrlimit",
        )

    # ============================================================
    # Process termination
    # ============================================================

    def _terminate_process_tree(
        self,
        process: subprocess.Popen,
    ) -> None:
        """
        Terminate the process and its children.

        POSIX uses the process group created with start_new_session.

        Windows uses taskkill /T /F against the process tree.
        """

        if process.poll() is not None:
            return

        system = platform.system()

        if system == "Windows":
            self._terminate_windows_process_tree(
                process
            )
            return

        self._terminate_posix_process_tree(
            process
        )

    @staticmethod
    def _terminate_windows_process_tree(
        process: subprocess.Popen,
    ) -> None:
        try:
            subprocess.run(
                [
                    "taskkill",
                    "/PID",
                    str(process.pid),
                    "/T",
                    "/F",
                ],
                capture_output=True,
                text=True,
                timeout=10,
                shell=False,
                check=False,
            )
        except (
            subprocess.TimeoutExpired,
            FileNotFoundError,
            OSError,
        ):
            try:
                process.kill()
            except OSError:
                pass

    @staticmethod
    def _terminate_posix_process_tree(
        process: subprocess.Popen,
    ) -> None:
        try:
            os.killpg(
                process.pid,
                signal.SIGTERM,
            )
        except (
            ProcessLookupError,
            PermissionError,
            OSError,
        ):
            try:
                process.terminate()
            except OSError:
                pass

        try:
            process.wait(
                timeout=5
            )
            return
        except subprocess.TimeoutExpired:
            pass

        try:
            os.killpg(
                process.pid,
                signal.SIGKILL,
            )
        except (
            ProcessLookupError,
            PermissionError,
            OSError,
        ):
            try:
                process.kill()
            except OSError:
                pass

    # ============================================================
    # Output handling
    # ============================================================

    @classmethod
    def _truncate_output(
        cls,
        output: str,
    ) -> str:
        if len(output) <= cls.MAX_OUTPUT_CHARS:
            return output

        return (
            output[: cls.MAX_OUTPUT_CHARS]
            + "\n\n[VALIDATION OUTPUT TRUNCATED]"
        )

    @staticmethod
    def _normalise_process_output(
        output,
    ) -> str:
        if output is None:
            return ""

        if isinstance(
            output,
            bytes,
        ):
            return output.decode(
                "utf-8",
                errors="replace",
            )

        return str(output)