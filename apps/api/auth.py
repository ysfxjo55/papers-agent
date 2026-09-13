import os

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from fastapi.responses import RedirectResponse
from sqlalchemy.exc import IntegrityError

from mailer import send_verification_email
from models import User
from repository import (
    create_user,
    get_user_by_email,
    get_user_by_id,
    mark_email_verified,
)
from schema import (
    LoginRequest,
    OkResponse,
    RegisterRequest,
    RegisterResponse,
    ResendVerificationRequest,
    UserResponse,
)
from security import (
    create_access_token,
    create_verification_token,
    decode_access_token,
    decode_verification_token,
    hash_password,
    verify_password,
)

router = APIRouter(prefix="/auth", tags=["auth"])

COOKIE_NAME = "ai_mind_session"
COOKIE_MAX_AGE = 60 * 60 * 24 * 7  # 7 days, matches the JWT's own expiry

# API_PUBLIC_URL: this API's own public URL, used to build the link inside the
# verification email (the user clicks it in their inbox, so it must be reachable,
# not localhost, in production). FRONTEND_URL: where /auth/verify redirects the
# browser back to once the link is confirmed.
API_PUBLIC_URL = os.getenv("API_PUBLIC_URL", "http://localhost:8000")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")


def _is_valid_email(email: str) -> bool:
    return "@" in email and "." in email.split("@")[-1]


def _set_session_cookie(response: Response, token: str) -> None:
    cross_site = os.getenv("AUTH_COOKIE_CROSS_SITE", "false").strip().lower() == "true"
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        httponly=True,
        secure=cross_site,
        samesite="none" if cross_site else "lax",
        max_age=COOKIE_MAX_AGE,
        path="/",
    )


def _send_verification(user: User) -> None:
    token = create_verification_token(user.id)
    verify_url = f"{API_PUBLIC_URL}/auth/verify?token={token}"
    send_verification_email(user.email, user.name, verify_url)


@router.post("/register", status_code=status.HTTP_201_CREATED, response_model=RegisterResponse)
def register(request: RegisterRequest):
    name = request.name.strip()
    email = request.email.strip().lower()

    if not name:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Name is required."
        )
    if not _is_valid_email(email):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="A valid email is required.",
        )
    if len(request.password) < 8:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Password must be at least 8 characters.",
        )

    try:
        user = create_user(name, email, hash_password(request.password))
    except IntegrityError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Email already registered."
        )

    try:
        _send_verification(user)
    except Exception as e:
        # Don't fail registration if the email provider hiccups — the account
        # still exists and the user can request a new link via /resend-verification.
        print(f"Failed to send verification email to {user.email}: {e}")

    return RegisterResponse(
        message="Check your email to confirm your account.", email=user.email
    )


@router.post("/login", response_model=UserResponse)
def login(request: LoginRequest, response: Response):
    email = request.email.strip().lower()
    user = get_user_by_email(email)
    if user is None or not verify_password(request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password."
        )
    if not user.email_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Please verify your email before signing in.",
        )

    token = create_access_token(user.id)
    _set_session_cookie(response, token)
    return UserResponse.model_validate(user)


@router.post("/logout", response_model=OkResponse)
def logout(response: Response):
    response.delete_cookie(COOKIE_NAME, path="/")
    return OkResponse()


@router.get("/verify")
def verify_email(token: str):
    """Landed on directly from the link in the confirmation email — not called
    by the frontend's JS, so it responds with a redirect back into the app
    rather than JSON.
    """
    try:
        user_id = decode_verification_token(token)
        user = get_user_by_id(user_id)
        if user is None:
            raise ValueError("User not found.")
    except Exception:
        return RedirectResponse(f"{FRONTEND_URL}/login?verified=0")

    mark_email_verified(user_id)
    return RedirectResponse(f"{FRONTEND_URL}/login?verified=1")


@router.post("/resend-verification", response_model=OkResponse)
def resend_verification(request: ResendVerificationRequest):
    email = request.email.strip().lower()
    user = get_user_by_email(email)
    if user is not None and not user.email_verified:
        try:
            _send_verification(user)
        except Exception as e:
            print(f"Failed to resend verification email to {user.email}: {e}")
    # Always report success, whether or not the email is registered/unverified,
    # so this endpoint can't be used to probe which emails have accounts.
    return OkResponse()


def get_current_user(request: Request) -> User:
    """Reusable dependency: verifies the session cookie and loads the user.

    Use as `current_user: User = Depends(get_current_user)` on any route that
    should require a signed-in user; FastAPI runs this first and either
    injects the returned User or short-circuits the request with the
    HTTPException raised below.
    """
    token = request.cookies.get(COOKIE_NAME)
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated.")
    try:
        user_id = decode_access_token(token)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired session."
        )
    user = get_user_by_id(user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found.")
    return user


@router.get("/me", response_model=UserResponse)
def me(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)
