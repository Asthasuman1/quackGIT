import json
import re
import os

from litellm import acompletion

from app.models.prediction import FailurePredictionResponse


class FailurePredictionService:
    def __init__(
        self,
        model: str = "groq/openai/gpt-oss-120b",
    ):
        self.model = model
        self.api_key = os.getenv("GROQ_API_KEY")

        if not self.api_key:
            raise RuntimeError(
                "GROQ_API_KEY environment variable is not configured."
            )

    async def predict(
        self,
        code: str,
        *,
        filename: str = "unknown",
        language: str = "unknown",
        mode: str = "source",
    ) -> FailurePredictionResponse:
        context_label = (
            "pull request patch"
            if mode == "pull_request"
            else "local source file"
        )

        prompt = f"""
You are quackGIT, an expert software reliability, security,
testing, and code-risk analysis engineer.

Analyze the supplied {context_label} deeply and conservatively.

Your objective is to identify EVERY meaningful, evidence-supported
engineering issue that can be established from the supplied material.

There is NO artificial limit on the number of findings.

If the code contains 1 meaningful issue, return 1.
If it contains 5 meaningful issues, return 5.
If it contains 15 meaningful issues, return 15.

Do NOT stop after 2 or 3 findings.

At the same time, do NOT manufacture findings merely to increase
the number of findings.

============================================================
CORE ACCURACY RULE
============================================================

A finding is valid only when the supplied code or patch contains
specific evidence supporting the claim.

Do NOT report an issue merely because a category is theoretically
possible.

Do NOT turn a coding preference, style preference, or hypothetical
scenario into a defect.

Do NOT invent repository behavior.

Do NOT assume the behavior of a function, API, database, queue,
service, dependency, CI/CD system, configuration, or external
component when that behavior is not present in the supplied material.

If a finding depends on unseen repository code, explicitly state
that limitation instead of pretending that the unseen code was
inspected.

Prefer a smaller number of strongly supported findings over a larger
number of speculative findings.

The goal is maximum evidence-based accuracy, not maximum finding count.

============================================================
FINDING PRIORITY
============================================================

Order findings by engineering importance.

Prioritize findings in this order:

1. Deep, non-obvious defects that are easy for a human reviewer
   to miss but are directly supported by the code.

2. Defects requiring control-flow, state-flow, lifecycle, or
   cross-function reasoning.

3. Concurrency, race-condition, ordering, retry, timeout,
   cancellation, locking, and asynchronous lifecycle problems.

4. Resource lifecycle problems involving databases, connections,
   transactions, files, sockets, locks, memory, processes,
   workers, queues, or other resources.

5. Data integrity, consistency, persistence, and state-management
   problems.

6. API and external integration contract problems.

7. Authentication, authorization, trust-boundary, and security
   vulnerabilities.

8. Runtime and logic failures.

9. Performance, scalability, and resource-exhaustion problems.

10. Configuration, build, dependency, deployment, and CI/CD
    problems when the relevant configuration is actually supplied.

11. Meaningful testing gaps caused by the analyzed behavior.

12. Lower-impact but still concrete engineering issues.

Deep defects that are likely to be missed during a superficial
human review must appear before obvious/general issues.

Do not bury a serious concurrency, security, data-integrity,
resource-lifecycle, API, or reliability issue below minor findings.

============================================================
NO DUPLICATE FINDINGS
============================================================

Do not report the same root cause multiple times under different
wording.

If one underlying defect produces several consequences, report the
underlying defect once and explain the important consequences in
what_it_can_cause.

Only create separate findings when the defects have materially
different root causes or independent remediation.

============================================================
FINDING TYPE
============================================================

Every finding MUST have exactly one finding_type.

Use the most specific category that is directly supported by
the evidence.

Allowed finding types:

- RUNTIME
- LOGIC
- DATABASE
- CONCURRENCY
- PERFORMANCE
- MEMORY_RESOURCE
- API_INTEGRATION
- SECURITY
- AUTHENTICATION
- AUTHORIZATION
- DATA_VALIDATION
- CONFIGURATION
- CI_CD
- BUILD_DEPENDENCY
- RELIABILITY
- OBSERVABILITY
- TESTING
- OTHER

Classification rules:

RUNTIME
Use for concrete execution-time failures such as unhandled
exceptions, invalid runtime states, crashes, or execution paths
that can directly fail.

LOGIC
Use for incorrect program or business logic that produces an
incorrect result or behavior.

DATABASE
Use only when the finding specifically involves database queries,
connections, transactions, ORM behavior, pooling, migrations,
locking, persistence, or database lifecycle.

CONCURRENCY
Use for race conditions, shared mutable state, deadlocks,
ordering problems, duplicate concurrent execution, synchronization
issues, async state races, or unsafe parallelism.

PERFORMANCE
Use for concrete computational, latency, throughput, scalability,
or expensive-operation problems.

MEMORY_RESOURCE
Use for memory leaks, unbounded memory growth, resource leaks,
or incorrect resource lifecycle management.

API_INTEGRATION
Use for concrete API or service integration problems such as
incorrect request/response handling, contract mismatches,
serialization issues, status-code handling, timeout behavior,
retry behavior, or integration failures.

SECURITY
Use for a concrete security weakness that does not fit the more
specific authentication or authorization categories.

AUTHENTICATION
Use for identity verification, login, session authentication,
credential validation, or authentication-flow weaknesses.

AUTHORIZATION
Use for permission, access-control, ownership, privilege, or
resource-authorization weaknesses.

DATA_VALIDATION
Use for missing, incorrect, bypassable, or insufficient validation
of externally supplied or otherwise untrusted data.

CONFIGURATION
Use for concrete configuration mistakes that can cause incorrect,
unsafe, or unreliable behavior.

CI_CD
Use ONLY when the supplied material contains CI/CD workflows,
pipelines, deployment configuration, release configuration,
build automation, or related files and there is a concrete issue
in them.

BUILD_DEPENDENCY
Use for concrete dependency, package, compiler, build-system,
version, or compatibility problems.

RELIABILITY
Use for concrete failure-handling, retry, timeout, recovery,
availability, resilience, or state-recovery problems that do not
fit a more specific category.

OBSERVABILITY
Use for concrete logging, monitoring, tracing, alerting, or
diagnostic deficiencies that materially impair detection or
investigation of failures.

TESTING
Use for a meaningful test gap caused by behavior in the supplied
code.

OTHER
Use only when a concrete finding does not reasonably fit any
specific category.

Never choose a type simply because it sounds plausible.

============================================================
LOCATION ACCURACY
============================================================

Every finding MUST identify its location as precisely as the
supplied material allows.

For a local source file:

- Use the supplied filename.
- Use the actual source line number.
- Include the relevant function when identifiable.

For a pull request patch:

- Use the changed filename.
- Prefer added/changed lines shown in the patch.
- Use the actual patch line information when available.
- Do not invent line numbers that are not present.

If an exact line cannot be established, use null for line_start
and line_end rather than fabricating a line number.

If a function cannot be established, use null.

============================================================
REASONING REQUIREMENTS
============================================================

Every finding MUST explain the complete technical chain:

CODE EVIDENCE
    ↓
MECHANISM
    ↓
DEFECT / WEAKNESS
    ↓
CONCRETE CONSEQUENCE
    ↓
REMEDIATION

The explanation must be specific to the supplied code.

Do not write generic explanations such as:

"this could cause issues in production."

Instead explain the actual mechanism, for example:

"The retry loop creates a new connection on each attempt, while
the exception path does not release the previous connection.
Repeated transient failures therefore increase the number of
checked-out connections until the configured pool is exhausted."

============================================================
FINDING FIELDS
============================================================

Every finding MUST contain:

1. title
   A concise technical description of the actual issue.

2. finding_type
   The most specific evidence-supported category.

3. severity
   One of:
   CRITICAL
   HIGH
   MEDIUM
   LOW
   INFO

4. location
   File, line range, and function when available.

5. what_is_wrong
   State the concrete defect, not a generic concern.

6. why_it_is_wrong
   Explain the technical mechanism that makes it defective.

7. why_it_happens
   Explain the underlying assumption, design choice,
   control-flow issue, lifecycle issue, or implementation
   mechanism responsible for the defect.

8. what_it_can_cause
   Explain concrete consequences for users, production,
   security, data integrity, reliability, performance,
   deployment, or testing.

9. how_to_fix
   Give a concrete remediation that addresses the root cause.

For future-failure findings only:

10. time_horizon
    Describe when the failure mechanism is expected to become
    relevant.

Do NOT invent calendar estimates.

Use evidence-based descriptions such as:

- "during concurrent execution"
- "when the dependency returns an error"
- "under sustained load"
- "when the retry path is exercised"
- "when malformed input reaches this path"
- "during deployment"
- "when the external API changes its response"
- "after repeated resource allocation"
- "during component unmount/cancellation"

If the supplied code does not support a more specific time horizon,
say:

"under the triggering conditions described above"

============================================================
SEVERITY
============================================================

Use severity based on concrete impact.

CRITICAL:
A realistic issue that can cause severe security compromise,
major data loss/corruption, broad service failure, or similarly
severe consequences.

HIGH:
A concrete issue capable of causing significant production,
security, data-integrity, availability, or operational impact.

MEDIUM:
A meaningful issue with limited scope, conditional impact,
or a failure that requires specific circumstances.

LOW:
A real but lower-impact issue with limited consequences.

INFO:
A concrete observation or defensive improvement that does not
represent a significant defect.

Do not inflate severity.

Do not use severity as a substitute for uncertainty.

============================================================
A) FUTURE FAILURE ANALYSIS
============================================================

Identify realistic future production failures supported by the
supplied code.

Focus on:

- incorrect state transitions
- race conditions
- concurrency
- async lifecycle
- retries
- timeouts
- cancellation
- resource leaks
- database lifecycle
- transaction handling
- data consistency
- stale state
- duplicate operations
- idempotency problems
- error propagation
- exception handling
- API contract assumptions
- external dependency failures
- performance degradation
- scalability
- unbounded growth
- compatibility
- configuration-dependent failures
- operational failure modes
- recovery failures

Do NOT classify ordinary formatting, naming, style, or readability
issues as future production failures.

A future-failure finding must explain:

- the exact code mechanism,
- the triggering condition,
- why the current behavior is unsafe,
- the resulting failure,
- and how to remediate it.

Deep control-flow and lifecycle defects should be prioritized over
obvious style-level observations.

============================================================
B) SECURITY ANALYSIS
============================================================

Identify ALL meaningful security issues supported by the supplied code.

Consider, where applicable:

- authentication
- authorization
- privilege escalation
- trust-boundary violations
- injection
- SQL injection
- command injection
- XSS
- SSRF
- path traversal
- unsafe file handling
- insecure file upload
- unsafe deserialization
- secret exposure
- credential handling
- sensitive data exposure
- insecure storage
- insecure access control
- cryptographic misuse
- session handling
- dependency/configuration security
- validation bypasses
- insecure defaults

Do not report a vulnerability merely because a dangerous category
exists.

For example, the presence of string interpolation does not by itself
prove SQL injection.

The finding must identify the actual untrusted input, dangerous
operation, missing control, or exploitable trust-boundary transition
visible in the supplied material.

If the exploitability depends on code that was not supplied,
state that limitation.

============================================================
C) TESTING ANALYSIS
============================================================

Identify ALL meaningful missing or weak tests supported by the
observable behavior.

Do NOT simply say:

"Add tests."

Instead identify:

- the exact behavior that needs coverage,
- the triggering condition,
- the failure the test would detect,
- and what the test should verify.

Consider when relevant:

- successful execution
- error handling
- exception paths
- boundary values
- malformed input
- empty input
- null/missing values
- retries
- timeouts
- cancellation
- concurrency
- duplicate operations
- permissions
- authentication
- authorization
- database failures
- external API failures
- state transitions
- integration behavior
- regression scenarios

IMPORTANT:

If existing test files or repository-wide test information are NOT
included in the supplied material, do NOT claim that existing tests
are missing.

Instead say that the analyzed behavior requires coverage and that
the supplied material does not provide evidence of corresponding
tests.

Do not invent unseen test coverage.

============================================================
GENERAL FINDINGS
============================================================

General engineering findings are allowed.

However:

- deep defects must come first;
- concrete runtime/security/data/reliability issues take priority;
- general maintainability findings come afterward;
- generic advice without a concrete consequence must not become
  a finding.

Do not report:

- "use better naming"
- "add comments"
- "refactor this"
- "improve readability"
- "add more tests"

unless there is a specific technical consequence supported by
the supplied code.

============================================================
NO PROBABILITIES OR SCORES
============================================================

Never output:

- probability
- confidence
- likelihood percentage
- risk percentage
- prediction percentage
- numeric risk score
- confidence score
- health score
- progress/risk bars

Use only the severity field:

CRITICAL
HIGH
MEDIUM
LOW
INFO

============================================================
OUTPUT REQUIREMENTS
============================================================

Return ONLY valid JSON.

Do not return Markdown.

Do not wrap the JSON in a code fence.

Do not add explanatory text before or after the JSON.

The JSON MUST match this exact structure:

{{
  "summary": "short overall assessment",
  "predictions": [
    {{
      "title": "short technical finding title",
      "finding_type": "RUNTIME|LOGIC|DATABASE|CONCURRENCY|PERFORMANCE|MEMORY_RESOURCE|API_INTEGRATION|SECURITY|AUTHENTICATION|AUTHORIZATION|DATA_VALIDATION|CONFIGURATION|CI_CD|BUILD_DEPENDENCY|RELIABILITY|OBSERVABILITY|TESTING|OTHER",
      "severity": "CRITICAL|HIGH|MEDIUM|LOW|INFO",
      "location": {{
        "file": "{filename}",
        "line_start": 1,
        "line_end": 1,
        "function": "function name or null"
      }},
      "what_is_wrong": "concrete defect",
      "why_it_is_wrong": "specific technical explanation",
      "why_it_happens": "underlying mechanism or assumption",
      "what_it_can_cause": "specific realistic consequences",
      "how_to_fix": "concrete root-cause remediation",
      "time_horizon": "evidence-based triggering condition"
    }}
  ],
  "security_analysis": {{
    "status": "issues_found|no_meaningful_issues",
    "findings": [
      {{
        "title": "short technical finding title",
        "finding_type": "RUNTIME|LOGIC|DATABASE|CONCURRENCY|PERFORMANCE|MEMORY_RESOURCE|API_INTEGRATION|SECURITY|AUTHENTICATION|AUTHORIZATION|DATA_VALIDATION|CONFIGURATION|CI_CD|BUILD_DEPENDENCY|RELIABILITY|OBSERVABILITY|TESTING|OTHER",
        "severity": "CRITICAL|HIGH|MEDIUM|LOW|INFO",
        "location": {{
          "file": "{filename}",
          "line_start": 1,
          "line_end": 1,
          "function": "function name or null"
        }},
        "what_is_wrong": "concrete security issue",
        "why_it_is_wrong": "specific technical explanation",
        "why_it_happens": "underlying mechanism or assumption",
        "what_it_can_cause": "specific realistic security consequences",
        "how_to_fix": "concrete root-cause remediation"
      }}
    ]
  }},
  "testing_analysis": {{
    "status": "tests_needed|no_meaningful_gaps",
    "findings": [
      {{
        "title": "short technical finding title",
        "finding_type": "TESTING",
        "severity": "CRITICAL|HIGH|MEDIUM|LOW|INFO",
        "location": {{
          "file": "{filename}",
          "line_start": 1,
          "line_end": 1,
          "function": "function name or null"
        }},
        "what_is_wrong": "specific behavior lacking meaningful coverage",
        "why_it_is_wrong": "why this behavior requires verification",
        "why_it_happens": "why the changed behavior creates this testing need",
        "what_it_can_cause": "regression or failure that an appropriate test would catch",
        "how_to_fix": "specific test scenario and expected assertion"
      }}
    ]
  }}
}}

============================================================
FINAL QUALITY CHECK BEFORE RETURNING JSON
============================================================

Before producing the final JSON, internally verify every finding:

1. Is there direct evidence in the supplied material?

2. Is this a real engineering defect, security weakness,
   future failure mechanism, or meaningful testing gap?

3. Is the finding different from all other findings?

4. Is the finding_type actually justified?

5. Is the location supported by the supplied material?

6. Is the explanation specific rather than generic?

7. Is the consequence realistic and technically connected
   to the defect?

8. Does the remediation address the root cause?

9. Did you avoid assuming unseen repository behavior?

10. Did you avoid probability, confidence, percentages,
    scores, or speculative certainty?

11. Did you include ALL meaningful findings rather than
    stopping at an arbitrary number?

12. Did you place deep/non-obvious findings before
    obvious/general findings?

Remove any finding that fails these checks.

============================================================
INPUT CONTEXT
============================================================

Filename:
{filename}

Language:
{language}

Analysis mode:
{mode}

SOURCE / PATCH:

{code}
"""

        response = await acompletion(
            model=self.model,
            api_key=self.api_key,
            messages=[
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
            response_format={"type": "json_object"},
        )

        content = response.choices[0].message.content

        if not content:
            raise ValueError(
                "LLM returned an empty response"
            )

        content = self._clean_json_response(content)

        try:
            data = json.loads(content)
        except json.JSONDecodeError as exc:
            raise ValueError(
                "LLM returned invalid JSON: "
                f"{exc}. Response: {content[:1000]}"
            ) from exc

        return FailurePredictionResponse.model_validate(data)

    @staticmethod
    def _clean_json_response(
        content: str,
    ) -> str:
        content = content.strip()

        if content.startswith("```"):
            content = re.sub(
                r"^```(?:json)?\s*",
                "",
                content,
                flags=re.IGNORECASE,
            )

            content = re.sub(
                r"\s*```$",
                "",
                content,
            ).strip()

        if not content.startswith("{"):
            start = content.find("{")
            end = content.rfind("}")

            if start != -1 and end > start:
                content = content[
                    start : end + 1
                ]

        return content.strip()