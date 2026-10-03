from __future__ import annotations

from urllib.parse import quote
import re

from github import Github


class GitHubService:
    def __init__(self, access_token: str):
        if not access_token:
            raise ValueError("GitHub access token is required")

        self.access_token = access_token
        self.client = Github(access_token)

    # ============================================================
    # Basic GitHub operations
    # ============================================================

    def get_user(self):
        return self.client.get_user().login

    def get_repositories(self):
        user = self.client.get_user()

        return [
            {
                "name": repo.name,
                "full_name": repo.full_name,
                "private": repo.private,
            }
            for repo in user.get_repos()
        ]

    def get_pull_requests(self, repo_name):
        repo = self.client.get_repo(repo_name)

        pulls = repo.get_pulls(state="open")

        return [
            {
                "number": pr.number,
                "title": pr.title,
                "author": pr.user.login,
                "url": pr.html_url,
                "state": pr.state,
            }
            for pr in pulls
        ]

    def get_pull_request_files(
        self,
        repo_name,
        pr_number,
    ):
        repo = self.client.get_repo(repo_name)

        pr = repo.get_pull(pr_number)

        files = pr.get_files()

        return [
            {
                "filename": file.filename,
                "status": file.status,
                "additions": file.additions,
                "deletions": file.deletions,
                "changes": file.changes,
                "patch": file.patch,
            }
            for file in files
        ]

    # ============================================================
    # Repository-aware analysis
    # ============================================================

    def get_pull_request_metadata(
        self,
        repo_name: str,
        pr_number: int,
    ):
        """
        Return the important PR/base/head information needed for
        repository-aware analysis.

        Includes the repository associated with both the BASE and
        HEAD revisions so pull requests from forks are handled
        correctly.
        """

        repo = self.client.get_repo(repo_name)

        pr = repo.get_pull(pr_number)

        return {
            "number": pr.number,
            "title": pr.title,
            "body": pr.body or "",
            "state": pr.state,
            "draft": pr.draft,
            "author": pr.user.login if pr.user else None,

            # ----------------------------------------------------
            # BASE revision
            # ----------------------------------------------------

            "base_branch": pr.base.ref,
            "base_sha": pr.base.sha,
            "base_repo_full_name": (
                pr.base.repo.full_name
                if pr.base.repo
                else repo_name
            ),

            # ----------------------------------------------------
            # HEAD revision
            # ----------------------------------------------------

            "head_branch": pr.head.ref,
            "head_sha": pr.head.sha,
            "head_repo_full_name": (
                pr.head.repo.full_name
                if pr.head.repo
                else repo_name
            ),

            "mergeable": pr.mergeable,
            "url": pr.html_url,
        }

    def get_file_content(
        self,
        repo_name: str,
        path: str,
        ref: str | None = None,
    ) -> str | None:
        """
        Retrieve a text file from a specific repository revision.

        Returns None when the file cannot be retrieved or is not
        a normal text/blob file.
        """

        repo = self.client.get_repo(repo_name)

        try:
            result = repo.get_contents(
                path,
                ref=ref,
            )
        except Exception:
            return None

        # GitHub returns a list for directories.
        if isinstance(result, list):
            return None

        try:
            content = result.decoded_content.decode(
                "utf-8",
                errors="replace",
            )
        except Exception:
            return None

        return content

    def get_repository_tree(
        self,
        repo_name: str,
        ref: str | None = None,
    ):
        """
        Return the repository tree for targeted repository-context
        discovery.

        `ref` may be:
        - an exact commit SHA
        - a branch name

        Pull-request analysis normally passes an exact HEAD SHA.
        Exact SHAs must be used directly and must not be resolved
        through `repo.get_branch()`.
        """

        repo = self.client.get_repo(repo_name)

        if ref is None:
            tree_sha = repo.get_branch(
                repo.default_branch
            ).commit.sha
        else:
            ref = str(ref).strip()

            # Exact commit SHA: use it directly.
            if re.fullmatch(
                r"[0-9a-fA-F]{40}",
                ref,
            ):
                tree_sha = ref
            else:
                # Otherwise treat the value as a branch name.
                tree_sha = repo.get_branch(
                    ref
                ).commit.sha

        tree = repo.get_git_tree(
            tree_sha,
            recursive=True,
        )

        return [
            {
                "path": item.path,
                "type": item.type,
                "size": getattr(item, "size", None),
            }
            for item in tree.tree
        ]

    def get_repository_file_contents(
        self,
        repo_name: str,
        paths: list[str],
        ref: str | None = None,
    ):
        """
        Retrieve multiple repository files.

        Files that cannot be retrieved are skipped rather than
        causing the entire analysis to fail.
        """

        results = []

        for path in paths:
            content = self.get_file_content(
                repo_name,
                path,
                ref=ref,
            )

            if content is None:
                continue

            results.append(
                {
                    "path": path,
                    "content": content,
                }
            )

        return results

    # ============================================================
    # Repository reference search
    # ============================================================

    def search_repository_references(
        self,
        repo_name: str,
        paths: list[str],
        search_terms: list[str],
        ref: str | None = None,
    ):
        """
        Search selected repository files for references to the
        supplied search terms.

        This is intentionally restricted to selected repository
        paths instead of searching the entire repository through
        repeated GitHub API requests.

        Returns files containing one or more of the supplied terms.
        """

        results = []

        for path in paths:
            content = self.get_file_content(
                repo_name,
                path,
                ref=ref,
            )

            if not content:
                continue

            matched_terms = []

            for term in search_terms:
                if not term:
                    continue

                if term in content:
                    matched_terms.append(term)

            if matched_terms:
                results.append(
                    {
                        "path": path,
                        "matched_terms": matched_terms,
                    }
                )

        return results

    # ============================================================
    # Authenticated repository access
    # ============================================================

    def get_authenticated_clone_url(
        self,
        repo_name: str,
    ) -> str:
        """
        Build an authenticated HTTPS clone URL for the repository.

        This URL is intended only for the repository workspace layer.

        It must never be:
        - sent to the AI model
        - returned by an API endpoint
        - written to logs
        - persisted in analysis results
        """

        if not repo_name or not repo_name.strip():
            raise ValueError("Repository name is required.")

        encoded_token = quote(
            self.access_token,
            safe="",
        )

        return (
            f"https://x-access-token:{encoded_token}"
            f"@github.com/{repo_name}.git"
        )