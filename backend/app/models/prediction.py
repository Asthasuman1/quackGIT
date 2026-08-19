from pydantic import BaseModel, Field


class FailurePrediction(BaseModel):
    risk: str
    probability: float = Field(ge=0.0, le=1.0)
    time_horizon: str
    reason: str
    recommendation: str


class FailurePredictionResponse(BaseModel):
    summary: str
    predictions: list[FailurePrediction]