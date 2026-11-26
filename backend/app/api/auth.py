import os
import logging

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import JSONResponse, RedirectResponse

from app.auth.github_auth import (
    create_pkce_pair,
    create_oauth_state,
    consume_oauth_state,
    exchange_code_for_token,
    get_github_login_url,
    get_github_user,
)

from app.auth.gitlab_auth import (
    create_gitlab_pkce_pair,
    create_gitlab_oauth_state,
    consume_gitlab_oauth_state,
    exchange_gitlab_code_for_token,
    get_gitlab_login_url,
    get_gitlab_user,
)

from app.auth.session import (
    create_session,
    delete_session,
    get_session,
)


# --------------------------------------------------
# LOGGING
# --------------------------------------------------

logger = logging.getLogger(__name__)


# --------------------------------------------------
# ROUTER
# --------------------------------------------------

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)


# --------------------------------------------------
# CONFIGURATION
# --------------------------------------------------

FRONTEND_URL = os.getenv(
    "FRONTEND_URL",
    "http://localhost:3000",
).rstrip("/")

ENVIRONMENT = os.getenv(
    "ENVIRONMENT",
    "development",
).lower()

IS_PRODUCTION = ENVIRONMENT == "production"

SESSION_COOKIE_NAME = "ai_reviewer_session"
SESSION_MAX_AGE = 86400


# --------------------------------------------------
# SESSION COOKIE HELPER
# --------------------------------------------------

def set_session_cookie(response, session_id):
    """
    Configure the authentication cookie.

    Local development:
        secure=False
        samesite=lax

    Production:
        secure=True
        samesite=none

    Production cross-domain cookies require HTTPS.
    """

    response.set_cookie(
        key=SESSION_COOKIE_NAME,
        value=session_id,
        httponly=True,
        secure=IS_PRODUCTION,
        samesite="none" if IS_PRODUCTION else "lax",
        max_age=SESSION_MAX_AGE,
        path="/",
    )


def delete_session_cookie(response):
    """
    Remove the authentication cookie using
    matching cookie attributes.
    """

    response.delete_cookie(
        key=SESSION_COOKIE_NAME,
        path="/",
        secure=IS_PRODUCTION,
        httponly=True,
        samesite="none" if IS_PRODUCTION else "lax",
    )


# --------------------------------------------------
# FRONTEND REDIRECT
# --------------------------------------------------

def redirect_to_frontend():
    """
    Redirect the authenticated user to the frontend.
    """

    return RedirectResponse(
        url=FRONTEND_URL,
        status_code=302,
    )


# --------------------------------------------------
# GITHUB OAUTH LOGIN
# --------------------------------------------------

@router.get("/github/login")
async def github_login():
    """
    Start GitHub OAuth authentication.

    Generate PKCE credentials and OAuth state.
    Store the verifier server-side.
    """

    try:
        code_verifier, code_challenge = create_pkce_pair()

        state = create_oauth_state(
            code_verifier
        )

        github_url = get_github_login_url(
            state=state,
            code_challenge=code_challenge,
        )

        return RedirectResponse(
            url=github_url,
            status_code=302,
        )

    except Exception as e:
        logger.exception(
            "Failed to initiate GitHub OAuth"
        )

        raise HTTPException(
            status_code=500,
            detail="Unable to initiate GitHub login",
        ) from e


# --------------------------------------------------
# GITHUB OAUTH CALLBACK
# --------------------------------------------------

@router.get("/github/callback")
async def github_callback(
    request: Request,
    code: str,
    state: str,
):
    """
    Handle GitHub OAuth callback.

    1. Validate OAuth state.
    2. Exchange authorization code.
    3. Retrieve GitHub user.
    4. Create application session.
    5. Set session cookie.
    6. Redirect to frontend.
    """

    code_verifier = consume_oauth_state(state)

    if not code_verifier:
        logger.warning(
            "Invalid or expired GitHub OAuth state"
        )

        raise HTTPException(
            status_code=400,
            detail="Invalid or expired GitHub OAuth state",
        )

    try:
        token_data = await exchange_code_for_token(
            code=code,
            code_verifier=code_verifier,
        )

        access_token = token_data.get("access_token")

        if not access_token:
            raise ValueError(
                "GitHub access token missing from response"
            )

        user = await get_github_user(
            access_token
        )

        if not user:
            raise ValueError(
                "Unable to retrieve GitHub user"
            )

        session_id, _ = create_session(
            user=user,
            token_data=token_data,
        )

        response = redirect_to_frontend()

        set_session_cookie(
            response,
            session_id,
        )

        logger.info(
            "GitHub OAuth login successful"
        )

        return response

    except HTTPException:
        raise

    except Exception as e:
        logger.exception(
            "GitHub OAuth callback failed"
        )

        raise HTTPException(
            status_code=500,
            detail="GitHub authentication failed",
        ) from e


