from github import Github


class GitHubService:
    def __init__(self, access_token: str):
        if not access_token:
            raise ValueError("GitHub access token is required")

        self.access_token = access_token
        self.client = Github(access_token)
        

    def get_user(self):
        return self.client.get_user().login

    def get_repositories(self):
        user = self.client.get_user()

        return [
            {
                "name": repo.name,
                "full_name": repo.full_name,
                "private": repo.private,
            }
            for repo in user.get_repos()
        ]

    def get_pull_requests(self, repo_name):
        repo = self.client.get_repo(repo_name)

        pulls = repo.get_pulls(state="open")

        return [
            {
                "number": pr.number,
                "title": pr.title,
                "author": pr.user.login,
                "url": pr.html_url,
                "state": pr.state,
            }
            for pr in pulls
        ]

    def get_pull_request_files(self, repo_name, pr_number):
        repo = self.client.get_repo(repo_name)

        pr = repo.get_pull(pr_number)

        files = pr.get_files()

        return [
            {
                "filename": file.filename,
                "status": file.status,
                "additions": file.additions,
                "deletions": file.deletions,
                "changes": file.changes,
                "patch": file.patch,
            }
            for file in files
        ]