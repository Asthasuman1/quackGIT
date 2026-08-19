import secrets

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
    code_verifier, code_challenge = (
        create_pkce_pair()
    )

    state = create_oauth_state(
        code_verifier
    )

    return RedirectResponse(
        url=get_github_login_url(
            state=state,
            code_challenge=code_challenge,
        )
    )


@router.get("/github/callback")
async def github_callback(
    request: Request,
    code: str,
    state: str,
):
    code_verifier = consume_oauth_state(
        state
    )

    if not code_verifier:
        raise HTTPException(
            status_code=400,
            detail="Invalid or expired OAuth state",
        )

    try:
        token_data = await exchange_code_for_token(
            code=code,
            code_verifier=code_verifier,
        )

        user = await get_github_user(
            token_data["access_token"]
        )

        session_id, _ = create_session(
            user=user,
            token_data=token_data,
        )

        response = RedirectResponse(
            url="http://localhost:3000"
        )

        response.set_cookie(
            key="ai_reviewer_session",
            value=session_id,
            httponly=True,
            secure=False,
            samesite="lax",
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
    session_id = request.cookies.get(
        "ai_reviewer_session"
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
    session_id = request.cookies.get(
        "ai_reviewer_session"
    )

    if session_id:
        delete_session(session_id)

    response = JSONResponse(
        content={
            "status": "success",
            "message": "Logged out",
        }
    )

    response.delete_cookie(
        key="ai_reviewer_session",
        path="/",
    )

    return response