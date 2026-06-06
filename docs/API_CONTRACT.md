# API contract (agreed by A + B)

Base URL (local dev): `http://127.0.0.1:8000`

---

## GET /notebooks/seed

**Status:** Built (MVP test notebook)

**Owner:** Engineer A (API), Engineer B loads on page init in `page.tsx`

### Response shape

The response is one object with three lists:

- nodes
- edges
- messages

```json
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
```

---

## GET /notebooks/{id}

**Status:** Not built (future generic version — DB later)

Same response shape as `/notebooks/seed`. Week 1 test id: `"seed"`.

---

## POST /chat

**Status:** Not built (defining now)

**Owner:** Engineer A (API), Engineer B wires URL + parsing in `store.ts`

### URL

```
POST http://127.0.0.1:8000/chat
```

(`POST /notebooks/{id}/chat` is the REST-y alternative for a later sprint.)

### Request headers

```
Content-Type: application/json
```

### Request body

Same shape as `callTutor` in `store.ts` (what gets `JSON.stringify`'d):

| Field    | Type   | Who fills it |
|----------|--------|--------------|
| `system` | string | Web — full tutor rules from `buildTutorSystemPrompt(state)` (includes existing node IDs) |
| `messages` | array | Web — last ~10 user/assistant turns + current user message |

Each message in `messages`:

| Field     | Values |
|-----------|--------|
| `role`    | `"user"` or `"assistant"` |
| `content` | string |

**Rule:** API forwards `system` + `messages` to Anthropic. Do **not** duplicate the long prompt in Python for MVP — single source of truth stays in `store.ts`.

### Response — Option A (raw model text)

Response body is a JSON object with one field:

| Field     | Type   | Purpose |
|-----------|--------|---------|
| `content` | string | Raw string the model returned (the JSON tutor blob as text, sometimes wrapped in markdown fences) |

**Web change (Engineer B):** pass `data.content` into `parseTutorResponse`, not the whole response object. Do **not** run the entire response through `parseTutorResponse` — that would stringify the object to `"[object Object]"` and fail.

Example response:

```json
{
  "content": "{\"reply\": \"Multi-head attention splits the representation into several subspaces so the model can attend to different aspects in parallel.\", \"focus\": \"transformer\", \"new_nodes\": [{\"id\": \"c_multi_head\", \"kind\": \"concept\", \"parent_id\": \"transformer\", \"label\": \"multi-head attention\", \"year\": 2017, \"category\": \"architecture\", \"summary\": \"Several attention heads run in parallel over different learned projections.\"}], \"new_edges\": [], \"annotations\": [{\"node_id\": \"transformer\", \"text\": \"eight parallel heads\"}]}"
}
```

After `parseTutorResponse(data.content)`, the parsed tutor object shape is below.

### Tutor object shape

Fields match `TutorResponse` in `store.ts` and `applyTutorResult`:

| Field         | Required | Purpose |
|---------------|----------|---------|
| `reply`       | yes      | Chat bubble text |
| `focus`       | optional | Node id to highlight, or `null` |
| `new_nodes`   | array    | New papers/concepts to add |
| `new_edges`   | array    | New relationships |
| `annotations` | array    | Marginal notes on nodes |

**`new_nodes` item:** `id`, `kind` (`paper` | `concept`), `parent_id` (for concepts), `label`, `year`, `category`, `summary`

No `x`, `y`, `rotation` — web computes placement via `positionNode` in `applyTutorResult`.

**`new_edges` item:** `from`, `to`, `type` (same relation types as seed / `REL_LABELS`: `extends`, `enables`, `precedes`, `applies`, `uses`, `inspired_by`, `critiques`)

**`annotations` item:** `node_id`, `text` (short, 3–7 words)

Example tutor object (after parsing):

```json
{
  "reply": "Multi-head attention splits the representation into several subspaces so the model can attend to different aspects in parallel.",
  "focus": "transformer",
  "new_nodes": [
    {
      "id": "c_multi_head",
      "kind": "concept",
      "parent_id": "transformer",
      "label": "multi-head attention",
      "year": 2017,
      "category": "architecture",
      "summary": "Several attention heads run in parallel over different learned projections."
    }
  ],
  "new_edges": [],
  "annotations": [
    { "node_id": "transformer", "text": "eight parallel heads" }
  ]
}
```

### HTTP errors

| Code | When |
|------|------|
| 200  | Success |
| 422  | Bad request body |
| 500  | Anthropic error / server error |

Web already shows ⚠️ on any failure — no special error JSON required for MVP.

### CORS

Same as seed: `http://localhost:3000` and `http://127.0.0.1:3000`.

---

## Agreed rules

- v1: AI history only
- MVP: one notebook per user
- Week 1 test id: `"seed"`
- Chat uses the same categories and edge types as the notebook contract
- v1: no auth on `/chat` (localhost only)
- API key lives only on the server (`apps/api/.env`), never in the web app
- Persistence after chat: still localStorage until DB sprint
