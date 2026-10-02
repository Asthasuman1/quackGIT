from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


Severity = Literal[
    "CRITICAL",
    "HIGH",
    "MEDIUM",
    "LOW",
    "INFO",
]


PRRelationship = Literal[
    "INTRODUCED",
    "MODIFIED",
    "EXPOSED",
    "PRE_EXISTING",
    "UNCERTAIN",
]


ValidationStatus = Literal[
    "NOT_TESTED",
    "STATICALLY_SUPPORTED",
    "VALIDATED",
    "OBSERVED",
    "NOT_REPRODUCED",
]


ValidationMethod = Literal[
    "STATIC_ANALYSIS",
    "EXISTING_TEST",
    "GENERATED_REPRODUCTION",
    "DIFFERENTIAL",
    "MIXED",
]


ExecutionStatus = Literal[
    "PASS",
    "FAIL",
    "ERROR",
    "TIMEOUT",
    "NOT_RUN",
    "UNKNOWN",
]


DifferentialResult = Literal[
    "REGRESSION_OBSERVED",
    "NO_REGRESSION_OBSERVED",
    "BEHAVIOR_IMPROVED",
    "PRE_EXISTING_FAILURE",
    "INCONCLUSIVE",
    "NOT_RUN",
]


FindingType = Literal[
    "RUNTIME",
    "LOGIC",
    "DATABASE",
    "CONCURRENCY",
    "PERFORMANCE",
    "MEMORY_RESOURCE",
    "API_INTEGRATION",
    "SECURITY",
    "AUTHENTICATION",
    "AUTHORIZATION",
    "DATA_VALIDATION",
    "CONFIGURATION",
    "CI_CD",
    "BUILD_DEPENDENCY",
    "RELIABILITY",
    "OBSERVABILITY",
    "TESTING",
    "OTHER",
]


class FindingLocation(BaseModel):
    file: str = "unknown"
    line_start: int | None = None
    line_end: int | None = None
    function: str | None = None


class ReproductionPlan(BaseModel):
    """
    A small, evidence-driven plan for reproducing a suspected failure.

    This is a PLAN, not proof that the failure occurred.
    """

    needed: bool = False

    failure_hypothesis: str | None = None

    objective: str | None = None

    inputs: list[str] = Field(default_factory=list)

    trigger_condition: str | None = None

    expected_baseline_behavior: str | None = None

    expected_head_behavior: str | None = None


class ExecutionEvidence(BaseModel):
    """
    Observed result from executing a validation test.

    This represents execution evidence only. It must not be populated
    as proof unless the test was actually executed.
    """

    status: ExecutionStatus = "NOT_RUN"

    exit_code: int | None = None

    stdout: str | None = None

    stderr: str | None = None

    exception_type: str | None = None

    exception_message: str | None = None

    stack_trace: str | None = None

    duration_seconds: float | None = None

    timed_out: bool = False


class FindingValidation(BaseModel):
    status: ValidationStatus = "NOT_TESTED"

    method: ValidationMethod | None = None

    test_description: str | None = None

    expected_behavior: str | None = None

    observed_behavior: str | None = None

    reproduction_details: str | None = None

    generated_test_path: str | None = None

    generated_test_source: str | None = None

    observed_failure: str | None = None

    stack_trace: str | None = None

    baseline: ExecutionEvidence = Field(
        default_factory=ExecutionEvidence
    )

    head: ExecutionEvidence = Field(
        default_factory=ExecutionEvidence
    )

    differential_result: DifferentialResult = "NOT_RUN"


class AnalysisFinding(BaseModel):
    title: str

    severity: Severity

    finding_type: FindingType

    location: FindingLocation = Field(
        default_factory=FindingLocation
    )

    change_summary: str | None = None

    what_is_wrong: str

    why_it_is_wrong: str

    why_it_happens: str

    trigger_condition: str | None = None

    failure_chain: list[str] = Field(
        default_factory=list
    )

    what_it_can_cause: str

    repository_evidence: list[str] = Field(
        default_factory=list
    )

    pr_relationship: PRRelationship = "UNCERTAIN"

    reproduction_plan: ReproductionPlan = Field(
        default_factory=ReproductionPlan
    )

    validation: FindingValidation = Field(
        default_factory=FindingValidation
    )

    how_to_fix: str

    regression_test: str | None = None


class FutureFailureFinding(AnalysisFinding):
    time_horizon: str


class SecurityAnalysis(BaseModel):
    status: Literal[
        "issues_found",
        "no_meaningful_issues",
    ] = "no_meaningful_issues"

    findings: list[AnalysisFinding] = Field(
        default_factory=list
    )


class TestingAnalysis(BaseModel):
    status: Literal[
        "tests_needed",
        "no_meaningful_gaps",
    ] = "no_meaningful_gaps"

    findings: list[AnalysisFinding] = Field(
        default_factory=list
    )


class FailurePredictionResponse(BaseModel):
    summary: str

    predictions: list[FutureFailureFinding] = Field(
        default_factory=list
    )

    security_analysis: SecurityAnalysis = Field(
        default_factory=SecurityAnalysis
    )

    testing_analysis: TestingAnalysis = Field(
        default_factory=TestingAnalysis
    )