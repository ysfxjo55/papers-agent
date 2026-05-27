# Postman / API collection

1. Start the API locally (`apps/api` — add when scaffold exists).
2. Open `http://localhost:8000/docs` (FastAPI Swagger).
3. Import OpenAPI URL into Postman: `http://localhost:8000/openapi.json`
4. Export collection to this folder as `aimind.postman_collection.json` when endpoints stabilize.

**Environments**

| Variable | Local | Staging |
|----------|-------|---------|
| `baseUrl` | `http://localhost:8000` | `https://api.staging.example.com` |
| `token` | Clerk JWT | Clerk JWT |
