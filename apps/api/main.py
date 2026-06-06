from fastapi import FastAPI, status, HTTPException
from schema import GraphResponse, ChatRequest, ChatResponse
from seed_data import seed_data
from fastapi.middleware.cors import CORSMiddleware

from tutor import get_ai_reply


app = FastAPI()

ALLOW_ORIGINS=["http://localhost:3000", "http://127.0.0.1:3000"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOW_ORIGINS,
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
    return seed_data

@app.post("/chat", status_code=status.HTTP_200_OK, response_model=ChatResponse)
def post_chat(request: ChatRequest):
    try:
        response = get_ai_reply(request.system, request.messages)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
    return ChatResponse(content=response)
