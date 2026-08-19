from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from pr_agent.agent.pr_agent import PRAgent

router = APIRouter(prefix="/review", tags=["Review"])


class ReviewRequest(BaseModel):
    pr_url: str


@router.post("/")
async def review_pr(request: ReviewRequest):
    try:
        result = await PRAgent().handle_request(
            request.pr_url,
            ["review"],
        )

        return {
            "status": "success",
            "result": result,
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e),
        )