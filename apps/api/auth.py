import os

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.exc import IntegrityError

from models import User
from repository import create_user, get_user_by_email, get_user_by_id
from schema import LoginRequest, OkResponse, RegisterRequest, UserResponse
from security import create_access_token, decode_access_token, hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])

COOKIE_NAME = "ai_mind_session"
COOKIE_MAX_AGE = 60 * 60 * 24 * 7  # 7 days, matches the JWT's own expiry


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


@router.post("/register", status_code=status.HTTP_201_CREATED, response_model=UserResponse)
def register(request: RegisterRequest, response: Response):
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

    token = create_access_token(user.id)
    _set_session_cookie(response, token)
    return UserResponse.model_validate(user)


@router.post("/login", response_model=UserResponse)
def login(request: LoginRequest, response: Response):
    email = request.email.strip().lower()
    user = get_user_by_email(email)
    if user is None or not verify_password(request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password."
        )

    token = create_access_token(user.id)
    _set_session_cookie(response, token)
    return UserResponse.model_validate(user)


@router.post("/logout", response_model=OkResponse)
def logout(response: Response):
    response.delete_cookie(COOKIE_NAME, path="/")
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
