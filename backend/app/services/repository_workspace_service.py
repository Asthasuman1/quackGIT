from __future__ import annotations

import shutil
import subprocess
import tempfile
from pathlib import Path


class RepositoryWorkspace:
    """
    Represents an isolated local checkout of a repository revision.

    The workspace owns its temporary directory and removes it when
    cleanup() or the context manager exits.
    """

    def __init__(
        self,
        path: Path,
        *,
        repo_name: str,
        revision: str,
    ):
        self.path = path
        self.repo_name = repo_name
        self.revision = revision

    def cleanup(self) -> None:
        """
        Remove the workspace and all files beneath it.
        """

        if self.path.exists():
            shutil.rmtree(
                self.path,
                ignore_errors=True,
            )

    def __enter__(self):
        return self

    def __exit__(
        self,
        exc_type,
        exc_value,
        traceback,
    ):
        self.cleanup()


class RepositoryWorkspaceService:
    """
    Creates isolated local Git workspaces for repository revisions.

    This service is responsible only for obtaining source trees.

    It does NOT:
    - execute repository tests
    - execute arbitrary project commands
    - install dependencies
    - modify the user's working repository
    - push anything to GitHub

    A later validation layer can execute selected tests inside a
    separately hardened sandbox.
    """

    DEFAULT_TIMEOUT_SECONDS = 120

    def __init__(
        self,
        *,
        timeout_seconds: int = DEFAULT_TIMEOUT_SECONDS,
    ):
        self.timeout_seconds = max(
            1,
            timeout_seconds,
        )

    # ============================================================
    # Public API
    # ============================================================

    def create_workspace(
        self,
        *,
        clone_url: str,
        repo_name: str,
        revision: str,
    ) -> RepositoryWorkspace:
        """
        Clone a repository revision into a temporary directory.

        The returned workspace must eventually be cleaned up.

        Example:

            workspace = service.create_workspace(
                clone_url="https://github.com/org/repo.git",
                repo_name="org/repo",
                revision="abc123",
            )

            try:
                ...
            finally:
                workspace.cleanup()
        """

        if not clone_url.strip():
            raise ValueError(
                "Repository clone URL is required."
            )

        if not repo_name.strip():
            raise ValueError(
                "Repository name is required."
            )

        if not revision.strip():
            raise ValueError(
                "Repository revision is required."
            )

        workspace_path = Path(
            tempfile.mkdtemp(
                prefix="quackgit-repo-"
            )
        )

        try:
            self._clone_repository(
                clone_url=clone_url,
                destination=workspace_path,
            )

            self._checkout_revision(
                workspace_path=workspace_path,
                revision=revision,
            )

            return RepositoryWorkspace(
                workspace_path,
                repo_name=repo_name,
                revision=revision,
            )

        except Exception:
            shutil.rmtree(
                workspace_path,
                ignore_errors=True,
            )
            raise

    def create_base_and_head_workspaces(
        self,
        *,
        clone_url: str,
        repo_name: str,
        base_revision: str,
        head_revision: str,
    ) -> tuple[
        RepositoryWorkspace,
        RepositoryWorkspace,
    ]:
        """
        Create two independent workspaces:

        - BASE revision
        - PR HEAD revision

        They are completely separate directories so later
        validation can run the same test/input against both.
        """

        base_workspace = None
        head_workspace = None

        try:
            base_workspace = self.create_workspace(
                clone_url=clone_url,
                repo_name=repo_name,
                revision=base_revision,
            )

            head_workspace = self.create_workspace(
                clone_url=clone_url,
                repo_name=repo_name,
                revision=head_revision,
            )

            return (
                base_workspace,
                head_workspace,
            )

        except Exception:
            if base_workspace is not None:
                base_workspace.cleanup()

            if head_workspace is not None:
                head_workspace.cleanup()

            raise

    # ============================================================
    # Git operations
    # ============================================================

    def _clone_repository(
        self,
        *,
        clone_url: str,
        destination: Path,
    ) -> None:
        """
        Clone repository source into destination.

        Uses --no-checkout initially so the exact requested
        revision can be checked out explicitly afterwards.
        """

        command = [
            "git",
            "clone",
            "--no-checkout",
            "--filter=blob:none",
            clone_url,
            str(destination),
        ]

        self._run_git_command(
            command,
            cwd=None,
        )

    def _checkout_revision(
        self,
        *,
        workspace_path: Path,
        revision: str,
    ) -> None:
        """
        Fetch the requested revision if necessary and check it out.
        """

        fetch_command = [
            "git",
            "-C",
            str(workspace_path),
            "fetch",
            "--depth",
            "1",
            "origin",
            revision,
        ]

        fetch_result = self._run_git_command(
            fetch_command,
            cwd=None,
            allow_failure=True,
        )

        if fetch_result.returncode != 0:
            # The revision may already be available in the clone.
            # Continue to checkout and let Git provide the exact
            # failure if it is genuinely unavailable.
            pass

        checkout_command = [
            "git",
            "-C",
            str(workspace_path),
            "checkout",
            "--detach",
            revision,
        ]

        self._run_git_command(
            checkout_command,
            cwd=None,
        )

    # ============================================================
    # Command execution
    # ============================================================

    def _run_git_command(
        self,
        command: list[str],
        *,
        cwd: str | Path | None,
        allow_failure: bool = False,
    ) -> subprocess.CompletedProcess:
        """
        Execute one explicit Git command.

        shell=False is intentional.
        """

        try:
            result = subprocess.run(
                command,
                cwd=str(cwd) if cwd else None,
                capture_output=True,
                text=True,
                timeout=self.timeout_seconds,
                shell=False,
                check=False,
            )

        except subprocess.TimeoutExpired as exc:
            raise RuntimeError(
                "Git operation timed out."
            ) from exc

        except FileNotFoundError as exc:
            raise RuntimeError(
                "Git executable was not found. "
                "Install Git and ensure it is available on PATH."
            ) from exc

        if (
            result.returncode != 0
            and not allow_failure
        ):
            stderr = (
                result.stderr.strip()
                if result.stderr
                else ""
            )

            stdout = (
                result.stdout.strip()
                if result.stdout
                else ""
            )

            details = stderr or stdout or "unknown Git error"

            raise RuntimeError(
                f"Git operation failed "
                f"(exit code {result.returncode}): "
                f"{details}"
            )

        return result