# --------------------------------------------------
# GITLAB OAUTH LOGIN
# --------------------------------------------------

@router.get("/gitlab/login")
async def gitlab_login():
    """
    Start GitLab OAuth authentication.

    Generate PKCE credentials and OAuth state.
    Store the verifier server-side.
    """

    try:
        code_verifier, code_challenge = (
            create_gitlab_pkce_pair()
        )

        state = create_gitlab_oauth_state(
            code_verifier
        )

        gitlab_url = get_gitlab_login_url(
            state=state,
            code_challenge=code_challenge,
        )

        return RedirectResponse(
            url=gitlab_url,
            status_code=302,
        )

    except Exception as e:
        logger.exception(
            "Failed to initiate GitLab OAuth"
        )

        raise HTTPException(
            status_code=500,
            detail="Unable to initiate GitLab login",
        ) from e


# --------------------------------------------------
# GITLAB OAUTH CALLBACK
# --------------------------------------------------

@router.get("/gitlab/callback")
async def gitlab_callback(
    request: Request,
    code: str,
    state: str,
):
    """
    Handle GitLab OAuth callback.

    1. Validate OAuth state.
    2. Exchange authorization code.
    3. Retrieve GitLab user.
    4. Create application session.
    5. Set session cookie.
    6. Redirect to frontend.
    """

    code_verifier = consume_gitlab_oauth_state(state)

    if not code_verifier:
        logger.warning(
            "Invalid or expired GitLab OAuth state"
        )

        raise HTTPException(
            status_code=400,
            detail="Invalid or expired GitLab OAuth state",
        )

    try:
        token_data = await exchange_gitlab_code_for_token(
            code=code,
            code_verifier=code_verifier,
        )

        access_token = token_data.get("access_token")

        if not access_token:
            raise ValueError(
                "GitLab access token missing from response"
            )

        user = await get_gitlab_user(
            access_token
        )

        if not user:
            raise ValueError(
                "Unable to retrieve GitLab user"
            )

        session_id, _ = create_session(
            user=user,
            token_data=token_data,
        )

        response = redirect_to_frontend()

        set_session_cookie(
            response,
            session_id,
        )

        logger.info(
            "GitLab OAuth login successful"
        )

        return response

    except HTTPException:
        raise

    except Exception as e:
        logger.exception(
            "GitLab OAuth callback failed"
        )

        raise HTTPException(
            status_code=500,
            detail="GitLab authentication failed",
        ) from e


# --------------------------------------------------
# CURRENT USER
# --------------------------------------------------

@router.get("/me")
async def get_current_user(
    request: Request,
):
    """
    Return the currently authenticated user.
    """

    session_id = request.cookies.get(
        SESSION_COOKIE_NAME
    )

    if not session_id:
        return {
            "authenticated": False,
            "user": None,
        }

    session = get_session(session_id)

    if not session:
        return {
            "authenticated": False,
            "user": None,
        }

    user = session.get("user", {})

    return {
        "authenticated": True,
        "user": {
            "id": user.get("id"),
            "login": user.get("login"),
            "name": user.get("name"),
            "avatar_url": user.get("avatar_url"),
        },
    }


# --------------------------------------------------
# LOGOUT
# --------------------------------------------------

@router.post("/logout")
async def logout(
    request: Request,
):
    """
    Destroy the current application session
    and remove the authentication cookie.
    """

    session_id = request.cookies.get(
        SESSION_COOKIE_NAME
    )

    if session_id:
        delete_session(session_id)

    response = JSONResponse(
        content={
            "status": "success",
            "message": "Logged out successfully",
        }
    )

    delete_session_cookie(response)

    logger.info(
        "User logged out successfully"
    )

    return response
