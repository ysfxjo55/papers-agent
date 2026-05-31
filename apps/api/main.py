from fastapi import FastAPI, status
from schema import GraphResponse
from seed_data import seed_data
from fastapi.middleware.cors import CORSMiddleware



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
