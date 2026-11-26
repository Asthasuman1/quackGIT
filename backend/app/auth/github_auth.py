import base64
import hashlib
import os
import secrets
from datetime import datetime, timedelta, timezone
from urllib.parse import urlencode

import httpx
from dotenv import load_dotenv

load_dotenv()

GITHUB_AUTHORIZE_URL = "https://github.com/login/oauth/authorize"
GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token"
GITHUB_USER_URL = "https://api.github.com/user"

GITHUB_REDIRECT_URI = os.getenv(
    "GITHUB_REDIRECT_URI",
    "http://localhost:8000/auth/github/callback",
)

# Temporary OAuth state storage.
# This is only for the short period between login and callback.
_oauth_states: dict[str, dict] = {}

OAUTH_STATE_EXPIRY_SECONDS = 600


def create_pkce_pair() -> tuple[str, str]:
    """
    Create a PKCE code verifier and S256 code challenge.
    """
    verifier = secrets.token_urlsafe(64)

    digest = hashlib.sha256(
        verifier.encode("ascii")
    ).digest()

    challenge = base64.urlsafe_b64encode(
        digest
    ).rstrip(b"=").decode("ascii")

    return verifier, challenge


def create_oauth_state(
    code_verifier: str,
) -> str:
    """
    Create and temporarily store OAuth state and PKCE verifier.
    """
    state = secrets.token_urlsafe(32)

    _oauth_states[state] = {
        "code_verifier": code_verifier,
        "expires_at": (
            datetime.now(timezone.utc)
            + timedelta(
                seconds=OAUTH_STATE_EXPIRY_SECONDS
            )
        ),
    }

    return state


def consume_oauth_state(
    state: str,
) -> str | None:
    """
    Retrieve and remove an OAuth state.

    Returns the PKCE verifier if the state is valid
    and has not expired.
    """
    data = _oauth_states.pop(state, None)

    if not data:
        return None

    expires_at = data["expires_at"]

    if datetime.now(timezone.utc) >= expires_at:
        return None

    return data["code_verifier"]


def get_github_login_url(
    state: str,
    code_challenge: str,
) -> str:
    client_id = os.getenv("GITHUB_CLIENT_ID")

    if not client_id:
        raise RuntimeError(
            "GITHUB_CLIENT_ID is not configured"
        )

    params = {
    "client_id": client_id,
    "redirect_uri": GITHUB_REDIRECT_URI,
    "state": state,
    "code_challenge": code_challenge,
    "code_challenge_method": "S256",
    "scope": "repo",
    "prompt": "login",
}

    return (
        f"{GITHUB_AUTHORIZE_URL}?{urlencode(params)}"
    )


async def exchange_code_for_token(
    code: str,
    code_verifier: str,
) -> dict:
    client_id = os.getenv("GITHUB_CLIENT_ID")
    client_secret = os.getenv(
        "GITHUB_CLIENT_SECRET"
    )

    if not client_id:
        raise RuntimeError(
            "GITHUB_CLIENT_ID is not configured"
        )

    if not client_secret:
        raise RuntimeError(
            "GITHUB_CLIENT_SECRET is not configured"
        )

    async with httpx.AsyncClient() as client:
        response = await client.post(
            GITHUB_TOKEN_URL,
            data={
                "client_id": client_id,
                "client_secret": client_secret,
                "code": code,
                "redirect_uri": GITHUB_REDIRECT_URI,
                "code_verifier": code_verifier,
            },
            headers={
                "Accept": "application/json",
            },
        )

    response.raise_for_status()

    data = response.json()

    if data.get("error"):
        raise RuntimeError(
            data.get("error_description")
            or data["error"]
        )

    access_token = data.get("access_token")

    if not access_token:
        raise RuntimeError(
            "GitHub did not return an access token"
        )

    return data


async def get_github_user(
    access_token: str,
) -> dict:
    async with httpx.AsyncClient() as client:
        response = await client.get(
            GITHUB_USER_URL,
            headers={
                "Authorization": (
                    f"Bearer {access_token}"
                ),
                "Accept": (
                    "application/vnd.github+json"
                ),
                "X-GitHub-Api-Version": "2026-03-10",
            },
        )

    response.raise_for_status()

    return response.json()