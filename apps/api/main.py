from fastapi import FastAPI, status
from schema import Edge, GraphResponse, Message, Node
from seed_data import seed_data
app = FastAPI()

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
