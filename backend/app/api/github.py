from fastapi import APIRouter, HTTPException
from app.github.github_service import GitHubService

router = APIRouter(prefix="/github", tags=["GitHub"])


@router.get("/user")
async def get_user():
    try:
        github = GitHubService()

        return {
            "user": github.get_user()
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/repos")
async def get_repositories():
    try:
        github = GitHubService()

        return github.get_repositories()

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/pulls/{repo_name:path}")
async def get_pull_requests(repo_name: str):
    try:
        github = GitHubService()

        return github.get_pull_requests(repo_name)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))   
    
@router.get("/pull-files/{repo_name:path}/{pr_number}")
async def get_pull_request_files(repo_name: str, pr_number: int):
    try:
        github = GitHubService()

        return github.get_pull_request_files(repo_name, pr_number)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))  
    
from app.services.pr_prediction_service import PRPredictionService   

@router.post("/predict/{repo_name:path}/{pr_number}")
async def predict_pull_request(repo_name: str, pr_number: int):
    try:
        service = PRPredictionService()

        result = await service.predict_pr(
            repo_name,
            pr_number,
        )

        return {
            "status": "success",
            "result": result.model_dump(),
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e),
        )    