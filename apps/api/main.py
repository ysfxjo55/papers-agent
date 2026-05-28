from fastapi import FastAPI, status
from schema import Edge, GraphResponse, Message, Node

app = FastAPI()

@app.get("/health", status_code=status.HTTP_200_OK)
def health_check():
    return {"status": "ok"}

# Add the response_model and enable response_model_by_alias
@app.get(
    "/notebooks/seed",
    status_code=status.HTTP_200_OK,
    response_model=GraphResponse,
    response_model_by_alias=True
)
def get_seed_notebook():
    return GraphResponse(
        nodes=[
            Node(
                id="transformer",
                kind="paper",        # Added required field
                label="Transformer", # Added required field
                year=2017,          # Added required field
                category="architecture",
                summary="Vaswani et al.",
                x=1200,             # Added required field
                y=460               # Added required field
            )
        ],
        edges=[
            Edge(
                from_node="transformer",
                to="attention",
                type="enables",
            ),
        ],
        messages=[
            Message(
                role="user",
                content="What is the Transformer?",
            ),
        ],
    )
