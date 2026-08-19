const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function getRepositories() {
  const response = await fetch(`${API_BASE_URL}/github/repos`);

  if (!response.ok) {
    throw new Error("Failed to load repositories");
  }

  return response.json();
}

export async function getPullRequests(repoName: string) {
  const response = await fetch(
    `${API_BASE_URL}/github/pulls/${encodeURIComponent(repoName)}`
  );

  if (!response.ok) {
    throw new Error("Failed to load pull requests");
  }

  return response.json();
}

export async function predictPullRequest(
  repoName: string,
  prNumber: number
) {
  const response = await fetch(
    `${API_BASE_URL}/github/predict/${encodeURIComponent(repoName)}/${prNumber}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Failed to analyze pull request");
  }

  return data;
}
