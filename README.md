# AI Mind (papers_agent)

A personal, persistent mind map of your journey through AI history — chat with a tutor, and every concept becomes a node on a hand-drawn timeline.

## Project layout

| Path | Purpose |
|------|---------|
| [`plan.md`](plan.md) | Product & engineering plan (data model, phases, pricing) |
| [`docs/PROJECT_SETUP.md`](docs/PROJECT_SETUP.md) | **What to do now** — stack, repos, sprints, hosting, Postman |
| [`docs/BRIEF.md`](docs/BRIEF.md) | Problem, solution, MVP benefits, users (pitch-ready) |
| [`prototype/`](prototype/) | Browser prototype (React + Babel standalone, no build step) |

**Product (locked):** Self-taught AI-history readers; tutor + personal timeline graph; episodic sessions; selective sharing. Details in `plan.md` §1.1.

## Run the prototype

From the `prototype/` directory, serve files over HTTP (required for Babel script loading):

```bash
cd prototype && python3 -m http.server 8080
```

Then open:

- **Graph:** http://localhost:8080/index.html
- **Chat:** opens from the graph via “Open chat”, or http://localhost:8080/chat.html
- **Print:** http://localhost:8080/print.html

## Prototype files

```
prototype/
  index.html      # Main timeline canvas
  print.html      # Print-friendly graph (auto-opens print dialog)
  chat.html       # Tutor chat (separate window, syncs via localStorage)
  data.js         # Seed graph, layout, categories
  shared.js       # State, tutor API, cross-window sync
  styles.css      # Scholar’s notebook aesthetic
  canvas.jsx      # SVG timeline + inspector
  app.jsx         # Graph shell
  chat-app.jsx    # Chat UI
  archive/        # Older Arabic monolith (not wired to current app)
```
