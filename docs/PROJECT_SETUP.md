# Project setup & execution guide

> **Product name (working):** AI Mind — see [§3 Naming](#3-naming) before locking branding.  
> **Companion docs:** [`plan.md`](../plan.md) (full product/engineering plan) · [`prototype/`](../prototype/) (working demo)

This document answers: *what do we do now?* — in order, with decisions, repo layout, and sprint rhythm.

---

## Team reality (read first)

| Fact | Implication |
|------|-------------|
| **2 AI engineers**, no PM, no designer, no frontend specialist | No enterprise process — use a **shared checklist** in this file instead of Jira |
| **Strong:** Python, FastAPI, Pydantic, Docker, RAG, tool-calling LLMs, Railway/Render | **Backend + tutor = home turf** — build here first |
| **Light:** Laravel (touched, not primary), frontend (HTML/JS + AI assist) | **Do not adopt Laravel** for this product — adds a second language without helping the tutor |
| **Also learning** how to ship a full product, not only ML | Each sprint has **learning goals** (§7), not only features |
| **Other jobs / study** (not full-time on AI Mind) | Timelines in `plan.md` are **aspirational** — use **§7 part-time calendar** (~8–12 hrs/week total) |

**You are not behind.** You already have: a working prototype, production FastAPI habits, and agent/tool patterns from other projects. The gap is **product glue** (auth, DB, Next.js shell) — learn that **just-in-time** while porting what works.

### Informal roles (no PM)

| Person | Default ownership | When stuck |
|--------|-------------------|------------|
| **Engineer A** | FastAPI, DB, tutor/tool-use, deploy API | Pair on canvas |
| **Engineer B** | Next.js shell, port `canvas.jsx` / `chat-app.jsx`, Clerk | Pair on tutor schema |

Swap weekly if you want both to learn both sides. **Rule:** whoever touches the API updates Postman the same day.

### What to skip in Phase 0–1

- Figma polish beyond a mood board (use `prototype/styles.css`)
- Laravel evaluation
- Hiring a PM
- Multi-notebook, sharing, RAG, Stripe enforcement (later phases)

---

## 0. What to do right now (ordered)

You are past “idea.” You are in **Phase 0 — Sharpen** (see `plan.md` §4), at **part-time pace**. Do **not** spend a week on Laravel or a full Next.js course.

| # | Activity | Time (2 people, part-time) | Output |
|---|----------|----------------------------|--------|
| 1 | **Finish product locks** | 2–3 evenings | §1.2 open questions in `plan.md` |
| 2 | **Name shortlist** (skip perfect domain) | 1 evening | 3 names; pick one |
| 3 | **Storyboard** (paper or Figma lite) | 1 evening | 5 frames of first session |
| 4 | **Repo skeleton** | 1 weekend day | `apps/api` first; `apps/web` can wait |
| 5 | **API + Postman** | 1 evening | `/health`, notebook JSON shape |
| 6 | **Sprint A — backend slice** | 2–3 weeks | Tutor turn → graph ops → Postgres |
| 7 | **Sprint B — frontend slice** | 2–3 weeks | Port prototype; wire to API |
| 8 | **Study similar products** | 30 min/week | Patterns only (§2) |

**Learn vs practice vs read (for your team):**  
- **Practice (70%):** FastAPI endpoints you can hit from Postman; then one screen in Next.js.  
- **AI-assisted frontend (20%):** Cursor/Claude with `prototype/` open — paste `canvas.jsx` / `styles.css` as context; review every file.  
- **Read (10%):** One doc per gap (e.g. “Next.js client component”, “FastAPI SSE”) when the sprint needs it.

**Skills you will naturally level up:** OpenAPI, Alembic, SSE streaming, React client components, env-based deploy — all transferable from your existing FastAPI + agent work.

---

## 1. Locked product summary (1.1)

| Dimension | Decision |
|-----------|----------|
| First user | Self-taught practitioner reading AI history papers |
| Secondary | History-of-science enthusiast |
| One job | Remember everything learned about AI history, structured the way *I* think |
| Core interaction | Chat → focus → paper on timeline → concepts + marginalia accrete |
| Sessions | Episodic, reading-aligned; graph compounds over months |
| Sharing | Selective; private by default |

---

## 2. Similar projects to study (patterns, not stacks)

| Project / pattern | What to steal |
|-------------------|---------------|
| **Your prototype** | Tutor JSON contract, paper/concept kinds, timeline layout |
| **Are.na** | Editorial restraint, blocks, calm UI |
| **Readwise** | Long-horizon memory, return prompts (Phase 3) |
| **Connected Papers / Research Rabbit** | Paper-centric discovery (we are *memory*, not discovery) |
| **Obsidian + Copilot** | Proof that plugin + paid API works — also proof that generic PKM is not our UX |
| **Karpathy LLM wiki** | Auto-linking ideas — we add *typed edges* + *timeline* + *tutor* |
| **Excalidraw** | Hand-drawn warmth for canvas feel |

**Do not** spend Phase 0 rebuilding any of these. Extract 1–2 screenshots each into a Figma “inspiration” page and move on.

---

## 3. Naming

**Working title:** AI Mind (`papers_agent` repo folder is fine until rename).

| Candidate | Pros | Cons |
|-----------|------|------|
| **AI Mind** | Clear, matches `plan.md` | Generic; domain likely taken |
| **Marginalia** | Poetic, matches annotations | Not obvious for new users |
| **The Notebook** | Matches prototype chat title | Too generic |
| **Chronicle** | Timeline implied | Crowded name space |
| **Penumbra** | Literary (plan references Sloan) | Obscure spelling |

**Process:**  
1. Pick 3 finalists by end of Phase 0.  
2. Check `.com` / social handles (don't block build on perfect domain).  
3. Lock name before marketing site (Phase 1 end).

Use Claude (or Figma AI) for **naming exploration only after** you have a one-paragraph brief (below §12).

---

## 4. Stack decisions — **locked for this team**

### 4.1 Decisions (no more debate)

| Layer | Choice | Why (for 2 Python AI engineers) |
|-------|--------|----------------------------------|
| **Backend** | **FastAPI** | You already ship this; tutor, tools, RAG, webhooks stay in one language |
| **Backend** | ~~Laravel~~ | **Skip** — little team experience; tutor still needs Python → two stacks |
| **Frontend** | **Next.js (TypeScript)** | AI tools document it well; deploy on Vercel; port prototype React |
| **Frontend learning** | Cursor + prototype files as context | Not a bootcamp — one route, one canvas component at a time |
| **Design** | `prototype/styles.css` + light Figma optional | No designer; don’t block on Figma |
| **Repos** | Monorepo `apps/api` + `apps/web` | One GitHub repo |
| **API testing** | Postman | You know HTTP; OpenAPI from FastAPI |
| **DB** | **PostgreSQL (Neon)** | Same as your other projects; pgvector later for RAG |
| **Hosting** | **Railway or Render** for API (you’ve used both) + **Vercel** for web | DigitalOcean is fine later; don’t over-optimize host on day 1 |
| **Auth** | **Clerk** | Saves ~1 week vs rolling auth; worth it for a 2-person team |

### 4.2 What you reuse from past work

| Pattern | Use in AI Mind |
|---------|----------------|
| FastAPI + Pydantic v2 + structlog | API layer |
| Tool-calling / structured JSON from LLM | Port `prototype/shared.js` tutor → explicit tools (`add_node`, `annotate`, …) |
| SSE or streaming responses | Chat UI |
| Docker + Railway/Render | Staging deploy |
| RAG (BM25 + vectors) later | Phase 2 — you already know this pipeline |
| MCP / agents (optional) | Not needed for MVP; tutor is simpler than Bella-scale agent |

### 4.3 Frontend: plain JS vs React vs Next

### 4.4 Frontend: plain JS vs React vs Next

| Option | Verdict |
|--------|---------|
| Plain JS (like prototype) | OK for prototype; no auth/routing/SSR story |
| React (Vite) | Fine; you rebuild routing, auth integration |
| **Next.js** | **Best for MVP** — API routes optional; deployment on Vercel; TS types from OpenAPI |

---

## 5. Repository structure

**Recommendation:** one GitHub repo (monorepo), two deployable apps — not two unrelated repos until you have a release engineer.

```
papers_agent/                    # rename later to product name
├── apps/
│   ├── web/                     # Next.js — canvas + chat + marketing
│   └── api/                     # FastAPI — tutor, graph persistence, webhooks
├── packages/
│   └── shared-types/            # generated from OpenAPI (optional Phase 1)
├── prototype/                   # keep until web canvas parity
├── docs/
│   ├── PROJECT_SETUP.md         # this file
│   ├── API.md                   # human-readable API notes (Phase 1)
│   └── postman/                 # Postman collection JSON
├── plan.md
├── README.md
├── docker-compose.yml           # local Postgres (optional; or use Neon dev branch)
└── .env.example
```

**GitHub (week 1):**  
- [ ] Create private repo  
- [ ] Add `.gitignore` (node, python, `.env`)  
- [ ] Never commit API keys  
- [ ] Branch: `main` + feature branches; PR optional for solo, required for team  

---

## 6. When to connect frontend and backend

**Not at the end.** Integrate every sprint.

| Sprint | Integration milestone |
|--------|------------------------|
| **S0** | Postman hits `GET /health`, `GET /notebooks/:id` with mock JSON |
| **S1** | Web login → load empty notebook from API |
| **S2** | One chat message → SSE stream reply + graph ops persisted |
| **S3** | Canvas reads nodes/edges from API; focus/selection works |
| **S4** | Deploy staging: web (Vercel) ↔ api (DO) ↔ Neon |

Use **OpenAPI** (`/docs` on FastAPI) → export types for Next.js once per sprint.

---

## 7. Sprints (realistic for 2 part-time AI engineers)

`plan.md` Phase 1 says “~3 weeks” — that assumes full-time product engineers. For **~8–12 hrs/week total**, use this calendar instead.

### Phase 0 — Sharpen (~2 weeks part-time)

- [ ] Lock §1.2 scope questions in `plan.md`  
- [ ] Name shortlist (3 → 1)  
- [ ] 5 storyboard frames (sketches OK)  
- [ ] `docs/BRIEF.md` — names + target MVP date  
- [ ] List 5 real people for beta (friends/classmates)

### Phase 1 — MVP (~8–10 weeks part-time)

| Sprint | Calendar (guide) | Build | Learning goal |
|--------|------------------|-------|----------------|
| **A1** | Week 1–2 | `apps/api`: FastAPI, Neon, Alembic, `Node`/`Edge` models, `GET/POST` notebook | Alembic migrations; SQLAlchemy relationships |
| **A2** | Week 3–4 | `POST .../chat`: port tutor prompt; tool calls; save `graph_ops` on `Message` | Anthropic tool use in FastAPI; Pydantic validation |
| **A3** | Week 5 | SSE streaming for `reply`; Postman + tests for one golden chat turn | SSE in FastAPI; pytest for API |
| **B1** | Week 6–7 | `apps/web`: Next.js shell, Clerk, load notebook JSON, static chat | Next.js App Router; fetch + auth headers |
| **B2** | Week 8–9 | Port `canvas.jsx` + `styles.css`; wire focus/selection to API data | Client components; SVG in React |
| **B3** | Week 10 | Deploy staging (Render/Railway + Vercel); dogfood with 2–3 friends | Env vars, CORS, basic logging |

**Defer to Phase 2:** Stripe enforcement, RAG, sharing, marketing site polish.

**Success (adjusted):** you two can complete a full session (chat → new node on canvas → reload page → graph still there). Then invite 5–10 beta users.

### Phase 2+

See `plan.md` — RAG, provenance, billing, sharing. Add ~4–6 weeks part-time per phase.

### Weekly rhythm (no PM)

| Day | 30–60 min |
|-----|-----------|
| **Sync** (15 min) | What shipped? Blocker? Who owns next PR? |
| **Build** | One vertical slice only — no “start frontend and backend” same day unless pairing |
| **Doc** | Update Postman or a line in `docs/API.md` when an endpoint changes |

---

## 8. Database — yes, required

**Why:** Multi-device notebooks, user accounts, chat history, graph provenance, subscriptions.

### Core tables (MVP)

- `users` (or Clerk external id only)  
- `notebooks`  
- `nodes`, `edges`, `annotations`  
- `messages` (chat turns + `graph_ops` JSON)  

Schema matches `plan.md` §2 (prototype types).

### Setup path

1. **Local dev:** Neon free branch *or* `docker-compose` Postgres  
2. **Migrations:** Alembic (Python) — never edit prod by hand  
3. **Prod:** Neon production branch + connection string in DO app env  

---

## 9. Hosting & infrastructure

| Service | Role | Suggestion |
|---------|------|------------|
| **Neon** | Postgres (+ pgvector later) | Free tier; separate dev/staging/prod branches |
| **DigitalOcean App Platform** | FastAPI container | Simple; auto HTTPS; env vars for DB + Anthropic |
| **Vercel** | Next.js frontend | Zero-config for Next; CORS to API domain |
| **Clerk** | Auth | Hosted |
| **Stripe** | Billing | Hosted checkout |
| **Anthropic** | Tutor LLM | API key in backend only |

**Alternative:** single DO Droplet + Docker Compose for everything — cheaper at scale, more ops work. Start with App Platform + Vercel until traffic justifies ops.

**When to provision production:** after Sprint 1.2 works locally — not day one.

---

## 10. Postman & API workflow

1. FastAPI auto-generates OpenAPI at `/openapi.json`.  
2. Import into Postman (or Bruno).  
3. Commit `docs/postman/collection.json` when endpoints stabilize.  
4. Every new endpoint: add to collection in same PR as backend route.  
5. Use environments: `local`, `staging`, `prod` with `{{baseUrl}}` and `{{token}}`.

**MVP endpoints (first collection):**

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/health` | Deploy check |
| GET | `/notebooks` | List user notebooks |
| GET | `/notebooks/{id}` | Full graph + recent messages |
| POST | `/notebooks/{id}/chat` | User message → SSE + graph mutations |
| PATCH | `/nodes/{id}` | Manual position tweak (optional) |

---

## 11. Design & visual identity (الهوية البصرية)

### Locked from prototype (`prototype/styles.css`)

| Token | Value | Usage |
|-------|-------|--------|
| Background | Parchment / warm off-white | Page, canvas |
| Type — display | **Fraunces** (serif) | Titles, node labels |
| Type — UI | System sans or Source Sans | Chat, buttons |
| Accent | Muted ink / sepia browns | Categories (see `CATEGORY_STYLES` in `data.js`) |
| Mood | Scholar's notebook, 19th-century naturalist | No gradients, no glass, no dark mode v1 |

### Figma workflow

1. **Mood board** — Are.na, prototype screenshots, Penguin Classics covers  
2. **Tokens page** — colors, type scale, spacing (export CSS variables)  
3. **5 storyboard frames** — first-time user session  
4. **Key screens** — canvas + chat + inspector (low-fi wireframe enough for Sprint 1)  

**Claude / AI for design:** use for copy, naming, marginalia examples — not as sole visual designer. Implementation source of truth remains prototype CSS until design system is extracted.

### Color palette (starter — refine in Figma)

| Name | Hex (approx) | Role |
|------|----------------|------|
| Parchment | `#F4EFE6` | Background |
| Ink | `#2C2416` | Primary text |
| Ink muted | `#5C5346` | Secondary text |
| Sepia line | `#C4B5A0` | Edges, grid |
| Foundations | category color from `data.js` | Node category |
| Vision | … | … |
| Language | … | … |
| RL | … | … |
| Architecture | … | … |

Copy exact values from `prototype/styles.css` when creating Figma styles.

---

## 12. Product brief (for pitch doc / Claude / investors)

Fill placeholders in `docs/BRIEF.md` or duplicate this section into a slide deck.

### Problem

People read AI history papers and explainers, but knowledge fragments across tabs, PDFs, and chat threads. They cannot see *their own* map of how ideas connected over time, and they forget what they cared about in each paper.

### Solution

A scholarly notebook in the browser: converse with an AI tutor; every paper, concept, and emphasis becomes a node on a personal timeline graph with typed relationships and marginalia — persisting and growing across months of reading.

### MVP benefits

- Personal timeline graph that reflects *your* curiosity, not a textbook table of contents  
- Chat that adds structure automatically (papers, concepts, notes)  
- Return after a week and see your map richer than before  
- Scholar aesthetic that feels like learning, not another chatbot  

### User types

| Type | v1 priority |
|------|-------------|
| Self-taught practitioner reading AI papers | **Primary** |
| History-of-science / AI history enthusiast | Secondary |
| Grad student / survey researcher | Not optimized in v1 |

### Team members

| Name | Role | Responsibilities |
|------|------|------------------|
| _Engineer 1_ | AI / backend lead | FastAPI, tutor, DB, deploy API |
| _Engineer 2_ | AI / full-stack | Same + Next.js port (AI-assisted) |
| PM / designer / dedicated frontend | **None** — prototype CSS is design; this doc is the plan |

*No PM:* track work with GitHub Issues or a shared checklist in this file; review each other’s PRs.

### Deadlines (example — adjust)

| Milestone | Target date |
|-----------|-------------|
| Phase 0 complete | _+1 week from today_ |
| MVP beta (20 users) | _+4 weeks_ |
| Paid beta (Stripe live) | _+8 weeks_ |

---

## 13. Documentation map

| File | Purpose |
|------|---------|
| [`plan.md`](../plan.md) | Full product, data model, phases, pricing |
| [`docs/PROJECT_SETUP.md`](PROJECT_SETUP.md) | This file — how we execute |
| [`docs/BRIEF.md`](BRIEF.md) | Problem / solution / MVP / users (short, shareable) |
| [`docs/API.md`](API.md) | API notes (create in Sprint 1) |
| [`docs/postman/`](../docs/postman/) | Postman collection |
| [`README.md`](../README.md) | Quick start + links |

---

## 14. Open decisions (finish in Phase 0)

Still in `plan.md` §1.2–1.3 — answer before Sprint 1.2:

- [ ] AI history only in v1, or any ML paper?  
- [ ] Single notebook vs multiple per user?  
- [ ] Unprompted push (email review) in v1? — suggest **no**  
- [ ] Can tutor invent nodes without source? — suggest **yes with label “unverified”** until Phase 2 RAG  

---

## 15. Checklist — “are we ready to code Sprint A1?”

- [x] Product 1.1 locked (`plan.md`)  
- [x] Stack locked: **FastAPI + Next + Neon** (no Laravel)  
- [x] Team model: 2 AI engineers, part-time, learning while building  
- [ ] Name shortlist (3) — optional before code  
- [ ] 5 storyboard frames (sketches OK)  
- [ ] GitHub repo + `apps/api` folder first  
- [ ] Neon dev DB + `.env.example`  
- [ ] Postman: `GET /health`  
- [ ] Engineer A/B names + MVP target date in `docs/BRIEF.md`  

**Start Sprint A1** when API folder + Neon are ready — do not wait for Figma or perfect name.

---

## 16. First PR suggestion (Sprint A1, day 1)

Ship this before touching Next.js:

1. `apps/api/main.py` — `GET /health`  
2. SQLAlchemy models matching `plan.md` §2 (nodes, edges, annotations, messages)  
3. `POST /notebooks` + `GET /notebooks/{id}` returning seed graph JSON (copy from `prototype/data.js`)  
4. Postman collection committed  

When that works, you’ve proven the team can own the product — frontend is porting, not reinventing.
