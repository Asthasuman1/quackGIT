from app.github.github_service import GitHubService
from app.services.failure_prediction_service import FailurePredictionService


class PRPredictionService:
    def __init__(self, access_token: str):
        self.github = GitHubService(access_token)
        self.prediction = FailurePredictionService()

    async def predict_pr(self, repo_name: str, pr_number: int):
        files = self.github.get_pull_request_files(
            repo_name,
            pr_number,
        )

        patches = []

        for file in files:
            if file.get("patch"):
                patches.append(
                    f"File: {file['filename']}\n"
                    f"Status: {file['status']}\n"
                    f"Changes: +{file['additions']} -{file['deletions']}\n"
                    f"Patch:\n{file['patch']}"
                )

        if not patches:
            raise ValueError(
                "No patch data was available for this pull request."
            )

        diff = "\n\n====================\n\n".join(patches)

        return await self.prediction.predict(
            diff,
            filename="multiple PR files",
            language="mixed",
            mode="pull_request",
        )