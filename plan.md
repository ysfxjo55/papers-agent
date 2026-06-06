# AI Mind — Building Plan

> A personal, persistent mind map of one user's journey through the history of artificial intelligence. The chatbot is the tutor; the graph is the memory.

---

## 0. The product, in one paragraph

A scholarly notebook in the browser. The user converses with an AI tutor; every concept, paper, person, or idea discussed becomes a node on a hand-drawn timeline canvas. Edges are typed relationships (`extends`, `enables`, `inspired_by`, …). Side discussions become *marginalia* — short italic notes attached to the relevant node. The graph **persists and accumulates** across sessions — your map after six months looks unlike anyone else's, because it reflects what *you* actually got curious about.

---

## 1. Founding questions to answer before writing more code

Lock these down on paper. Each answer constrains the next 10 product decisions.

### 1.1 Product — **locked** (discussion → implementation)

- **First user:** Self-taught practitioner reading AI history papers; secondary: history-of-science enthusiast. Not optimizing for grad survey writers in v1.
- **One job:** Help me remember everything I've ever learned about AI history, structured the way I think about it.
- **Core interaction:** Chat sets focus on a paper/topic; paper nodes land on the timeline; concepts and marginalia accrete around what the user emphasized (see prototype: paper/concept kinds, focus, annotations).
- **Session length:** Episodic (reading-aligned); long-horizon accumulation over months. Optimize for second session within a week, not daily streaks.
- **Sharing:** Selective — private by default; share chosen subgraphs/links when the user chooses.

> Operational setup (repos, stack, sprints, hosting, docs): see [`docs/PROJECT_SETUP.md`](docs/PROJECT_SETUP.md).

### 1.2 Scope

- AI history only, or extensible to other domains (math history, philosophy, …)?
- Single-notebook per user, or multi-notebook (one per topic)?
- Does the tool ever push content unprompted (daily-card emails, spaced-review pings)?

### 1.3 Trust & accuracy

- Is the AI allowed to *invent* a node it isn't sure about? Or must it ground every claim in a real source?
- Do we surface provenance — "this node came from this exact chat exchange on this date"?
- What's the failure mode when the AI is wrong about a year, an author, a relationship?

### 1.4 Aesthetic & brand

- We have one: **scholar's notebook / 19th-century naturalist** — parchment, Fraunces serif, hand-drawn warmth, no gradients, no glassmorphism.
- Decide *now* never to add dark mode, theme switcher, accent picker. Sameness is a feature.

### 1.5 Business

- **This is a paid product. Subscription-based.** See §11 for the full pricing & monetization plan.
- Free tier exists only to seed value before the paywall — not as a permanent home.
- Open source the canvas engine, closed source the tutor + cloud sync + RAG corpus.
- Self-hostable? Only for enterprise/institutional tier.

---

## 2. Data model (locked, from the prototype)

```ts
type Node = {
  id: string                  // snake_case unique
  label: string               // English short name
  year: number
  category: 'foundations' | 'vision' | 'language' | 'rl' | 'architecture' | 'other'
  summary: string             // one sentence
  annotations: Annotation[]   // marginalia
  x: number; y: number; rotation: number   // computed
  source_message_id?: string  // provenance — which chat turn created this
  paper_url?: string          // future: linked source
  created_at: Date
}

type Edge = {
  from: NodeId
  to: NodeId
  type: 'extends' | 'enables' | 'precedes' | 'applies' | 'uses' | 'inspired_by' | 'critiques'
  source_message_id?: string
  created_at: Date
}

type Annotation = {
  id: string
  node_id: NodeId
  text: string                // 3–7 word marginal note
  source_message_id: string
  created_at: Date
}

type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at: Date
  graph_ops?: GraphOp[]       // what changed because of this turn
}
```

---

## 3. Architecture decisions — every option, with a recommendation

### 3.0 Our team — Python / AI / ML engineers

We are strong in Python, ML, and AI engineering. We are **not** specialist frontend or backend web engineers. The plan below is built around that reality — we lean Python wherever we can, and we make explicit decisions about how to cover the web-UI gap.

