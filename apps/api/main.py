import os

from fastapi import FastAPI, status, HTTPException
from schema import (
    GraphResponse,
    ChatRequest,
    ChatResponse,
    WaitlistRequest,
    WaitlistResponse,
)
from repository import get_notebook, add_waitlist_entry, reset_notebook, save_notebook
from fastapi.middleware.cors import CORSMiddleware

from auth import router as auth_router
from tutor import get_ai_reply

app = FastAPI()
app.include_router(auth_router)

DEFAULT_ORIGINS = "http://localhost:3000,http://127.0.0.1:3000"
DEFAULT_ORIGIN_REGEX = r"https://.*\.vercel\.app"
ALLOW_ORIGINS = [
    o.strip()
    for o in os.getenv("ALLOW_ORIGINS", DEFAULT_ORIGINS).split(",")
    if o.strip()
]
ALLOW_ORIGIN_REGEX = os.getenv("ALLOW_ORIGIN_REGEX", DEFAULT_ORIGIN_REGEX).strip()

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOW_ORIGINS,
    allow_origin_regex=ALLOW_ORIGIN_REGEX or None,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health", status_code=status.HTTP_200_OK)
def health_check():
    return {"status": "ok"}

@app.get(
    "/notebooks/seed",
    status_code=status.HTTP_200_OK,
    response_model=GraphResponse,
    response_model_by_alias=True
)
def get_seed_notebook():
    try:
        return get_notebook("seed")
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
@app.post("/chat", status_code=status.HTTP_200_OK, response_model=ChatResponse)
def post_chat(request: ChatRequest):
    try:
        response = get_ai_reply(request.system, request.messages)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
    return ChatResponse(content=response)


@app.post(
    "/waitlist",
    status_code=status.HTTP_201_CREATED,
    response_model=WaitlistResponse,
)
def post_waitlist(request: WaitlistRequest):
    email = request.email.strip().lower()
    if "@" not in email or "." not in email.split("@")[-1]:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="A valid email is required.",
        )
    try:
        add_waitlist_entry(email, request.source, request.note)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
    return WaitlistResponse(ok=True)


@app.put(
    "/notebooks/{notebook_id}",
    status_code=status.HTTP_200_OK,
    response_model=GraphResponse,
    response_model_by_alias=True,
)
def put_notebook(notebook_id: str, request: GraphResponse):
    try:
        save_notebook(notebook_id, request)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
    return request


@app.post(
    "/notebooks/{notebook_id}/reset",
    status_code=status.HTTP_200_OK,
    response_model=GraphResponse,
    response_model_by_alias=True,
)
def post_reset_notebook(notebook_id: str):
    try:
        return reset_notebook(notebook_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
