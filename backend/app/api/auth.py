import os

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


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)


@router.get("/github/login")
async def github_login():
    """
    Start GitHub OAuth login.

    The OAuth state and PKCE verifier are stored server-side.
    """

    code_verifier, code_challenge = create_pkce_pair()

    state = create_oauth_state(
        code_verifier
    )

    github_url = get_github_login_url(
        state=state,
        code_challenge=code_challenge,
    )

    return RedirectResponse(
        url=github_url
    )


@router.get("/github/callback")
async def github_callback(
    request: Request,
    code: str,
    state: str,
):
    """
    Handle GitHub OAuth callback.
    """

    code_verifier = consume_oauth_state(
        state
    )

    if not code_verifier:
        raise HTTPException(
            status_code=400,
            detail="Invalid or expired OAuth state",
        )

    try:
        # Exchange GitHub authorization code
        # for an access token.
        token_data = await exchange_code_for_token(
            code=code,
            code_verifier=code_verifier,
        )

        # Get authenticated GitHub user.
        user = await get_github_user(
            token_data["access_token"]
        )

        # Create application session.
        session_id, _ = create_session(
            user=user,
            token_data=token_data,
        )

        # Production frontend URL comes from Render.
        # Localhost remains the development fallback.
        frontend_url = os.getenv(
            "FRONTEND_URL",
            "http://localhost:3000",
        )

        response = RedirectResponse(
            url=frontend_url
        )

        # Cross-domain cookie is required because:
        # frontend = Vercel
        # backend = Render
        response.set_cookie(
            key="ai_reviewer_session",
            value=session_id,
            httponly=True,
            secure=True,
            samesite="none",
            max_age=86400,
            path="/",
        )

        return response

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e),
        )


@router.get("/gitlab/login")
async def gitlab_login():
    """
    Start GitLab OAuth login.
    """

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
        url=gitlab_url
    )


@router.get("/gitlab/callback")
async def gitlab_callback(
    request: Request,
    code: str,
    state: str,
):
    """
    Handle GitLab OAuth callback.
    """

    code_verifier = consume_gitlab_oauth_state(
        state
    )

    if not code_verifier:
        raise HTTPException(
            status_code=400,
            detail="Invalid or expired GitLab OAuth state",
        )

    try:
        token_data = (
            await exchange_gitlab_code_for_token(
                code=code,
                code_verifier=code_verifier,
            )
        )

        user = await get_gitlab_user(
            token_data["access_token"]
        )

        session_id, _ = create_session(
            user=user,
            token_data=token_data,
        )

        frontend_url = os.getenv(
            "FRONTEND_URL",
            "http://localhost:3000",
        )

        response = RedirectResponse(
            url=frontend_url
        )

        response.set_cookie(
            key="ai_reviewer_session",
            value=session_id,
            httponly=True,
            secure=True,
            samesite="none",
            max_age=86400,
            path="/",
        )

        return response

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e),
        )

@router.get("/me")
async def get_current_user(
    request: Request,
):
    """
    Return the currently authenticated user.
    """

    session_id = request.cookies.get(
        "ai_reviewer_session"
    )

    if not session_id:
        return {
            "authenticated": False,
            "user": None,
        }

    session = get_session(
        session_id
    )

    if not session:
        return {
            "authenticated": False,
            "user": None,
        }

    user = session["user"]

    return {
        "authenticated": True,
        "user": {
            "id": user.get("id"),
            "login": user.get("login"),
            "name": user.get("name"),
            "avatar_url": user.get("avatar_url"),
        },
    }


@router.post("/logout")
async def logout(
    request: Request,
):
    """
    Destroy the current application session
    and remove the browser session cookie.
    """

    session_id = request.cookies.get(
        "ai_reviewer_session"
    )

    if session_id:
        delete_session(
            session_id
        )

    response = JSONResponse(
        content={
            "status": "success",
            "message": "Logged out",
        }
    )

    # The cookie attributes must match the
    # production cookie attributes used during login.
    response.delete_cookie(
        key="ai_reviewer_session",
        path="/",
        secure=True,
        samesite="none",
    )

    return response