**The three honest options for filling the frontend/backend gap:**


| Option                                                                                           | When to choose                                               | Realistic cost                   | Speed                                                                             |
| ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------ | -------------------------------- | --------------------------------------------------------------------------------- |
| **(A) Hire a frontend contractor** for 6–10 weeks to build V1, then maintain ourselves           | We want product-grade polish out of the gate and have budget | $8k–$25k for a senior contractor | Fast and reliable                                                                 |
| **(B) Hire a frontend co-founder / first engineering hire**                                      | We want a long-term partner who owns the web product         | Equity + below-market salary     | Medium; slower to recruit                                                         |
| **(C) Build it ourselves with AI-assisted coding** (Cursor, Claude Code, v0.dev for scaffolding) | We're early; we want to control every detail; we're patient  | Subscriptions ~$60/mo            | Slower but viable — the prototype proves we can do this                           |
| **(D) Use a Python-native full-stack framework** (Reflex, FastHTML, NiceGUI)                     | We want minimum context-switching                            | Free                             | Fastest *if* the framework supports our custom SVG canvas — most won't, see below |


**Recommendation:** **(C) with an option to switch to (A) at the start of Phase 2.**

Reasoning: the prototype is already working in plain React/JSX. We wrote it. AI pair-programming (Cursor + Claude) is now strong enough that two Python engineers can ship a polished Next.js app — the bottleneck is taste and review cycles, not raw coding speed. Hire a contractor (A) the moment frontend work starts blocking ML work, not before.

**Why not (D) — the Python-native frameworks:**

- *Streamlit / Gradio* — wrong tool. They produce ML-demo-looking apps; impossible to achieve our scholar's-notebook aesthetic.
- *Reflex* — closer, but the custom SVG canvas with hand-drawn marginalia, hover/focus animations, and our typography demands real CSS control. Reflex would fight us.
- *FastHTML / HTMX* — good for the chat sidebar, but the canvas needs client-side state (selection, drag-pan, animations). We'd end up writing JS anyway.
- The honest verdict: **the canvas is the product. The canvas requires real frontend control. Don't fight it — embrace Next.js for the UI and keep all our ML/AI logic in Python on the backend.**

**The split that plays to our strengths:**

```
┌──────────────────────────────────┐       ┌──────────────────────────────────┐
│  Next.js frontend (TypeScript)   │ ────▶ │  Python backend (FastAPI)        │
│  — chat UI                       │       │  — Anthropic / OpenAI calls      │
│  — SVG canvas                    │       │  — Tool-use orchestration        │
│  — auth pages                    │       │  — RAG pipeline (LangChain/      │
│  — billing pages (Stripe.js)     │       │     LlamaIndex, pgvector)        │
│                                  │       │  — Embedding jobs                │
│  ~30% of total code              │       │  — Spaced-review scheduler       │
│  AI-assisted; small surface area │       │  — Stripe webhook handling       │
│                                  │       │  — Where we live, 70% of code    │
└──────────────────────────────────┘       └──────────────────────────────────┘
```

This split means: every interesting algorithmic decision (which model, what RAG, when to re-embed, how to score a tutor reply) happens in Python where we're strongest. Frontend is glue — important glue, but glue.

### 3.1 Should we train a custom model?


| Option                                                            | When it makes sense                 | Verdict                                                     |
| ----------------------------------------------------------------- | ----------------------------------- | ----------------------------------------------------------- |
| **Use Claude/GPT-4 as-is**                                        | Now — until 10k+ users              | ✅ Start here. The bottleneck is product, not model quality. |
| Fine-tune a small open model (Llama 3, Qwen) on AI-history papers | When inference cost > $X/user/month | Phase 4+                                                    |
| Train from scratch                                                | Never (for this product)            | ❌                                                           |


### 3.2 RAG strategy — naive, graph, or agentic?

The model needs to know AI history *accurately*. Three approaches:

**(a) No RAG, just the model's training data**

