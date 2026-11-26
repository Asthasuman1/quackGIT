
from __future__ import annotations

import re
import shutil
import subprocess
import tempfile
from pathlib import Path
from typing import Optional


class RepositoryWorkspace:
    """An isolated checkout of a repository revision."""

    def __init__(
        self,
        path: Path,
        *,
        repo_name: str,
        revision: str,
    ) -> None:
        self.path = path
        self.repo_name = repo_name
        self.revision = revision

    def cleanup(self) -> None:
        """Remove the temporary workspace and its contents."""
        if self.path.exists():
            shutil.rmtree(self.path, ignore_errors=True)

    def __enter__(self) -> "RepositoryWorkspace":
        return self

    def __exit__(
        self,
        exc_type,
        exc_value,
        traceback,
    ) -> None:
        self.cleanup()


class RepositoryWorkspaceService:
    """
    Create isolated Git workspaces for repository revisions.

    Responsibilities:
    - Check out BASE and HEAD independently.
    - Retrieve commit history and commit diffs.
    - Support configurable history depth.
    - Verify the checked-out revision.
    - Clean up temporary workspaces after failures.

    This service does not execute project code, install dependencies,
    run tests, modify the user's local repository, or push to GitHub.
    """

    DEFAULT_TIMEOUT_SECONDS = 120
    DEFAULT_HISTORY_DEPTH = 100
    DEFAULT_HISTORY_LIMIT = 50
    DEFAULT_DIFF_MAX_CHARS = 20_000

    def __init__(
        self,
        *,
        timeout_seconds: int = DEFAULT_TIMEOUT_SECONDS,
        history_depth: Optional[int] = DEFAULT_HISTORY_DEPTH,
    ) -> None:
        if not isinstance(timeout_seconds, int) or isinstance(
            timeout_seconds, bool
        ):
            raise ValueError("timeout_seconds must be a positive integer.")

        if timeout_seconds < 1:
            raise ValueError("timeout_seconds must be at least 1.")

        if history_depth is not None:
            if (
                not isinstance(history_depth, int)
                or isinstance(history_depth, bool)
                or history_depth < 1
            ):
                raise ValueError(
                    "history_depth must be a positive integer or None."
                )

        self.timeout_seconds = timeout_seconds

        # None means fetch full history rather than use a shallow clone.
        self.history_depth = history_depth

    # ============================================================
    # Public workspace API
    # ============================================================

    def create_workspace(
        self,
        *,
        clone_url: str,
        repo_name: str,
        revision: str,
    ) -> RepositoryWorkspace:
        """
        Create a temporary checkout at the requested revision.

        The caller is responsible for cleanup, preferably through
        a try/finally block or a context manager.
        """
        self._validate_required(clone_url, "clone_url")
        self._validate_required(repo_name, "repo_name")
        self._validate_revision(revision)

        workspace_path = Path(
            tempfile.mkdtemp(prefix="quackgit-repo-")
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
            shutil.rmtree(workspace_path, ignore_errors=True)
            raise

    def create_base_and_head_workspaces(
        self,
        *,
        clone_url: str,
        repo_name: str,
        base_revision: str,
        head_revision: str,
    ) -> tuple[RepositoryWorkspace, RepositoryWorkspace]:
        """
        Create independent BASE and HEAD workspaces.

        These separate checkouts allow a later validation service to
        compare behavior at the base revision and the PR revision.
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

            return base_workspace, head_workspace

        except Exception:
            if base_workspace is not None:
                base_workspace.cleanup()

            if head_workspace is not None:
                head_workspace.cleanup()

            raise

    # ============================================================
    # Historical evidence API
    # ============================================================

    def get_historical_commits(
        self,
        workspace: RepositoryWorkspace | str | Path,
        *,
        limit: int = DEFAULT_HISTORY_LIMIT,
        path: Optional[str] = None,
        since_revision: Optional[str] = None,
    ) -> list[dict[str, str]]:
        """
        Return recent Git commits as structured evidence.

        Each result contains:
        sha, author, date, subject, and body.

        If path is provided, only commits affecting that relative
        repository path are returned.

        If since_revision is provided, commits are restricted to
        since_revision..HEAD. The supplied revision must exist locally.
        """
        if not isinstance(limit, int) or isinstance(limit, bool) or limit < 1:
            raise ValueError("limit must be a positive integer.")

        if path is not None:
            path = self._validate_relative_path(path)

        workspace_path = self._workspace_path(workspace)

        command = [
            "git",
            "-C",
            str(workspace_path),
            "log",
            f"-{limit}",
            "--date=iso-strict",
            "--format=%H%x1f%an%x1f%aI%x1f%s%x1f%b%x1e",
        ]

        if since_revision is not None:
            self._validate_revision(since_revision)
            command.append(f"{since_revision}..HEAD")

        if path is not None:
            command.extend(["--", path])

        result = self._run_git_command(command, cwd=None)

        commits: list[dict[str, str]] = []

        for record in result.stdout.split("\x1e"):
            record = record.strip()

            if not record:
                continue

            fields = record.split("\x1f", 4)

            if len(fields) != 5:
                continue

            sha, author, date, subject, body = fields

            commits.append(
                {
                    "sha": sha.strip(),
                    "author": author.strip(),
                    "date": date.strip(),
                    "subject": subject.strip(),
                    "body": body.strip(),
                }
            )

        return commits

    def get_commit_diff(
        self,
        workspace: RepositoryWorkspace | str | Path,
        commit_sha: str,
        *,
        max_chars: int = DEFAULT_DIFF_MAX_CHARS,
    ) -> str:
        """
        Return a commit's textual diff for historical bug analysis.

        The output is truncated to max_chars to prevent excessively
        large diffs from consuming the entire model context.
        """
        self._validate_revision(commit_sha)

        if (
            not isinstance(max_chars, int)
            or isinstance(max_chars, bool)
            or max_chars < 1
        ):
            raise ValueError("max_chars must be a positive integer.")

        workspace_path = self._workspace_path(workspace)

        command = [
            "git",
            "-C",
            str(workspace_path),
            "show",
            "--format=fuller",
            "--no-ext-diff",
            "--no-renames",
            "--no-color",
            "--no-relative",
            commit_sha,
        ]

        result = self._run_git_command(command, cwd=None)
        diff = result.stdout

        if len(diff) > max_chars:
            marker = "\n\n[Diff truncated because it exceeded the configured limit.]"
            diff = diff[: max(0, max_chars - len(marker))] + marker

        return diff

    def get_changed_files_for_commit(
        self,
        workspace: RepositoryWorkspace | str | Path,
        commit_sha: str,
    ) -> list[str]:
        """Return repository-relative paths changed by a commit."""
        self._validate_revision(commit_sha)
        workspace_path = self._workspace_path(workspace)

        command = [
            "git",
            "-C",
            str(workspace_path),
            "diff-tree",
            "--root",
            "--no-commit-id",
            "--name-only",
            "-r",
            "-z",
            commit_sha,
        ]

        result = self._run_git_command(command, cwd=None)

        return [
            item
            for item in result.stdout.split("\x00")
            if item
        ]
        
    @staticmethod
    def _normalize_history_path(path: str) -> str:
        """Validate a repository-relative Git path."""
        if not isinstance(path, str):
            raise ValueError("Repository path must be a string.")

        normalized = path.replace("\\", "/").strip()
        parts = normalized.split("/")

        if (
            not normalized
            or normalized.startswith("/")
            or re.match(r"^[A-Za-z]:", normalized)
            or any(part in {"", ".", ".."} for part in parts)
        ):
            raise ValueError("Invalid repository-relative path.")

        return normalized

    def get_historical_commits(
        self,
        workspace_path: str | Path,
        *,
        path: str,
        limit: int = 20,
    ) -> list[dict]:
        """
        Return recent commits affecting one repository-relative path.

        The workspace must already be checked out at the PR HEAD.
        History is evidence for investigation, not proof of a defect.
        """
        repo_root = Path(workspace_path).resolve()

        if not repo_root.is_dir():
            raise ValueError("Repository workspace does not exist.")

        normalized_path = self._normalize_history_path(path)
        limit = max(1, min(int(limit), 50))

        command = [
            "git",
            "log",
            "-n",
            str(limit),
            "--date=iso-strict",
            "--format=%H%x1f%aI%x1f%an%x1f%s",
            "HEAD",
            "--",
            normalized_path,
        ]

        result = self._run_git_command(
            command,
            cwd=repo_root,
        )

        commits = []

        for line in result.stdout.splitlines():
            fields = line.split("\x1f", 3)

            if len(fields) != 4:
                continue

            sha, date, author, subject = fields

            if not re.fullmatch(
                r"(?:[0-9a-fA-F]{40}|[0-9a-fA-F]{64})",
                sha,
            ):
                continue

            def clean(value: str, maximum: int) -> str:
                value = re.sub(
                    r"[\x00-\x1f\x7f]+",
                    " ",
                    value,
                )
                return value.strip()[:maximum]

            commits.append(
                {
                    "sha": sha,
                    "date": clean(date, 80),
                    "author": clean(author, 120),
                    "subject": clean(subject, 300),
                }
            )

        return commits

    def get_commit_diff(
        self,
        workspace_path: str | Path,
        commit_sha: str,
        *,
        path: str,
        max_chars: int = 4000,
    ) -> str:
        """
        Return a bounded diff for one file at one historical commit.
        """
        repo_root = Path(workspace_path).resolve()

        if not repo_root.is_dir():
            raise ValueError("Repository workspace does not exist.")

        if not re.fullmatch(
            r"(?:[0-9a-fA-F]{40}|[0-9a-fA-F]{64})",
            str(commit_sha),
        ):
            raise ValueError("Invalid commit SHA.")

        normalized_path = self._normalize_history_path(path)
        max_chars = max(1, min(int(max_chars), 10000))

        command = [
            "git",
            "show",
            "--format=",
            "--no-ext-diff",
            "--unified=3",
            commit_sha,
            "--",
            normalized_path,
        ]

        result = self._run_git_command(
            command,
            cwd=repo_root,
        )

        diff = result.stdout.strip()

        if not diff:
            return "(No path-specific diff available for this commit.)"

        if len(diff) > max_chars:
            diff = (
                diff[:max_chars]
                + "\n[HISTORICAL DIFF TRUNCATED]"
            )

        return diff    

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
        Clone without checking out a branch.

        Partial clone reduces initial blob transfer where the remote
        supports Git's partial-clone protocol.
        """
        command = [
            "git",
            "clone",
            "--no-checkout",
            "--filter=blob:none",
        ]

        if self.history_depth is not None:
            command.extend(
                ["--depth", str(self.history_depth)]
            )

        command.extend(
            [
                "--",
                clone_url,
                str(destination),
            ]
        )

        self._run_git_command(command, cwd=None)

    def _checkout_revision(
        self,
        *,
        workspace_path: Path,
        revision: str,
    ) -> None:
        """Fetch the requested revision and check out its exact commit."""
        self._validate_revision(revision)

        fetch_command = [
            "git",
            "-C",
            str(workspace_path),
            "fetch",
            "--no-tags",
        ]

        if self.history_depth is not None:
            fetch_command.extend(
                ["--depth", str(self.history_depth)]
            )

        fetch_command.extend(
            ["origin", revision]
        )

        # A revision can already be available in the clone. If fetching
        # it by name fails, checkout below provides the final error.
        self._run_git_command(
            fetch_command,
            cwd=None,
            allow_failure=True,
        )

        checkout_command = [
            "git",
            "-C",
            str(workspace_path),
            "checkout",
            "--detach",
            revision,
        ]

        self._run_git_command(checkout_command, cwd=None)

        expected_result = self._run_git_command(
            [
                "git",
                "-C",
                str(workspace_path),
                "rev-parse",
                "--verify",
                f"{revision}^{{commit}}",
            ],
            cwd=None,
        )

        actual_result = self._run_git_command(
            [
                "git",
                "-C",
                str(workspace_path),
                "rev-parse",
                "HEAD",
            ],
            cwd=None,
        )

        expected_sha = expected_result.stdout.strip().lower()
        actual_sha = actual_result.stdout.strip().lower()

        if not expected_sha or actual_sha != expected_sha:
            raise RuntimeError(
                "Git checkout verification failed: "
                "HEAD does not match the requested revision."
            )

    # ============================================================
    # Validation helpers
    # ============================================================

    @staticmethod
    def _validate_required(value: str, field_name: str) -> None:
        if not isinstance(value, str) or not value.strip():
            raise ValueError(f"{field_name} is required.")

        if "\x00" in value:
            raise ValueError(f"{field_name} contains an invalid character.")

    @staticmethod
    def _validate_revision(revision: str) -> None:
        """
        Validate a revision argument before passing it to Git.

        This prevents option injection. Git remains responsible for
        determining whether the revision exists in the repository.
        """
        if not isinstance(revision, str) or not revision.strip():
            raise ValueError("Repository revision is required.")

        if (
            revision.startswith("-")
            or "\x00" in revision
            or "\n" in revision
            or "\r" in revision
        ):
            raise ValueError("Invalid repository revision.")

    @staticmethod
    def _validate_relative_path(path: str) -> str:
        """Reject absolute paths and parent-directory traversal."""
        if not isinstance(path, str) or not path.strip():
            raise ValueError("Repository path must not be empty.")

        if "\x00" in path:
            raise ValueError("Repository path contains an invalid character.")

        normalized = path.replace("\\", "/")
        candidate = Path(normalized)

        if candidate.is_absolute():
            raise ValueError("Absolute repository paths are not allowed.")

        if re.match(r"^[A-Za-z]:", normalized):
            raise ValueError("Absolute repository paths are not allowed.")

        if ".." in candidate.parts:
            raise ValueError("Parent-directory traversal is not allowed.")

        return normalized

    @staticmethod
    def _workspace_path(
        workspace: RepositoryWorkspace | str | Path,
    ) -> Path:
        """Accept either a workspace object or its local path."""
        if isinstance(workspace, RepositoryWorkspace):
            path = workspace.path
        else:
            path = Path(workspace)

        if not path.exists() or not path.is_dir():
            raise ValueError("Repository workspace does not exist.")

        if not (path / ".git").exists():
            raise ValueError("The supplied directory is not a Git workspace.")

        return path

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
        Run a Git command without a shell.

        Error messages redact URL credentials and avoid exposing
        the full command, which may contain a private clone URL.
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
                f"Git operation timed out after "
                f"{self.timeout_seconds} seconds."
            ) from exc

        except FileNotFoundError as exc:
            raise RuntimeError(
                "Git executable was not found. "
                "Install Git and ensure it is available on PATH."
            ) from exc

        if result.returncode != 0 and not allow_failure:
            details = (
                result.stderr.strip()
                or result.stdout.strip()
                or "unknown Git error"
            )

            # Redact credentials embedded in HTTP(S) URLs.
            details = re.sub(
                r"(https?://)[^/@\s]+:[^/@\s]+@",
                r"\1[REDACTED]@",
                details,
                flags=re.IGNORECASE,
            )

            raise RuntimeError(
                "Git operation failed "
                f"(exit code {result.returncode}): {details}"
            )

        return result
