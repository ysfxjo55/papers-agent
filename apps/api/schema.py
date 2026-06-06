from datetime import datetime
from typing import List, Literal, Optional
from pydantic import BaseModel, Field, ConfigDict

# class Annotation(BaseModel):
#     node_id: str
#     text: str

class Node(BaseModel):
    id: str
    kind: Literal["paper", "concept"]
    parent_id: Optional[str] = None
    label: str
    year: int
    category: str
    summary: str
    annotations: List[str] = Field(default_factory=list)
    x: int
    y: int

class Edge(BaseModel):
    from_node: str = Field(..., alias="from")
    to: str
    type: str

    model_config = ConfigDict(
        populate_by_name=True,
        by_alias=True
    )

class Message(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    system: str
    messages: List[Message]


class ChatResponse(BaseModel):
    content: str

class GraphResponse(BaseModel):
    nodes: List[Node] = Field(default_factory=list)
    edges: List[Edge] = Field(default_factory=list)
    messages: List[Message] = Field(default_factory=list)
