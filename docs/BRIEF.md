# AI Mind — product brief

> Short document for teammates, designers, and early beta invites.  
> Full plan: [`plan.md`](../plan.md) · Execution: [`PROJECT_SETUP.md`](PROJECT_SETUP.md)

---

## Problem

Readers of AI history — papers, essays, timelines — accumulate facts in scattered places: PDFs, browser tabs, generic notes, one-off ChatGPT threads. Nothing captures **how they personally connect ideas over time**, or what they emphasized in each paper. After months of reading, they cannot reconstruct *their* intellectual map.

## Solution

A **scholar’s notebook** in the browser:

1. Chat with an AI tutor about AI history and papers.  
2. Each discussion updates a **personal timeline graph** — papers as nodes, concepts as satellites, typed edges (`extends`, `inspired_by`, …), short **marginalia** for what you cared about.  
3. The graph **persists and grows** across episodic reading sessions over months.

## MVP benefits

- **Your map, not the textbook’s** — structure reflects what you explored, not a fixed syllabus.  
- **Less note-taking labor** — the tutor proposes nodes and links from conversation.  
- **Readable memory** — timeline + focus mode + marginalia beat a folder of markdown files.  
- **Built for return visits** — designed so a second session within a week feels worthwhile.  
- **Distinct aesthetic** — calm, parchment, hand-drawn warmth (not generic “AI app” chrome).

## User types

| User | Role in v1 |
|------|------------|
| **Self-taught practitioner** reading AI history papers | Primary |
| **History-of-science / AI history enthusiast** | Secondary |
| Grad survey writer | Out of scope for v1 |
| Casual “ask ChatGPT once” user | Not target |

## One job (north star)

> Help me remember everything I've ever learned about AI history, structured the way I think about it.

## Core interaction

Chat sets **focus** on a paper or topic → **paper nodes** on the timeline → **concepts** and **marginalia** accrete around what the user emphasized.

## Sharing

Private by default. **Selective** sharing of subgraphs or links when the user chooses (post-MVP).

## Team

**2 AI engineers** — Python / FastAPI strong; frontend via Next.js + AI pair programming. No PM, no dedicated designer. Part-time on this project alongside other work.

| Name | Role |
|------|------|
| _Fill in_ | Backend + tutor (FastAPI, LLM tools) |
| _Fill in_ | Full-stack + canvas port (Next.js) |

Execution plan: [`PROJECT_SETUP.md`](PROJECT_SETUP.md) § Team reality · §7 (part-time sprints).

## Timeline

| Milestone | Date |
|-----------|------|
| Phase 0 — sharpen (name, Figma, storyboard) | |
| MVP beta (20 users) | |
| Billing live | |

## Visual identity (الهوية البصرية)

- **Mood:** Scholar’s notebook / 19th-century naturalist field journal  
- **Type:** Fraunces (headings), clean sans (UI)  
- **Colors:** Parchment background, ink browns — see `prototype/styles.css` and Figma tokens (TBD)  
- **Avoid:** Dark mode, theme switcher, purple gradients, glassmorphism, emoji chrome  

## Business (reminder)

Paid subscription product; free tier for discovery. Details: `plan.md` §11.
