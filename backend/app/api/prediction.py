from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.failure_prediction_service import FailurePredictionService

router = APIRouter(
    prefix="/prediction",
    tags=["Future Failure Prediction"],
)


class PredictionRequest(BaseModel):
    diff: str
    filename: str = "current-file"
    language: str = "unknown"
    mode: str = "source"


@router.post("/")
async def predict_failure(request: PredictionRequest):
    try:
        service = FailurePredictionService()
        result = await service.predict(
            request.diff,
            filename=request.filename,
            language=request.language,
            mode=request.mode,
        )

        return {
            "status": "success",
            "result": result.model_dump(),
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
