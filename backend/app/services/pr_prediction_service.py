from __future__ import annotations
import json
import re
from pathlib import Path
from app.github.github_service import GitHubService
from app.services.failure_prediction_service import FailurePredictionService
from app.services.validation_service import ValidationService
from app.services.repository_workspace_service import RepositoryWorkspaceService
from app.services.reproduction_validation_service import ReproductionValidationService

class PRPredictionService:
    """

    Repository-aware pull request analysis.

    Collects:

    - PR metadata

    - changed files

    - patches

    - repository tree

    - relevant repository files

    - tests

    - fixtures

    - project configuration

    - repository references

    - targeted behavioral validation

    Repository revisions are checked out into isolated temporary

    workspaces so BASE and PR HEAD can be compared using the actual

    source trees.

    Existing repository tests can be executed by the validation layer.

    Step 10:

        Runs the initial AI hypothesis/reproduction-planning pass.

    Step 11:

        Generates and differentially validates selected AI reproductions

        against exact BASE and exact PR HEAD revisions.

    Step 12:

        Executes selected existing repository tests.

    Step 13:

        Performs final AI synthesis and best-effort cleanup without masking

        the primary error.

    """
    MAX_CONTEXT_FILES = 40
    MAX_FILE_CHARS = 30000
    MAX_CONTEXT_CHARS = 250000
    MAX_REFERENCE_FILES = 25
    MAX_REFERENCE_TERMS = 20
    MAX_VALIDATION_TESTS = 5
    VALIDATION_TIMEOUT_SECONDS = 120
    MAX_HISTORICAL_FILES = 12
    MAX_HISTORICAL_COMMITS = 8
    MAX_HISTORICAL_DIFF_CHARS = 4000
    MAX_HISTORICAL_CONTEXT_CHARS = 24000
    IMPORTANT_ROOT_FILES = {
        "README.md",
        "README",
        "pyproject.toml",
        "requirements.txt",
        "requirements-dev.txt",
        "package.json",
        "package-lock.json",
        "pnpm-lock.yaml",
        "yarn.lock",
        "tsconfig.json",
        "go.mod",
        "go.sum",
        "Cargo.toml",
        "pom.xml",
        "build.gradle",
        "build.gradle.kts",
        "settings.gradle",
        "settings.gradle.kts",
        "Dockerfile",
        "docker-compose.yml",
        "docker-compose.yaml",
    }
    TEST_DIRECTORY_NAMES = {
        "test",
        "tests",
        "__tests__",
        "spec",
        "specs",
    }
    FIXTURE_DIRECTORY_NAMES = {
        "fixture",
        "fixtures",
        "sample",
        "samples",
        "testdata",
        "test_data",
    }
    IGNORED_PATH_PARTS = {
        ".git",
        "node_modules",
        "vendor",
        "dist",
        "build",
        ".next",
        ".venv",
        "venv",
        "__pycache__",
        ".pytest_cache",
        "coverage",
    }

    def __init__(self, access_token: str):
        self.github = GitHubService(access_token)
        self.prediction = FailurePredictionService()
        self.workspace_service = RepositoryWorkspaceService()
        self.validation = ValidationService(
            default_timeout_seconds=self.VALIDATION_TIMEOUT_SECONDS
        )
        self.reproduction = ReproductionValidationService(
            self.validation,
            model=self.prediction.model,
        )

    async def predict_pr(self, repo_name: str, pr_number: int):
        """

        Analyze a PR using repository-aware context.

        The analysis uses:

        - PR metadata

        - GitHub patch information

        - repository context

        - exact BASE revision

        - exact PR HEAD revision

        - BASE/HEAD source snapshots

        - initial AI hypothesis/reproduction planning

        - targeted execution of discovered repository tests

        - final AI synthesis

        """
        metadata = self.github.get_pull_request_metadata(
            repo_name,
            pr_number,
        )
        changed_files = self.github.get_pull_request_files(
            repo_name,
            pr_number,
        )
        if not changed_files:
            raise ValueError(
                "No changed files were available for this pull request."
            )
        patches_available = any(
            file.get("patch")
            for file in changed_files
        )
        if not patches_available:
            raise ValueError(
                "No patch data was available for this pull request."
            )

        base_repo = (
            metadata.get("base_repo_full_name")
            or repo_name
        )
        head_repo = (
            metadata.get("head_repo_full_name")
            or repo_name
        )

        base_sha = metadata.get("base_sha")
        head_sha = metadata.get("head_sha")

        if not base_sha:
            raise ValueError(
                "Pull request BASE SHA is unavailable."
            )

        if not head_sha:
            raise ValueError(
                "Pull request HEAD SHA is unavailable."
            )

        repository_tree = self.github.get_repository_tree(
            head_repo,
            ref=head_sha,
        )

        base_workspace = None
        head_workspace = None

        try:
            (
                base_workspace,
                head_workspace,
            ) = self._create_pr_workspaces(
                base_repo=base_repo,
                head_repo=head_repo,
                base_sha=base_sha,
                head_sha=head_sha,
            )

            (
                context,
                test_analysis,
            ) = self._build_repository_context(
                repo_name=repo_name,
                metadata=metadata,
                changed_files=changed_files,
                repository_tree=repository_tree,
            )

            revision_evidence = self._build_revision_evidence(
                changed_files=changed_files,
                base_workspace=base_workspace.path,
                head_workspace=head_workspace.path,
            )

            if revision_evidence.strip():
                context = (
                    f"{context}\n\n"
                    f"{revision_evidence}"
                )
                
            historical_evidence = self._build_historical_evidence(
                changed_files=changed_files,
                head_workspace=head_workspace.path,
                head_sha=head_sha,
            )

            if historical_evidence.strip():
                context = (
                    f"{context}\n\n"
                    f"{historical_evidence}"
                )    

            if not context.strip():
                raise ValueError(
                    "No usable repository context was available for this pull request."
                )

            initial_context = self._build_initial_analysis_context(
                context
            )

            initial_analysis = await self.prediction.predict(
                initial_context,
                filename=f"{repo_name} PR #{pr_number}",
                language=self._detect_primary_language(
                    changed_files
                ),
                mode="pull_request",
            )

            initial_analysis_payload = initial_analysis.model_dump()

            reproduction_validation = (
                await self.reproduction.validate_reproduction_plans(
                    initial_analysis=initial_analysis_payload,
                    repository_context=context,
                    base_workspace=base_workspace.path,
                    head_workspace=head_workspace.path,
                    language=self._detect_primary_language(
                        changed_files
                    ),
                )
            )

            validation_analysis = self._run_targeted_validation(
                test_analysis=test_analysis,
                head_workspace=head_workspace.path,
            )

            final_context = self._build_final_analysis_context(
                base_context=context,
                initial_analysis=initial_analysis_payload,
                validation_analysis=validation_analysis,
                reproduction_validation=reproduction_validation,
            )

            if not final_context.strip():
                raise ValueError(
                    "No usable evidence was available for final AI synthesis."
                )

            return await self.prediction.predict(
                final_context,
                filename=f"{repo_name} PR #{pr_number}",
                language=self._detect_primary_language(
                    changed_files
                ),
                mode="pull_request",
            )

        finally:
            self._cleanup_workspace(base_workspace)
            self._cleanup_workspace(head_workspace)

    @staticmethod
    def _build_initial_analysis_context(
        base_context: str,
    ) -> str:
        """

        Build the evidence package for the initial AI analysis pass.

        This pass is responsible for finding concrete repository-supported

        hypotheses and deciding whether a minimal reproduction would be

        useful.

        No generated reproduction is considered executed at this stage.

        """
        return f"""

============================================================

INITIAL AI ANALYSIS

============================================================

You are performing the initial repository-aware analysis pass.

Your job is to identify concrete, evidence-supported findings from

the supplied pull request and repository evidence.

For every meaningful finding:

- identify exactly what is wrong

- identify exactly where it occurs

- explain why the behavior is wrong

- explain the root cause

- explain the potential impact

- assign an appropriate severity

- provide a concrete remediation

Also determine whether a minimal reproduction would materially help

validate the suspected behavior.

REPRODUCTION PLANNING RULES:

- Only propose a reproduction when the repository evidence supports a

  concrete failure hypothesis.

- A reproduction plan is a hypothesis/testing plan, not proof.

- Do not claim that any generated test has been executed.

- Do not invent runtime output, exceptions, stack traces, exit codes,

  or BASE/HEAD behavior.

- Do not create generic tests merely because a test is possible.

- Do not create tests for style-only issues or unsupported speculation.

- Prefer a small, focused reproduction of the actual suspected failure.

- The downstream system may execute only a small number of meaningful

  reproduction plans.

- Treat 5 reproduction plans as an absolute ceiling, not a target.

- Preserve all meaningful findings even when no reproduction is needed.

The supplied context is the only repository evidence available to this

analysis pass. Do not assume unseen files, configuration, deployment

behavior, external services, or runtime state.

============================================================

REPOSITORY / PR EVIDENCE

============================================================

{base_context}

""".strip()

    def _build_final_analysis_context(
        self,
        *,
        base_context: str,
        initial_analysis: dict,
        validation_analysis: dict,
        reproduction_validation: dict,
    ) -> str:
        """

        Build the final evidence package supplied to the AI.

        The final pass receives:

        - repository/static evidence

        - initial AI hypotheses

        - reproduction plans

        - actual repository validation evidence

        This method does not invent runtime observations.

        """
        initial_json = json.dumps(
            initial_analysis,
            ensure_ascii=False,
            indent=2,
            default=str,
        )

        validation_json = json.dumps(
            validation_analysis,
            ensure_ascii=False,
            indent=2,
            default=str,
        )

        reproduction_json = json.dumps(
            reproduction_validation,
            ensure_ascii=False,
            indent=2,
            default=str,
        )

        return f"""

============================================================

FINAL AI EVIDENCE HANDOFF

============================================================

The final analysis pass receives three evidence layers:

1. Repository/static evidence.

2. Initial AI hypotheses and reproduction plans.

3. Actual repository validation evidence.

The initial AI output is a hypothesis/planning artifact.

It is NOT runtime proof.

============================================================

INITIAL AI HYPOTHESES / REPRODUCTION PLANS

============================================================

{initial_json}

============================================================

ACTUAL VALIDATION EVIDENCE

============================================================

{validation_json}

============================================================

AI-GENERATED REPRODUCTION VALIDATION

============================================================

{reproduction_json}

============================================================

REPOSITORY / PR ANALYSIS CONTEXT

============================================================

{base_context}

============================================================

VALIDATION AND REPRODUCTION RULES

============================================================

- Treat repository/static reasoning as evidence, not runtime proof.

- Treat the initial AI analysis as hypotheses and planning, not proof.

- reproduction_plan.needed=True means a concrete reproduction appears

  useful; it does NOT mean the failure was reproduced.

- AI-generated reproduction plans are hypotheses until execution evidence exists.

- The reproduction-validation section may contain generated test source and

  captured BASE/HEAD execution evidence.

- Use only captured execution data when describing reproduction results.

- Existing repository tests may have been executed; use only their actual

  returned status and captured output.

- NOT_TESTED means no corresponding execution occurred.

- VALIDATED means an executed test or command completed successfully.

- OBSERVED means the relevant behavior was directly observed during

  execution.

- NOT_REPRODUCED means validation was attempted but the suspected behavior

  did not occur under the tested conditions.

- Never invent test results, exceptions, stack traces, exit codes, stdout,

  stderr, BASE behavior, or PR HEAD behavior.

- Never convert an unexecuted reproduction plan into an observed failure.

- Never upgrade a static finding to runtime proof without actual execution

  evidence.

- Preserve the distinction between static support, planned reproduction,

  validation attempt, and observed runtime behavior.

- REGRESSION_OBSERVED requires BASE=VALIDATED and HEAD=OBSERVED for the same reproduction.

- PRE_EXISTING_FAILURE means BASE and HEAD both failed the same reproduction.

- NO_REGRESSION_OBSERVED means BASE and HEAD both passed.

- BEHAVIOR_IMPROVED means BASE failed and HEAD passed.

- INCONCLUSIVE means the differential evidence was insufficient.


============================================================

INDEPENDENT FINDING COMPLETENESS SWEEP

============================================================

Perform a deliberate second review of the supplied evidence before
finalizing the findings.

- Re-examine each changed file and its BASE-versus-HEAD evidence.
- Trace relevant callers, callees, data flow, error handling,
  configuration, tests, and available historical fixes.
- Look for missed boundary conditions, compatibility issues,
  unintended side effects, and distinct regression mechanisms.
- Do not merely repeat the initial AI findings.
- Merge duplicate findings with the same underlying root cause.
- For each candidate, establish the affected code, failure mechanism,
  triggering conditions, impact, and connection to this PR.
- Treat historical commits as context, not proof of a current defect.
- Do not invent files, historical fixes, or execution results.
- Preserve valid static findings when runtime validation is inconclusive.
- Report every distinct finding that meets the existing strict
  evidence-acceptance criteria; do not impose an arbitrary total-finding
  cap or lower the evidence threshold to increase the count.

============================================================


============================================================

FINAL SYNTHESIS REQUIREMENTS

============================================================

Use the repository evidence, initial hypotheses, reproduction plans,

and actual validation evidence above.

For each final finding:

1. Verify that repository-specific evidence supports it.

2. Preserve the most precise supported location.

3. Explain what is wrong, why it is wrong, root cause, impact,

   severity, and remediation.

4. Keep independent root causes separate.

5. Merge findings that are genuinely duplicates of the same root cause.

6. Use actual validation evidence when available.

7. Use NOT_TESTED only when no corresponding execution occurred.
   If execution occurred but the BASE-versus-HEAD evidence is
   insufficient, preserve the INCONCLUSIVE differential result.
   Do not claim that a regression was observed without sufficient
   supporting evidence.

8. Do not invent missing runtime evidence.

9. Do not describe an unexecuted generated reproduction as observed.

10. Preserve the reproduction plan when it remains meaningful.

11. Do not treat NOT_REPRODUCED as proof that a static finding
    is false; state that the suspected behavior was not reproduced
    under the tested conditions.

12. Mark a finding OBSERVED only when the supplied execution
    evidence directly supports that finding.

13. Do not treat a successful unrelated repository test as proof
    that a suspected regression is absent.

14. Keep findings supported by static evidence when runtime
    validation is inconclusive, but clearly distinguish them
    from confirmed runtime failures.

The reproduction validation stage determines whether a selected reproduction

reproduces the suspected behavior in BASE, HEAD, both, neither, or an

inconclusive state.

""".strip()

    @staticmethod
    def _cleanup_workspace(workspace) -> None:
        """

        Best-effort cleanup for a temporary repository workspace.

        Cleanup failures are intentionally swallowed so they cannot

        replace the primary analysis or validation result.

        """
        if workspace is None:
            return
        try:
            workspace.cleanup()
        except Exception:
            pass

    def _create_pr_workspaces(
        self,
        *,
        base_repo: str,
        head_repo: str,
        base_sha: str,
        head_sha: str,
    ):
        """

        Create isolated workspaces for the exact BASE and HEAD

        revisions.

        Authentication is handled only by the GitHub/repository

        checkout layer.

        No authenticated clone URL is included in AI context.

        """
        if not base_repo.strip():
            raise ValueError(
                "BASE repository name is required."
            )
        if not head_repo.strip():
            raise ValueError(
                "HEAD repository name is required."
            )
        if not base_sha.strip():
            raise ValueError(
                "BASE revision is required."
            )
        if not head_sha.strip():
            raise ValueError(
                "HEAD revision is required."
            )

        base_clone_url = self.github.get_authenticated_clone_url(
            base_repo
        )

        head_clone_url = self.github.get_authenticated_clone_url(
            head_repo
        )

        base_workspace = None
        head_workspace = None

        
        try:
            base_workspace = (
                self.workspace_service.create_workspace(
                    clone_url=base_clone_url,
                    repo_name=base_repo,
                    revision=base_sha,
                )
            )

            head_workspace = (
                self.workspace_service.create_workspace(
                    clone_url=head_clone_url,
                    repo_name=head_repo,
                    revision=head_sha,
                )
            )

            return (
                base_workspace,
                head_workspace,
            )

        except Exception:
            if base_workspace is not None:
                try:
                    base_workspace.cleanup()
                except Exception:
                    pass

            if head_workspace is not None:
                try:
                    head_workspace.cleanup()
                except Exception:
                    pass

            raise


    def _read_workspace_file(
        self,
        *,
        workspace: Path,
        relative_path: str,
    ) -> str | None:
        """

        Safely read a file from a checked-out repository workspace.

        The resolved path must remain inside the workspace.

        """
        if not relative_path:
            return None

        workspace_root = workspace.resolve()

        candidate = (
            workspace_root / relative_path
        ).resolve()

        try:
            candidate.relative_to(
                workspace_root
            )
        except ValueError:
            return None

        if not candidate.is_file():
            return None

        try:
            return candidate.read_text(
                encoding="utf-8",
                errors="replace",
            )
        except OSError:
            return None

    def _build_revision_evidence(
        self,
        *,
        changed_files: list[dict],
        base_workspace: Path,
        head_workspace: Path,
    ) -> str:
        """

        Build exact BASE-versus-HEAD source evidence for changed

        files.

        Credentials and clone URLs are never included.

        """
        sections = [
            "============================================================",
            "BASE VS PR HEAD SOURCE EVIDENCE",
            "============================================================",
        ]

        included = 0
        total_chars = 0

        for file in changed_files:
            filename = file.get("filename")

            if not filename:
                continue

            base_content = self._read_workspace_file(
                workspace=base_workspace,
                relative_path=filename,
            )

            head_content = self._read_workspace_file(
                workspace=head_workspace,
                relative_path=filename,
            )

            if base_content is not None:
                if len(base_content) > self.MAX_FILE_CHARS:
                    base_content = (
                        base_content[: self.MAX_FILE_CHARS]
                        + "\n\n[BASE FILE TRUNCATED]"
                    )
            else:
                base_content = (
                    "(file does not exist in BASE)"
                )

            if head_content is not None:
                if len(head_content) > self.MAX_FILE_CHARS:
                    head_content = (
                        head_content[: self.MAX_FILE_CHARS]
                        + "\n\n[PR HEAD FILE TRUNCATED]"
                    )
            else:
                head_content = (
                    "(file does not exist in PR HEAD)"
                )

            section = f"""

FILE:

{filename}

BASE REVISION:

{base_content}

PR HEAD REVISION:

{head_content}

""".strip()

            remaining = (
                self.MAX_CONTEXT_CHARS
                - total_chars
            )

            if remaining <= 0:
                break

            if len(section) > remaining:
                section = (
                    section[:remaining]
                    + "\n\n[REVISION EVIDENCE TRUNCATED]"
                )

            sections.append(section)

            total_chars += len(section)
            included += 1

        if included == 0:
            sections.append(
                "(No changed-file source snapshots were available.)"
            )

        return "\n\n".join(sections)
    
    
    
    def _build_historical_evidence(
        self,
        *,
        changed_files: list[dict],
        head_workspace: Path,
        head_sha: str,
    ) -> str:
        """Collect bounded, path-specific historical evidence."""
        sections = [
            "============================================================",
            "HISTORICAL REPOSITORY EVIDENCE",
            "============================================================",
            (
                "Historical commits are clues, not proof of a current "
                "defect. Verify every proposed finding against the PR."
            ),
        ]

        seen_commit_paths: set[tuple[str, str]] = set()
        seen_paths: set[str] = set()

        total_chars = sum(len(section) for section in sections)
        commit_count = 0

        # Consider only unique, non-removed changed files.
        changed_paths = []

        for item in changed_files:
            path = item.get("filename")

            if (
                not path
                or item.get("status") == "removed"
                or path in seen_paths
            ):
                continue

            seen_paths.add(path)
            changed_paths.append(path)

            if len(changed_paths) >= self.MAX_HISTORICAL_FILES:
                break

        for path in changed_paths:
            if (
                commit_count >= self.MAX_HISTORICAL_COMMITS
                or total_chars >= self.MAX_HISTORICAL_CONTEXT_CHARS
            ):
                break

            try:
                commits = self.workspace_service.get_historical_commits(
                    head_workspace,
                    limit=20,
                    path=path,
                )
            except (RuntimeError, ValueError):
                continue

            for commit in commits:
                sha = (commit.get("sha") or "").strip()

                if not sha:
                    continue

                normalized_sha = sha.lower()
                commit_path_key = (normalized_sha, path)

                # The same commit may be relevant to different files.
                # Deduplicate only repeated commit/file combinations.
                if commit_path_key in seen_commit_paths:
                    continue

                seen_commit_paths.add(commit_path_key)

                # Do not include the current PR HEAD as historical evidence.
                if normalized_sha == (head_sha or "").strip().lower():
                    continue

                if (
                    commit_count >= self.MAX_HISTORICAL_COMMITS
                    or total_chars >= self.MAX_HISTORICAL_CONTEXT_CHARS
                ):
                    break

                try:
                    diff = self.workspace_service.get_commit_diff(
                        head_workspace,
                        sha,
                        path=path,
                        max_chars=self.MAX_HISTORICAL_DIFF_CHARS,
                    )
                except (RuntimeError, ValueError):
                    diff = "(Historical diff unavailable.)"

                entry = (
                    f"\n\nCOMMIT: {sha}\n"
                    f"DATE: {commit.get('date', 'unknown')}\n"
                    f"AUTHOR: {commit.get('author', 'unknown')}\n"
                    f"SUBJECT: {commit.get('subject', 'unknown')}\n"
                    f"RELATED FILE: {path}\n"
                    f"DIFF:\n{diff}"
                )

                remaining = (
                    self.MAX_HISTORICAL_CONTEXT_CHARS - total_chars
                )

                if remaining <= 0:
                    break

                if len(entry) > remaining:
                    marker = "\n[HISTORICAL ENTRY TRUNCATED]"

                    if remaining <= len(marker):
                        break

                    entry = entry[:remaining - len(marker)] + marker

                sections.append(entry)
                total_chars += len(entry)
                commit_count += 1

            if (
                commit_count >= self.MAX_HISTORICAL_COMMITS
                or total_chars >= self.MAX_HISTORICAL_CONTEXT_CHARS
            ):
                break

        if commit_count == 0:
            sections.append(
                "No usable historical commits were found. "
                "This does not prove that no historical fixes exist."
            )

        return "\n".join(sections)



    def _build_repository_context(
        self,
        *,
        repo_name: str,
        metadata: dict,
        changed_files: list[dict],
        repository_tree: list[dict],
    ) -> tuple[str, dict]:
        sections = []

        sections.append(
            self._format_pr_metadata(
                metadata
            )
        )

        sections.append(
            self._format_changed_files(
                changed_files
            )
        )

        changed_paths = [
            file.get("filename")
            for file in changed_files
            if file.get("filename")
        ]

        candidate_paths = self._select_relevant_paths(
            changed_paths=changed_paths,
            repository_tree=repository_tree,
        )

        head_repo = (
            metadata.get("head_repo_full_name")
            or repo_name
        )

        repository_files = (
            self.github.get_repository_file_contents(
                head_repo,
                candidate_paths,
                ref=metadata["head_sha"],
            )
        )

        search_terms = self._extract_reference_terms(
            changed_files=changed_files
        )

        reference_paths = [
            item.get("path")
            for item in repository_files
            if item.get("path")
        ]

        repository_references = (
            self._search_loaded_repository_references(
                repository_files=repository_files,
                search_terms=search_terms,
            )
        )

        if (
            not repository_references
            and reference_paths
            and search_terms
        ):
            repository_references = (
                self.github.search_repository_references(
                    head_repo,
                    reference_paths[
                        : self.MAX_REFERENCE_FILES
                    ],
                    search_terms,
                    ref=metadata["head_sha"],
                )
            )

        test_analysis = self._analyze_tests_and_fixtures(
            changed_files=changed_files,
            repository_files=repository_files,
            repository_references=repository_references,
        )

        sections.append(
            self._format_repository_files(
                repository_files
            )
        )

        sections.append(
            self._format_repository_references(
                repository_references
            )
        )

        sections.append(
            self._format_test_and_fixture_analysis(
                test_analysis
            )
        )

        context = "\n\n".join(
            section
            for section in sections
            if section.strip()
        )

        return (
            context,
            test_analysis,
        )

    @staticmethod
    def _format_pr_metadata(
        metadata: dict,
    ) -> str:
        return f"""

============================================================

PULL REQUEST METADATA

============================================================

PR Number:

{metadata.get("number")}

Title:

{metadata.get("title")}

Author:

{metadata.get("author")}

State:

{metadata.get("state")}

Draft:

{metadata.get("draft")}

Base Repository:

{metadata.get("base_repo_full_name")}

Base Branch:

{metadata.get("base_branch")}

Base SHA:

{metadata.get("base_sha")}

Head Repository:

{metadata.get("head_repo_full_name")}

Head Branch:

{metadata.get("head_branch")}

Head SHA:

{metadata.get("head_sha")}

Mergeable:

{metadata.get("mergeable")}

PR Description:

{metadata.get("body") or "(no PR description)"}

""".strip()

    @staticmethod
    def _format_changed_files(
        changed_files: list[dict],
    ) -> str:
        sections = [
            "============================================================",
            "PULL REQUEST CHANGES",
            "============================================================",
        ]

        for file in changed_files:
            filename = file.get(
                "filename",
                "unknown",
            )

            status = file.get(
                "status",
                "unknown",
            )

            additions = file.get(
                "additions",
                0,
            )

            deletions = file.get(
                "deletions",
                0,
            )

            changes = file.get(
                "changes",
                0,
            )

            patch = file.get(
                "patch"
            ) or ""

            sections.append(
                f"""

FILE:

{filename}

STATUS:

{status}

CHANGES:

+{additions} -{deletions}

TOTAL CHANGED LINES:

{changes}

PATCH:

{patch if patch else "(patch unavailable)"}

""".strip()
            )

        return "\n\n".join(sections)

    def _select_relevant_paths(
        self,
        *,
        changed_paths: list[str],
        repository_tree: list[dict],
    ) -> list[str]:
        tree_paths = [
            item.get("path")
            for item in repository_tree
            if item.get("type") == "blob"
            and item.get("path")
        ]

        tree_paths = [
            path
            for path in tree_paths
            if not self._should_ignore_path(path)
        ]

        scores: dict[str, int] = {}

        for path in changed_paths:
            if path in tree_paths:
                scores[path] = 10_000

        for path in tree_paths:
            filename = Path(path).name

            if filename in self.IMPORTANT_ROOT_FILES:
                scores[path] = max(
                    scores.get(path, 0),
                    900,
                )

        for path in tree_paths:
            if self._is_test_path(path):
                score = 700

                if self._matches_changed_file(
                    path,
                    changed_paths,
                ):
                    score += 800

                scores[path] = max(
                    scores.get(path, 0),
                    score,
                )

        for path in tree_paths:
            if self._is_fixture_path(path):
                scores[path] = max(
                    scores.get(path, 0),
                    500,
                )

        for path in tree_paths:
            if path in changed_paths:
                continue

            if self._matches_changed_file(
                path,
                changed_paths,
            ):
                scores[path] = max(
                    scores.get(path, 0),
                    650,
                )

        ranked_paths = sorted(
            scores,
            key=lambda path: (
                scores[path],
                -len(path),
            ),
            reverse=True,
        )

        return ranked_paths[
            : self.MAX_CONTEXT_FILES
        ]

    def _format_repository_files(
        self,
        repository_files: list[dict],
    ) -> str:
        sections = [
            "============================================================",
            "RELEVANT REPOSITORY CONTEXT",
            "============================================================",
        ]

        total_chars = 0

        for item in repository_files:
            path = item.get(
                "path",
                "unknown",
            )

            content = item.get(
                "content",
                "",
            )

            if not content:
                continue

            if len(content) > self.MAX_FILE_CHARS:
                content = (
                    content[: self.MAX_FILE_CHARS]
                    + "\n\n[FILE TRUNCATED BY ANALYSIS LIMIT]"
                )

            remaining = (
                self.MAX_CONTEXT_CHARS
                - total_chars
            )

            if remaining <= 0:
                break

            if len(content) > remaining:
                content = (
                    content[:remaining]
                    + "\n\n[REPOSITORY CONTEXT TRUNCATED]"
                )

            sections.append(
                f"""

FILE:

{path}

CONTENT:

{content}

""".strip()
            )

            total_chars += len(content)

        if len(sections) == 3:
            sections.append(
                "(No additional repository files were available.)"
            )

        return "\n\n".join(sections)

    def _extract_reference_terms(
        self,
        *,
        changed_files: list[dict],
    ) -> list[str]:
        terms: list[str] = []

        def add_term(term: str):
            term = term.strip()

            if not term:
                return

            if len(term) < 3:
                return

            if len(term) > 120:
                return

            if term not in terms:
                terms.append(term)

        definition_patterns = [
            r"^\+\s*(?:async\s+)?def\s+([A-Za-z_]\w*)",
            r"^\+\s*class\s+([A-Za-z_]\w*)",
            r"^\+\s*(?:export\s+)?(?:async\s+)?function\s+([A-Za-z_]\w*)",
            r"^\+\s*(?:export\s+)?class\s+([A-Za-z_]\w*)",
            r"^\+\s*func\s+(?:\([^)]*\)\s*)?([A-Za-z_]\w*)",
            r"^\+\s*fn\s+([A-Za-z_]\w*)",
        ]

        import_patterns = [
            r"^\+\s*from\s+([A-Za-z_][\w.]*)\s+import",
            r"^\+\s*import\s+([A-Za-z_][\w.]*)",
            r'''require\([\'"]([^\'"]+)[\'"]\)''',
            r'^\+\s*import\s+.*?\s+from\s+[\'"]([^\'"]+)[\'"]',
            r'^\+\s*import\s+[\'"]([^\'"]+)[\'"]',
        ]

        for file in changed_files:
            filename = (
                file.get("filename")
                or ""
            )

            patch = (
                file.get("patch")
                or ""
            )

            if filename:
                normalized = filename.replace(
                    "\\",
                    "/",
                )

                add_term(normalized)

                stem = Path(
                    normalized
                ).stem

                if stem:
                    add_term(stem)

                module_path = normalized

                for suffix in (
                    ".py",
                    ".js",
                    ".jsx",
                    ".ts",
                    ".tsx",
                    ".java",
                    ".go",
                    ".rs",
                    ".rb",
                    ".php",
                    ".cs",
                    ".cpp",
                    ".cc",
                    ".c",
                ):
                    if module_path.endswith(suffix):
                        module_path = module_path[
                            :-len(suffix)
                        ]
                        break

                module_path = module_path.replace(
                    "/",
                    ".",
                )

                if module_path:
                    add_term(module_path)

            for line in patch.splitlines():
                for pattern in definition_patterns:
                    match = re.search(
                        pattern,
                        line,
                    )

                    if match:
                        add_term(
                            match.group(1)
                        )

                for pattern in import_patterns:
                    match = re.search(
                        pattern,
                        line,
                    )

                    if match:
                        add_term(
                            match.group(1)
                        )

        return terms[
            : self.MAX_REFERENCE_TERMS
        ]

    def _search_loaded_repository_references(
        self,
        *,
        repository_files: list[dict],
        search_terms: list[str],
    ) -> list[dict]:
        if (
            not repository_files
            or not search_terms
        ):
            return []

        results = []

        for item in repository_files:
            path = item.get(
                "path"
            )

            if not path:
                continue

            content = (
                item.get("content")
                or ""
            )

            if not content:
                continue

            matched_terms = []

            for term in search_terms:
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

    def _format_repository_references(
        self,
        repository_references: list[dict],
    ) -> str:
        sections = [
            "============================================================",
            "REPOSITORY REFERENCES",
            "============================================================",
        ]

        if not repository_references:
            sections.append(
                "No references to the extracted changed symbols "
                "or module names were found in the selected "
                "repository context."
            )

            return "\n\n".join(sections)

        for item in repository_references:
            path = item.get(
                "path",
                "unknown",
            )

            matched_terms = item.get(
                "matched_terms",
                [],
            )

            if isinstance(
                matched_terms,
                list,
            ):
                terms = ", ".join(
                    str(term)
                    for term in matched_terms
                )
            else:
                terms = str(matched_terms)

            sections.append(
                f"""

FILE:

{path}

MATCHED REFERENCES:

{terms}

""".strip()
            )

        return "\n\n".join(sections)

    def _analyze_tests_and_fixtures(
        self,
        *,
        changed_files: list[dict],
        repository_files: list[dict],
        repository_references: list[dict],
    ) -> dict:
        changed_paths = [
            file.get("filename")
            for file in changed_files
            if file.get("filename")
        ]

        changed_terms = self._extract_reference_terms(
            changed_files=changed_files
        )

        test_files = []
        fixture_files = []

        for item in repository_files:
            path = item.get("path")

            if not path:
                continue

            if self._is_test_path(path):
                test_files.append(item)

            if self._is_fixture_path(path):
                fixture_files.append(item)

        related_tests = []

        for item in test_files:
            path = (
                item.get("path")
                or ""
            )

            content = (
                item.get("content")
                or ""
            )

            matched_terms = []

            for term in changed_terms:
                if term in content:
                    matched_terms.append(term)

            if self._matches_changed_file(
                path,
                changed_paths,
            ):
                if "file-name-match" not in matched_terms:
                    matched_terms.append(
                        "file-name-match"
                    )

            if matched_terms:
                related_tests.append(
                    {
                        "path": path,
                        "matched_terms": matched_terms,
                    }
                )

        related_fixtures = []

        for item in fixture_files:
            path = (
                item.get("path")
                or ""
            )

            content = (
                item.get("content")
                or ""
            )

            matched_terms = []

            for term in changed_terms:
                if (
                    term in path
                    or term in content
                ):
                    matched_terms.append(term)

            if matched_terms:
                related_fixtures.append(
                    {
                        "path": path,
                        "matched_terms": matched_terms,
                    }
                )

        return {
            "total_test_files": len(test_files),
            "total_fixture_files": len(fixture_files),
            "related_tests": related_tests,
            "related_fixtures": related_fixtures,
            "repository_references": repository_references,
        }

    def _format_test_and_fixture_analysis(
        self,
        analysis: dict,
    ) -> str:
        sections = [
            "============================================================",
            "TEST AND FIXTURE DISCOVERY",
            "============================================================",
        ]

        sections.append(
            f"""

TEST FILES DISCOVERED:

{analysis.get("total_test_files", 0)}

FIXTURE / SAMPLE FILES DISCOVERED:

{analysis.get("total_fixture_files", 0)}

""".strip()
        )

        related_tests = analysis.get(
            "related_tests",
            [],
        )

        if related_tests:
            sections.append("RELATED TESTS:")

            for item in related_tests:
                path = item.get(
                    "path",
                    "unknown",
                )

                terms = item.get(
                    "matched_terms",
                    [],
                )

                sections.append(
                    f"- {path}: "
                    f"{', '.join(str(term) for term in terms)}"
                )
        else:
            sections.append(
                "RELATED TESTS:\n"
                "No selected test file contained an extracted "
                "changed symbol/module reference."
            )

        related_fixtures = analysis.get(
            "related_fixtures",
            [],
        )

        if related_fixtures:
            sections.append(
                "\nRELATED FIXTURES / SAMPLE DATA:"
            )

            for item in related_fixtures:
                path = item.get(
                    "path",
                    "unknown",
                )

                terms = item.get(
                    "matched_terms",
                    [],
                )

                sections.append(
                    f"- {path}: "
                    f"{', '.join(str(term) for term in terms)}"
                )
        else:
            sections.append(
                "\nRELATED FIXTURES / SAMPLE DATA:\n"
                "No selected fixture or sample file contained "
                "an extracted changed symbol/module reference."
            )

        sections.append(
            """

INTERPRETATION RULES:

- Treat discovered tests and fixtures as repository evidence.

- A missing related test does NOT by itself prove a defect.

- Do not invent expected behavior when repository evidence is absent.

- If a changed behavior has an existing related test or fixture,

  use it to understand the repository's expected behavior.

- If a meaningful behavior appears to have no relevant test,

  classify it as a testing gap only when the changed behavior

  provides concrete evidence for that conclusion.

- Prefer specific missing coverage over generic "add tests" advice.

""".strip()
        )

        return "\n\n".join(sections)

    @staticmethod
    def _format_reproduction_validation(
        reproduction_validation: dict,
    ) -> str:
        payload = json.dumps(
            reproduction_validation,
            ensure_ascii=False,
            indent=2,
            default=str,
        )

        return f"""

============================================================

AI-GENERATED REPRODUCTION VALIDATION

============================================================

This section contains generated reproduction source and the actual

execution evidence returned by the validation service.

Interpretation rules:

- A reproduction plan alone is not proof.

- generated_test_source records the source prepared for execution.

- REGRESSION_OBSERVED requires BASE=VALIDATED and HEAD=OBSERVED.

- PRE_EXISTING_FAILURE means BASE and HEAD both failed.

- NO_REGRESSION_OBSERVED means BASE and HEAD both passed.

- BEHAVIOR_IMPROVED means BASE failed and HEAD passed.

- INCONCLUSIVE means a differential conclusion could not be established.

- Never invent missing stdout, stderr, exceptions, stack traces, or exit codes.

RESULT:

{payload}

""".strip()

    def _run_targeted_validation(
        self,
        *,
        test_analysis: dict,
        head_workspace: Path | None = None,
    ) -> dict:
        """

        Execute a bounded set of already-existing related repository

        tests against the checked-out PR HEAD workspace.

        AI-generated reproduction tests are not executed here.

        They are carried forward for the later secured validation stage.

        """
        related_tests = test_analysis.get(
            "related_tests",
            [],
        )

        if not related_tests:
            return {
                "status": "NOT_TESTED",
                "tests_considered": [],
                "results": [],
                "reason": (
                    "No related repository tests were discovered "
                    "in the selected analysis context."
                ),
            }

        test_paths = [
            item.get("path")
            for item in related_tests
            if item.get("path")
        ]

        test_paths = test_paths[
            : self.MAX_VALIDATION_TESTS
        ]

        if not test_paths:
            return {
                "status": "NOT_TESTED",
                "tests_considered": [],
                "results": [],
                "reason": (
                    "Related tests were discovered, but no usable "
                    "test paths were available."
                ),
            }

        if head_workspace is None:
            return {
                "status": "NOT_TESTED",
                "tests_considered": test_paths,
                "results": [],
                "reason": (
                    "Related tests were discovered, but no PR HEAD "
                    "workspace was supplied for execution."
                ),
            }

        workspace_path = Path(
            head_workspace
        ).resolve()

        if not workspace_path.exists():
            return {
                "status": "NOT_TESTED",
                "tests_considered": test_paths,
                "results": [],
                "reason": (
                    "The PR HEAD workspace does not exist."
                ),
            }

        if not workspace_path.is_dir():
            return {
                "status": "NOT_TESTED",
                "tests_considered": test_paths,
                "results": [],
                "reason": (
                    "The PR HEAD workspace is not a directory."
                ),
            }

        safe_test_paths: list[str] = []

        for test_path in test_paths:
            candidate = (
                workspace_path / test_path
            ).resolve()

            try:
                candidate.relative_to(
                    workspace_path
                )
            except ValueError:
                continue

            if not candidate.is_file():
                continue

            safe_test_paths.append(test_path)

        if not safe_test_paths:
            return {
                "status": "NOT_TESTED",
                "tests_considered": test_paths,
                "results": [],
                "reason": (
                    "The discovered test paths could not be "
                    "validated inside the PR HEAD workspace."
                ),
            }

        validation_result = self.validation.run_pytest(
            cwd=workspace_path,
            test_paths=safe_test_paths,
            timeout_seconds=self.VALIDATION_TIMEOUT_SECONDS,
        )

        result_dict = validation_result.to_dict()

        return {
            "status": result_dict.get(
                "status",
                "NOT_TESTED",
            ),
            "tests_considered": safe_test_paths,
            "results": [
                result_dict
            ],
            "reason": (
                "Targeted repository tests were executed against "
                "the PR HEAD workspace."
            ),
        }

    def _format_behavioral_validation(
        self,
        validation_analysis: dict,
    ) -> str:
        sections = [
            "============================================================",
            "BEHAVIORAL VALIDATION",
            "============================================================",
        ]

        status = validation_analysis.get(
            "status",
            "NOT_TESTED",
        )

        sections.append(
            f"VALIDATION STATUS:\n{status}"
        )

        tests_considered = validation_analysis.get(
            "tests_considered",
            [],
        )

        if tests_considered:
            sections.append(
                "\nTARGETED TEST CANDIDATES:"
            )

            for path in tests_considered:
                sections.append(
                    f"- {path}"
                )

        results = validation_analysis.get(
            "results",
            [],
        )

        if results:
            sections.append(
                "\nVALIDATION RESULTS:"
            )

            for result in results:
                sections.append(
                    self._format_validation_result(
                        result
                    )
                )

        reason = validation_analysis.get(
            "reason"
        )

        if reason:
            sections.append(
                f"\nVALIDATION NOTE:\n{reason}"
            )

        sections.append(
            """

VALIDATION INTERPRETATION:

- NOT_TESTED means no corresponding execution occurred.

- OBSERVED means the specific behavior supporting the finding
  was directly observed during execution.

- VALIDATED means the relevant executed test or command completed
  successfully. This does not, by itself, prove that a suspected
  regression is absent.

- NOT_REPRODUCED means an actual attempt to reproduce the suspected
  behavior did not reproduce it under the tested conditions.
  Do not apply this status to ordinary repository test runs unless
  they specifically attempted to reproduce that behavior.

- A successful test run does not establish that every finding is false.

- Do not describe NOT_TESTED findings as proven runtime failures.

- Do not infer execution merely because a test file was discovered.

- Keep static findings when runtime evidence is inconclusive, but
  distinguish static support from confirmed runtime behavior.

""".strip()
        )

        return "\n\n".join(sections)

    @staticmethod
    def _format_validation_result(
        result,
    ) -> str:
        if hasattr(
            result,
            "to_dict",
        ):
            result = result.to_dict()

        command = result.get(
            "command",
            [],
        )

        stdout = result.get(
            "stdout",
            "",
        )

        stderr = result.get(
            "stderr",
            "",
        )

        return f"""

COMMAND:

{" ".join(str(part) for part in command)}

STATUS:

{result.get("status")}

EXIT CODE:

{result.get("exit_code")}

DURATION:

{result.get("duration_seconds")} seconds

TIMED OUT:

{result.get("timed_out")}

STDOUT:

{stdout or "(empty)"}

STDERR:

{stderr or "(empty)"}

ERROR:

{result.get("error") or "(none)"}

""".strip()

    def _is_fixture_path(
        self,
        path: str,
    ) -> bool:
        normalized = path.replace(
            "\\",
            "/",
        )

        parts = normalized.split("/")

        for part in parts:
            if (
                part.lower()
                in self.FIXTURE_DIRECTORY_NAMES
            ):
                return True

        lower = normalized.lower()

        return any(
            token in lower
            for token in (
                "fixture",
                "testdata",
                "test_data",
                "sample_data",
            )
        )

    def _should_ignore_path(
        self,
        path: str,
    ) -> bool:
        normalized = path.replace(
            "\\",
            "/",
        ).lower()

        for ignored in self.IGNORED_PATH_PARTS:
            if ignored.lower() in normalized:
                return True

        return False

    def _is_test_path(
        self,
        path: str,
    ) -> bool:
        normalized = path.replace(
            "\\",
            "/",
        )

        parts = normalized.split("/")

        for part in parts:
            if (
                part.lower()
                in self.TEST_DIRECTORY_NAMES
            ):
                return True

        name = Path(path).name.lower()

        return (
            name.startswith("test_")
            or name.endswith("_test.py")
            or name.endswith(".test.js")
            or name.endswith(".test.ts")
            or name.endswith(".test.jsx")
            or name.endswith(".test.tsx")
            or name.endswith(".spec.js")
            or name.endswith(".spec.ts")
            or name.endswith(".spec.jsx")
            or name.endswith(".spec.tsx")
        )

    def _matches_changed_file(
        self,
        candidate: str,
        changed_paths: list[str],
    ) -> bool:
        candidate_name = Path(
            candidate
        ).stem.lower()

        candidate_name = re.sub(
            r"^(test_|spec_)",
            "",
            candidate_name,
        )

        candidate_name = re.sub(
            r"(_test|_spec|\.test|\.spec)$",
            "",
            candidate_name,
        )

        for changed in changed_paths:
            changed_name = Path(
                changed
            ).stem.lower()

            if changed_name == candidate_name:
                return True

            if (
                changed_name in candidate_name
                or candidate_name in changed_name
            ):
                return True

        return False

    @staticmethod
    def _detect_primary_language(
        changed_files: list[dict],
    ) -> str:
        extensions: dict[str, int] = {}

        language_map = {
            ".py": "python",
            ".js": "javascript",
            ".jsx": "javascript",
            ".ts": "typescript",
            ".tsx": "typescript",
            ".java": "java",
            ".kt": "kotlin",
            ".go": "go",
            ".rs": "rust",
            ".rb": "ruby",
            ".php": "php",
            ".cs": "csharp",
            ".cpp": "cpp",
            ".cc": "cpp",
            ".c": "c",
            ".swift": "swift",
        }

        for file in changed_files:
            filename = file.get(
                "filename",
                "",
            )

            suffix = Path(
                filename
            ).suffix.lower()

            language = language_map.get(
                suffix
            )

            if language:
                extensions[language] = (
                    extensions.get(language, 0)
                    + 1
                )

        if not extensions:
            return "unknown"

        return max(
            extensions,
            key=extensions.get,
        )
