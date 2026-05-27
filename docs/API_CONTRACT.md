# API contract (agreed by A + B)
## Endpoint (later, not built yet)
GET /notebooks/{id}
## Response shape
The response is one object with three lists:
- nodes
- edges
- messages

{
  "nodes": [
    {
      "id": "transformer",
      "kind": "paper",
      "parent_id": null,
      "label": "Transformer",
      "year": 2017,
      "category": "architecture",
      "summary": "Vaswani et al. — Attention Is All You Need.",
      "annotations": [],
      "x": 1200,
      "y": 460
    },
    {
      "id": "c_self_attn",
      "kind": "concept",
      "parent_id": "transformer",
      "label": "self-attention",
      "year": 2017,
      "category": "architecture",
      "summary": "Tokens attend to every other token in parallel.",
      "annotations": [],
      "x": 0,
      "y": 0
    }
  ],
  "edges": [
    {
      "from": "attention",
      "to": "transformer",
      "type": "extends"
    }
  ],
  "messages": [
    {
      "role": "assistant",
      "content": "Welcome to your notebook. This is a living chart of how machines learned to think."
    }
  ]
}

## Agreed rules
- v1: AI history only
- MVP: one notebook per user
- Week 1 test id: "seed"
