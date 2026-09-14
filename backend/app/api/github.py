from fastapi import APIRouter, HTTPException, Request

from app.github.github_service import GitHubService
from app.auth.session import get_session
from app.services.pr_prediction_service import PRPredictionService


router = APIRouter(prefix="/github", tags=["GitHub"])


def get_github_service(request: Request) -> GitHubService:
    session_id = request.cookies.get("ai_reviewer_session")

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

    return GitHubService(access_token)


@router.get("/user")
async def get_user(request: Request):
    try:
        github = get_github_service(request)

        return {
            "user": github.get_user()
        }

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e),
        )


@router.get("/repos")
async def get_repositories(request: Request):
    try:
        github = get_github_service(request)

        return github.get_repositories()

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e),
        )


@router.get("/pulls/{repo_name:path}")
async def get_pull_requests(
    repo_name: str,
    request: Request,
):
    try:
        github = get_github_service(request)

        return github.get_pull_requests(repo_name)

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e),
        )


@router.get("/pull-files/{repo_name:path}/{pr_number}")
async def get_pull_request_files(
    repo_name: str,
    pr_number: int,
    request: Request,
):
    try:
        github = get_github_service(request)

        return github.get_pull_request_files(
            repo_name,
            pr_number,
        )

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e),
        )


@router.post("/predict/{repo_name:path}/{pr_number}")
async def predict_pull_request(
    repo_name: str,
    pr_number: int,
    request: Request,
):
    try:
        # Verify that the current user has a valid GitHub session.
        # This prevents unauthenticated users from triggering
        # repository/PR analysis.
        github = get_github_service(request)

        service = PRPredictionService(
            github.access_token
        )

        result = await service.predict_pr(
            repo_name,
            pr_number,
        )

        return {
            "status": "success",
            "result": result.model_dump(),
        }

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e),
        )