- Pros: simplest; works today for well-known topics
- Cons: hallucinates years, mixes up authors, doesn't know post-cutoff work
- Use: MVP only

**(b) Vector RAG over a curated corpus (papers + Wikipedia + textbooks)**

- Pros: grounds answers; catches obscure topics
- Cons: chunks lose structure; can't reason about *relationships*
- Use: V1 — index arXiv abstracts + key textbooks (Goodfellow, Russell & Norvig, etc.)

**(c) Graph RAG — query a knowledge graph (Wikidata / a curated one we build)**

- Pros: relationships are first-class; precise facts (years, authors)
- Cons: requires building/maintaining the graph
- Use: V2 — for *facts* about specific entities

**(d) Agentic RAG — the model chooses what to look up**

- Pros: handles complex questions ("compare AlexNet to VGG"); can hop multiple steps
- Cons: latency, cost, debugging complexity
- Use: V3 — when sessions get long and questions get deeper

**Recommended path:** start (a) → add (b) when hallucinations bite → add (c) for date/author lookups → add (d) once the product feels real.

### 3.3 LLM contract: JSON vs. tool use

The prototype asks the model to return JSON. Better:

- **Tool use** with explicit functions: `add_node`, `add_edge`, `annotate`, `set_focus`, `update_node`.
- Streaming: stream the `reply` text token-by-token; apply graph mutations as the tool call resolves.
- Validation: every tool call goes through a Zod schema before touching state.

### 3.4 Frontend stack (kept thin — the smaller this is, the less we suffer)


| Choice    | Recommendation                                                    | Why this is OK for Python engineers                                                          |
| --------- | ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Framework | **Next.js (App Router)** — but used as a thin UI shell only       | Heavily documented; Cursor/Claude generate good Next.js code                                 |
| Language  | TypeScript                                                        | Catches errors AI-generated code would otherwise hide                                        |
| Rendering | Server components for chat shell, client component for SVG canvas | Already proven in the prototype                                                              |
| State     | **Zustand** (one tiny store) — *not* Redux                        | Reads like Python — `useStore.getState()` is intuitive                                       |
| Canvas    | Hand-rolled SVG (port the prototype directly)                     | We already wrote it                                                                          |
| Styling   | CSS modules + design tokens from prototype                        | No Tailwind — its class soup fights the aesthetic *and* is harder for AI to refactor cleanly |
| Auth      | **Clerk** or **Auth.js** (next-auth) — magic link only            | Clerk has the simplest setup; trade $25/mo to skip a week of work                            |
| Billing   | **Stripe Checkout + Customer Portal + webhooks**                  | Stripe handles 90%; we just need a webhook endpoint (Python!)                                |
| Realtime  | Server-Sent Events for streaming chat                             | Single direction; trivially implemented                                                      |


### 3.5 Backend stack — Python-first, where we're strongest


