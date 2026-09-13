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


class WaitlistRequest(BaseModel):
    email: str
    source: Literal["waitlist", "founding_member"] = "waitlist"
    note: Optional[str] = None


class WaitlistResponse(BaseModel):
    ok: bool = True


class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


class UserResponse(BaseModel):
    id: int
    name: str
    email: str

    model_config = ConfigDict(from_attributes=True)


class OkResponse(BaseModel):
    ok: bool = True
