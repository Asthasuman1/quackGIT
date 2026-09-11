from typing import Literal

from pydantic import BaseModel, Field


Severity = Literal["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO"]


class FindingLocation(BaseModel):
    file: str = "unknown"
    line_start: int | None = None
    line_end: int | None = None
    function: str | None = None


class AnalysisFinding(BaseModel):
    title: str
    severity: Severity
    location: FindingLocation
    what_is_wrong: str
    why_it_is_wrong: str
    why_it_happens: str
    what_it_can_cause: str
    how_to_fix: str


class FutureFailureFinding(AnalysisFinding):
    time_horizon: str


class SecurityAnalysis(BaseModel):
    status: Literal["issues_found", "no_meaningful_issues"] = "no_meaningful_issues"
    findings: list[AnalysisFinding] = Field(default_factory=list)


class TestingAnalysis(BaseModel):
    status: Literal["tests_needed", "no_meaningful_gaps"] = "no_meaningful_gaps"
    findings: list[AnalysisFinding] = Field(default_factory=list)


class FailurePredictionResponse(BaseModel):
    summary: str
    predictions: list[FutureFailureFinding] = Field(default_factory=list)
    security_analysis: SecurityAnalysis = Field(default_factory=SecurityAnalysis)
    testing_analysis: TestingAnalysis = Field(default_factory=TestingAnalysis)
