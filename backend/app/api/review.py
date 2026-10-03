from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel

from app.auth.session import get_session
from pr_agent.agent.pr_agent import PRAgent

router = APIRouter(prefix="/review", tags=["Review"])


class ReviewRequest(BaseModel):
    pr_url: str


@router.post("/")
async def review_pr(
    request: ReviewRequest,
    http_request: Request,
):
    try:
        session_id = http_request.cookies.get(
            "ai_reviewer_session"
        )

        if not session_id:
            raise HTTPException(
                status_code=401,
                detail="Not authenticated",
            )

        session = get_session(session_id)

        if not session:
            raise HTTPException(
                status_code=401,
                detail="Invalid or expired session",
            )

        access_token = session.get("access_token")

        if not access_token:
            raise HTTPException(
                status_code=401,
                detail="GitHub access token not available",
            )

        # Use the currently logged-in user's GitHub token.
        from pr_agent.config_loader import get_settings

        get_settings().github.user_token = access_token

        result = await PRAgent().handle_request(
            request.pr_url,
            ["review"],
        )

        return {
            "status": "success",
            "result": result,
        }

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e),
        )