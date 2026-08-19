from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.failure_prediction_service import FailurePredictionService

router = APIRouter(
    prefix="/prediction",
    tags=["Future Failure Prediction"],
)


class PredictionRequest(BaseModel):
    diff: str


@router.post("/")
async def predict_failure(request: PredictionRequest):
    try:
        service = FailurePredictionService()

        result = await service.predict(request.diff)

        return {
            "status": "success",
            "result": result.model_dump(),
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e),
        )
        