| Layer             | Choice                                                                                                                       | Why                                                                                  |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| **API**           | **FastAPI** (Python)                                                                                                         | Plays to our strengths; async; auto OpenAPI docs; pairs with Pydantic for validation |
| Schema validation | Pydantic v2                                                                                                                  | Same models go to the LLM as tool definitions                                        |
| DB                | **Postgres** (Neon or Supabase)                                                                                              | Free tier on Neon; pgvector built in                                                 |
| ORM               | **SQLAlchemy 2.0** or **SQLModel**                                                                                           | Boring, well-known, every Python dev knows it                                        |
| Migrations        | Alembic                                                                                                                      | Standard                                                                             |
| Vector store      | **pgvector** inside Postgres                                                                                                 | One fewer service; we know SQL                                                       |
| LLM SDK           | **Anthropic Python SDK** primary; OpenAI SDK as fallback                                                                     | Direct port of the prototype                                                         |
| LLM orchestration | **Plain Python** to start; consider LangGraph only for Phase 3 agentic flows                                                 | Frameworks add magic that hurts debugging — avoid until needed                       |
| RAG               | **LlamaIndex** for ingestion + retrieval (it's Python-native and ML-engineer-friendly)                                       | Familiar idioms; works with pgvector                                                 |
| Embeddings        | **OpenAI text-embedding-3-small** or **Voyage AI**                                                                           | Cheap, accurate; we can switch later                                                 |
| Background jobs   | **Celery + Redis** OR **arq** (lighter) OR a Postgres-backed queue                                                           | We know Celery from ML pipelines                                                     |
| Auth verification | Verify Clerk/Auth.js JWTs in FastAPI middleware                                                                              | Standard pattern                                                                     |
| **Billing**       | **Stripe Python SDK + webhook handler in FastAPI**                                                                           | Webhooks update `subscription` table; gate features by tier                          |
| Observability     | **Sentry** (errors) + **PostHog** (analytics) + **Langfuse** (LLM traces — Python-native)                                    | Langfuse is built for our world                                                      |
| Hosting           | **Frontend on Vercel** (free for prototype), **API on Fly.io / Railway / Render** ($5–25/mo), **DB on Neon** (free → $19/mo) | All have generous free tiers                                                         |
| Containerization  | Docker for the FastAPI app                                                                                                   | We already use it                                                                    |


**The deployment topology:**

```
user → Vercel (Next.js) → FastAPI on Fly.io → Neon Postgres (with pgvector)
                              ↓
                          Anthropic API
                              ↓
                          Redis (job queue, if needed)
```

Everything below the Next.js layer is Python. That's the lever — we can move fast on what matters.

### 3.5.1 Repo structure (monorepo, recommended)

```
ai-mind/
├── apps/
│   ├── web/                    # Next.js — TypeScript
│   │   ├── app/
│   │   ├── components/         # ported from prototype
│   │   └── lib/
│   └── api/                    # FastAPI — Python (where we live)
│       ├── app/
│       │   ├── routers/
│       │   ├── services/       # LLM, RAG, billing
│       │   ├── models/         # SQLAlchemy
│       │   ├── schemas/        # Pydantic
│       │   └── workers/        # background tasks
│       ├── alembic/
│       └── pyproject.toml
├── packages/
│   └── shared-types/           # types shared via openapi-typescript
├── infra/
│   └── docker-compose.yml
└── docs/
    └── PLAN.md  ← this file
```

Types flow one way: FastAPI emits an OpenAPI schema → `openapi-typescript` generates TS types for the Next.js app. We never hand-write API contracts in two places.

### 3.6 Data sources to ingest (for RAG)

Curate, don't crawl:

- **arXiv abstracts** for ML — already free and structured
- **Papers With Code** for the canonical paper-per-concept mapping
- **Wikipedia** — for biographies of researchers
- **A small set of textbooks**: Goodfellow *Deep Learning*, Russell & Norvig, Schmidhuber's *Annotated History of Modern AI* (free PDF)
- **Distill.pub archive** — explainer-quality writing the model can mimic in style
- **AI Index Report** (Stanford HAI) — for post-2020 stats

Build a curation pipeline: source → chunk → embed → store with metadata `{title, year, authors, doi}`.

---

## 4. Phases

### Phase 0 — Sharpen (1 week, no code)

Outputs:

- A written one-paragraph product brief
- 5 named first-users (real people we'd email an invite to)
- A list of 20 questions a first-user would *actually* ask
- A 5-frame storyboard of the ideal first session

### Phase 1 — MVP (3 weeks)

**Goal:** the prototype, but real — server-backed, multi-device, auth, **and paywall-ready scaffolding even if free.**

Build:

- Next.js app skeleton + FastAPI + Neon Postgres + Anthropic SDK
- Port data model from `data.js` to SQLAlchemy schema
- Server-side LLM call (Anthropic, tool use, streaming via SSE)
- Canvas component (port the prototype's SVG)
- Chat sidebar
- Annotation rendering
- Selection + focus + inspector card
- Notebook persistence across reload
- **Clerk/Auth.js integration**
- **Stripe account + product + price IDs created** (billing not yet enforced)
- `**subscription` table + middleware that *reads* tier (defaults to free); enforcement comes in Phase 2**
- One-page marketing site with clear pricing teaser ("Free in beta — $X/mo after launch")

Out of scope:

- RAG (rely on model knowledge)
- Spaced review
- Sharing
- Mobile
- Actually charging anyone

Ship to: 20 hand-picked beta users, free.

**Success metric:** 5 of 20 return for a second session within a week.

### Phase 2 — Trust + turn on billing (4 weeks)

**Goal:** the graph is accurate enough that users *believe* their own notes — and we start charging.

Build:

- RAG over arXiv + Wikipedia + curated textbook chunks (pgvector, LlamaIndex)
- Tool: `lookup_paper(query)` — model can search before answering
- Provenance: every node/edge/annotation shows the chat exchange that produced it
- "Source" badges on nodes that have a verified arXiv link
- A "report a mistake" button → builds a feedback dataset
- **Stripe Checkout flow + webhook handler in FastAPI**
- **Subscription tiers enforced** (free / scholar / institutional — see §11)
- **Usage metering** (tutor turns per month, embedding-cost tracking per user)
- **Customer portal** for cancel/upgrade/invoices (Stripe-hosted, zero code)
- **Email receipts + dunning** (Stripe handles)

**Success metric:** users self-report < 1 factual error per 20 turns; ≥ 10% of trial users convert to paid.

### Phase 3 — Memory (4 weeks)

**Goal:** make the notebook *more* valuable the longer you use it.

Build:

- Spaced review — daily "Three weeks ago you noted X" prompt
- Search across all your nodes/annotations (semantic + keyword)
- Time-lapse playback — replay your notebook's growth as a 30-second animation
- "What I learned this month" auto-summary email
- Filters: by category, by era, by recency

**Success metric:** day-30 retention > 30%.

### Phase 4 — Reach (open-ended)

Possible directions, pick one based on Phase 3 data:

- Public shareable graphs (viral surface)
- Other domains (math history, philosophy, codebase exploration)
- Classroom mode — teacher publishes a "skeleton" graph, students grow theirs from it
- API — let other apps push nodes into your notebook
- Self-hosted version for institutions

---

## 4.5 Future Expansion — Flexible Categories (proposal, not yet scheduled)

> **Status:** Proposal only. V1 lanes remain locked to AI history (`foundations`, `vision`, `language`, `rl`, `architecture`) per §1.2 and §2. This section captures the idea so it isn't lost; promoting it to a Phase requires unlocking §1.2.

### The idea

Replace the hardcoded category lanes with **dynamic, AI-generated categories per user and per topic**. The AI infers categories from what the user is actually studying, instead of forcing every notebook into the AI-history ontology.

This turns AI Mind from a "specialised AI notebook" into a topic-agnostic thinking tool while keeping the same graph, marginalia, and conversation loop.

### Why add it

- Lanes are currently locked to AI history → the product can only serve AI-history learners.
- Users studying anything else (philosophy, biology, physics, a codebase) see irrelevant labels and an ontology that doesn't match their mental model.
- The canvas reads as a *demo of one topic* rather than a *personal tool*.

### Problems if we don't add it

| Problem | Consequence |
| --- | --- |
| Locked into AI history | Small addressable market; no path to broader subjects |
| User must accept our ontology | Onboarding friction for non-AI users |
| Canvas feels like a demo | Harder to justify $12/mo for a single topic |
| Hard to repurpose | A future pivot or new domain requires rewriting core graph + prompt logic |

### Who benefits

| User type | Benefit |
| --- | --- |
| Self-taught AI reader | No change — categories still match their topic |
| Philosophy / biology / physics student | Notebook finally fits their domain |
| Multi-subject power user | One tool covers everything they read |
| Product team | Pricing and positioning expand beyond "AI history" |
| Future buyers | Larger TAM, lower domain-lock risk |

### Future expansion paths this unlocks

1. **User-editable categories** — rename, reorder, move lanes manually.
2. **Merge / split** — AI suggests merging similar categories or splitting an overloaded one.
3. **Visual customisation** — per-lane colors / icons chosen by the user.
4. **Category-based search** — "show me everything in Epistemology".
5. **Multi-notebook** — one notebook per subject, each with its own category set (requires unlocking §1.2 "one notebook per user").
6. **Per-category export** — "export all my Metaphysics nodes as a timeline".
7. **Category-aware AI** — the AI proposes a category for each new concept based on the user's prior choices.

### What it would cost to ship

- Schema: replace the static `category` enum with a per-notebook category table (id, name, color, order).
- Prompt: the LLM contract (§3.3) gains a `category` field and a "propose new category" path.
- UI: lanes become data-driven; settings UI for renaming/reordering.
- Migration: existing AI-history notebooks seed the same 5 lanes so nothing breaks.

### Decision needed before scheduling

Pick one:

- **(a) Defer to Phase 3+** — keep v1 locked; revisit after beta validates the core loop. *(Recommended.)*
- **(b) Promote to Phase 2** — ship alongside billing once trust signals exist.
- **(c) Rewrite the v1 lock** — make categories dynamic from day one. Bigger MVP scope, higher risk against the 3-week Phase 1 budget.

---

## 5. Quality bar (taken from the prototype)

The product should feel like:

- **Excalidraw** — hand-drawn warmth
- **Are.na** — editorial restraint
- A **Penguin Classics** cover — type-first, no decoration
- Robin Sloan's *Mr. Penumbra* — old/new fusion

The product should **not** feel like:

- ChatGPT (chrome-heavy chat UI)
- Notion (block-based, drag-handle bloat)
- Generic "AI app" (purple gradients, neon, glassmorphism, emoji)

---

## 6. Risks & how we plan around them


| Risk                                    | Mitigation                                                                                     |
| --------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Users churn after the novelty wears off | Phase 3 is entirely about this — the notebook must give back more than it asks                 |
| LLM cost spirals                        | Cache tutor responses by prompt hash; downgrade to smaller models for non-graph-mutating turns |
| Hallucinations destroy trust            | Phase 2's RAG + provenance; "show source" on every claim                                       |
| The graph gets too dense to read        | Filters, time-lapse, focus mode; eventually clustering                                         |
| Copyright on ingested textbooks         | Use only open-licensed material; for closed sources, link out instead of ingesting             |
| Aesthetic drift as we add features      | A `DESIGN.md` with the locked palette/type/voice; every PR must point to it                    |


---

## 11. Business model & subscription strategy

This is a paid product. The free tier exists to demonstrate value; the moat (your accumulating personal graph) is the conversion lever.

### 11.1 Pricing tiers


| Tier                       | Price                              | Audience                           | Limits                                                                                        | Features                              |
| -------------------------- | ---------------------------------- | ---------------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------- |
| **Free**                   | $0                                 | Curious visitors                   | 1 notebook · 30 tutor turns/mo · 50 nodes max · no RAG · no export                            | Full canvas, basic tutor, persistence |
| **Scholar**                | **$12/mo** or **$96/yr** (33% off) | Individual learners (primary tier) | 5 notebooks · 500 tutor turns/mo · unlimited nodes · RAG enabled · PDF export · spaced review | Everything the product is meant to be |
| **Patron**                 | $24/mo                             | Power users, researchers           | Unlimited everything · priority model (Sonnet) · early features · public shareable graphs     | Supporters tier                       |
| **Institutional / Edu**    | $6/seat/mo (min 20 seats, annual)  | Universities, research labs        | Per-seat scholar features + admin dashboard + SSO + classroom mode                            | Long sales cycle, big LTV             |
| **Self-hosted Enterprise** | $custom (talk to us)               | Companies wanting on-prem          | Docker image + license key + private support                                                  | Phase 4+ only                         |


**Why $12/mo:** below the "casual subscription pain threshold" (~~$15), above the "clearly disposable" line (~~$5). Comparable to Readwise ($8), Notion ($10), Are.na ($7). We're priced as a serious learning tool, not entertainment.

### 11.2 What gates the paywall

The paywall must hit *after* the user feels the magic, not before. Hard limits, in priority order:

1. **30 tutor turns/month** — the most important gate. Free users hit it in ~3 sessions if engaged.
2. **50 nodes per notebook** — feels generous, but a real user blows through it in a week.
3. **No RAG / no source badges** — free tier uses model-only answers. Subtly less accurate, which is honest.
4. **No PDF/Markdown export** — keeps the graph trapped in our app (mild lock-in, soft gate).
5. **No spaced review** — the day-30 retention feature is paid-only.

What is **never** behind a paywall: the user's existing data. If they cancel, they keep read-only access forever. Burning users on cancel is short-term thinking.

### 11.3 Unit economics — does this actually work?

Rough monthly cost per Scholar tier user ($12/mo):


| Cost item                                                  | Estimate         | Notes               |
| ---------------------------------------------------------- | ---------------- | ------------------- |
| LLM (Claude Sonnet, 500 turns @ ~2k tokens out × $15/MTok) | ~$3.50           | Biggest variable    |
| Embeddings                                                 | < $0.10          | Negligible          |
| Postgres + vector storage                                  | ~$0.20           | Shared infra        |
| Hosting (Vercel + Fly.io amortized)                        | ~$0.30           | At 1000 users       |
| Stripe fees (2.9% + $0.30)                                 | ~$0.65           |                     |
| **Total cost**                                             | **~$4.75**       |                     |
| **Gross margin**                                           | **~$7.25 (60%)** | Healthy SaaS margin |


Levers if margins compress:

- Cache common tutor responses by prompt hash (saves ~30% LLM cost)
- Route non-graph-mutating turns to Haiku (~10× cheaper)
- Annual prepay pulls cash forward and reduces churn

### 11.4 Conversion strategy

- **Onboarding paywall trigger:** after the user's 8th tutor turn (most users cross this in their 2nd session)
- **In-context upgrade prompts:** when they hit the 50-node limit, show *"your notebook is alive — let it grow"* rather than *"upgrade now"*
- **Annual discount:** 33% off (2 months free) — pulls cash forward, drops churn
- **Education discount:** 50% off Scholar with a .edu email
- **Founding-member offer (Phase 2 launch):** first 200 users get Scholar at $7/mo for life — converts beta users into evangelists

### 11.5 Reducing churn

Most SaaS churns 5–8% monthly. We want ≤ 3%, because the graph itself fights for us:

- **Lock-in via accumulation** — a 6-month-old graph is irreplaceable. *Build this feeling.*
- **Weekly digest email** — *"You added 12 nodes this week."* Re-engagement at minimum cost.
- **Spaced review** — turns the product from a tool into a habit.
- **Cancellation flow** — *"Pause for 30 days instead of canceling?"* with a one-click pause that keeps data intact.
- **Exit survey** — required field on cancel; feeds Phase 3 priorities.

### 11.6 Billing implementation (Python-friendly)

We use Stripe — the boring, correct choice. The whole flow stays in our wheelhouse:

1. **Frontend** sends user to Stripe Checkout (hosted page; zero code from us beyond a redirect).
2. **Stripe webhook** hits our FastAPI endpoint `/webhooks/stripe` with events like `checkout.session.completed`, `customer.subscription.updated`, `invoice.payment_failed`.
3. **FastAPI handler** verifies signature, updates `subscription` table (`user_id`, `tier`, `status`, `current_period_end`).
4. **Middleware** on every API route reads `subscription.tier` and gates features.
5. **Customer Portal** (Stripe-hosted) handles cancel, upgrade, invoice download, payment-method update. We never build that UI.

Files we own:

- `apps/api/app/routers/billing.py` — webhook + checkout-session endpoints (~150 lines)
- `apps/api/app/services/entitlements.py` — "can this user do X?" logic (~100 lines)
- `apps/api/app/models/subscription.py` — SQLAlchemy model
- 2 frontend pages: `/billing` (redirect to portal) and `/upgrade` (redirect to checkout)

Total billing surface: maybe 600 lines of code, mostly Python (where we're strong).

### 11.7 Revenue targets (for sanity, not as promises)


| Phase                   | Users | Paid %      | MRR     | Cumulative ARR |
| ----------------------- | ----- | ----------- | ------- | -------------- |
| End of Phase 2          | 500   | 8% (40)     | $480    | $5.7k          |
| End of Phase 3          | 2,000 | 12% (240)   | $2,880  | $34k           |
| End of Phase 4 (year 1) | 8,000 | 15% (1,200) | $14,400 | $173k          |


For a 2-engineer team with low overhead, $170k ARR within 12 months is meaningful — covers infra + one part-time contractor + leaves a runway buffer. It's not VC-scale yet; that's fine. We design for sustainability first; venture later if it accelerates rather than distracts.

### 11.8 What we are explicitly NOT doing in pricing

- **No ads.** Ever. The aesthetic and trust positioning forbid them.
- **No data resale.** User notebooks are private. This is also a marketing line worth saying out loud.
- **No pay-per-token visible to user.** Hide the meter; expose generous monthly limits.
- **No enterprise sales push in year 1.** Distracts from product-market fit work.
- **No lifetime deals (AppSumo et al.).** Cheapens the brand; attracts the wrong cohort.

---

## 12. Concrete next-seven-days checklist (revised for our team)

- Day 1 — Write the one-paragraph brief; show it to 3 friends; rewrite
- Day 2 — Set up the monorepo: `apps/web` (Next.js, scaffolded with Cursor) + `apps/api` (FastAPI); deploy a "hello" route end-to-end
- Day 3 — Neon Postgres + SQLAlchemy + Alembic; port the data model; seed with the 10 prototype nodes
- Day 4 — FastAPI endpoint that calls Anthropic with tool use; log every call to Langfuse
- Day 5 — Port the SVG canvas component into Next.js; wire it to the API via SSE for streaming
- Day 6 — Clerk auth wired both ends; Stripe products created (no enforcement yet)
- Day 7 — Invite 5 beta users; sit with each for 30 minutes; watch them use it

---

## 8. What we are explicitly NOT building (yet)

- Real-time multi-user collaboration
- Mobile-native apps
- A marketplace of shared notebooks
- Theme customization
- Voice input
- Image upload into the chat
- A "free-canvas" mode where users draw arbitrary shapes

Each of these is interesting; each would dilute the wedge. Earn the right to add them by getting Phase 3 retention right first.

---

## 9. Open questions for the team

1. Do we want one canonical "global graph" all users implicitly contribute to, or are graphs strictly personal?
2. Should the AI ever proactively *suggest* nodes the user hasn't asked about?
3. What's the right pricing model — free with limits, flat $X/month, or pay-per-tutor-call?
4. Do we ship a Chrome extension that lets users drop arXiv pages directly into their notebook?
5. How do we evaluate "tutor quality" beyond gut feel? (LMSYS-style pairwise comparisons? Expert review?)

---

## 10. Appendix — Files in the prototype, as a starting point


| File                                          | Role                                         | Carries over to V1?                       |
| --------------------------------------------- | -------------------------------------------- | ----------------------------------------- |
| `data.js`                                     | Schema, seed data, layout math               | ✅ — schema is the DB schema               |
| `shared.js`                                   | Cross-window state + LLM call                | 🔁 — move to server                       |
| `canvas.jsx`                                  | SVG renderer (nodes, edges, marginalia)      | ✅ — direct port                           |
| `app.jsx`                                     | Graph page shell                             | ✅ — direct port                           |
| `chat-app.jsx`                                | Chat window                                  | ✅ — merge into one app, drop window-popup |
| `styles.css`                                  | Design tokens, typography, scholar aesthetic | ✅ — keep verbatim                         |
| `index.html`, `chat.html`, `index-print.html` | Entry points                                 | ❌ — replaced by Next.js routes            |


The prototype isn't throwaway code — it's a working spec. The schemas, the system prompt, the layout math, and the aesthetic all transfer cleanly. The work of "becoming a real product" is mostly plumbing (auth, DB, servers, observability), not redesign.