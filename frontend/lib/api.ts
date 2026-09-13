const API_BASE_URL = "/api/backend";

export async function getRepositories() {
  const response = await fetch(`${API_BASE_URL}/github/repos`, {
    credentials: "include",
    cache: "no-store",
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.detail || "Failed to load repositories");
  }

  return data;
}

export async function getPullRequests(repoName: string) {
  const response = await fetch(
    `${API_BASE_URL}/github/pulls/${encodeURIComponent(repoName)}`,
    {
      credentials: "include",
      cache: "no-store",
    }
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.detail || "Failed to load pull requests");
  }

  return data;
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
      credentials: "include",
    }
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.detail || "Failed to analyze pull request");
  }

  return data;
}
