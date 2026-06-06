import type { AppState, ChatMessage } from './types'
import { STORAGE_KEY, CATEGORY_STYLES_LIGHT, REL_LABELS, positionNode } from './data'

interface TutorResponse {
  reply?: string
  focus?: string | null
  new_nodes?: Array<{
    id: string
    kind: string
    parent_id?: string
    label: string
    year: number
    category: string
    summary: string
  }>
  new_edges?: Array<{
    from: string
    to: string
    type: string
  }>
  annotations?: Array<{
    node_id: string
    text: string
  }>
}

export function createInitialState(): AppState {
  return {
    nodes: [],
    edges: [],
    messages: [],
    focusId: null,
    newIds: [],
  }
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return createInitialState()
    const parsed = JSON.parse(raw)
    if (!parsed.nodes || !parsed.messages) return createInitialState()
    parsed.nodes = parsed.nodes.map((n: any) => ({
      ...n,
      annotations: n.annotations || [],
    }))
    parsed.newIds = []
    return parsed as AppState
  } catch {
    return createInitialState()
  }
}

export function saveState(state: AppState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {}
}

export function resetState(): AppState {
  const s = createInitialState()
  saveState(s)
  return s
}

function parseTutorResponse(raw: unknown): TutorResponse {
  if (!raw) throw new Error('empty')
  let txt = String(raw).trim()
  txt = txt.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '')
  try { return JSON.parse(txt) } catch {}
  const m = txt.match(/\{[\s\S]*\}/)
  if (m) {
    try { return JSON.parse(m[0]) } catch {}
  }
  throw new Error('parse failed')
}

function buildTutorSystemPrompt(state: AppState): string {
  const nodeSummary = state.nodes
    .map((n) => `${n.id}=${n.label}(${n.year})`)
    .join('; ')
  const validCategories = Object.keys(CATEGORY_STYLES_LIGHT).join('|')
  const validRelTypes = Object.keys(REL_LABELS).join('|')

  return `You are a scholarly tutor on the history of artificial intelligence, writing inside a personal knowledge-graph notebook. Respond ONLY with a valid JSON object (no markdown fences, no preamble), no other text. Shape:
{
  "reply": "Answer in English, 2-4 short sentences, scholarly but warm tone.",
  "focus": "id_of_node_the_conversation_is_about_or_null",
  "new_nodes": [ { "id": "snake_case", "kind": "paper|concept", "parent_id": "id_of_paper_if_kind_is_concept_else_null", "label": "Short name", "year": INT, "category": "${validCategories}", "summary": "One sentence in English." } ],
  "new_edges": [ { "from": "id", "to": "id", "type": "${validRelTypes}" } ],
  "annotations": [ { "node_id": "existing_or_new_id", "text": "3-7 word marginal note pulled from the conversation" } ]
}

Node KIND rules — important:
- kind="paper" for a landmark paper, model, breakthrough, or person (AlexNet, GAN, AlphaGo, Hinton). These render as full-size boxes on the timeline.
- kind="concept" for a sub-idea that belongs INSIDE a paper (self-attention is a concept of Transformer, ReLU is a concept of AlexNet, dropout is a concept of AlexNet, convolution is a concept of CNN). Concepts MUST have parent_id pointing to the paper they belong to. They render as small chips that appear when the parent is selected.
- If the user asks about a sub-mechanism ("what is multi-head attention?"), add it as kind="concept" with parent_id of the relevant paper, not as a top-level paper.
- prefix concept IDs with "c_" for clarity (c_dropout, c_relu, c_self_attn).
- If unsure, default to kind="paper".

Existing node IDs (reuse these; never recreate): ${nodeSummary}.

Rules:
- "focus": pick the single node the user is asking about right now (existing ID, or an ID you are creating in new_nodes).
- "annotations" are SHORT marginal notes (3-7 words each) capturing the specific details the user is discussing — layer counts, training data, key authors, mechanisms, comparisons. Use them to record what the USER is interested in about that node. 1-4 annotations per turn.
- Annotations may attach to existing nodes OR to new_nodes you are creating in the same turn.
- If the user asks about a concept already present, return new_nodes=[] but still add annotations capturing the discussion.
- Historically accurate years. snake_case IDs only. No duplicates.
- Edges should genuinely follow from the discussion — don't invent spurious relationships.`
}

async function callTutor(state: AppState, userText: string): Promise<TutorResponse> {
  const history = state.messages
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .slice(-10)
    .map((m) => ({ role: m.role, content: m.content }))
  history.push({ role: 'user', content: userText })

  const sys = buildTutorSystemPrompt(state)

  const res = await fetch('http://127.0.0.1:8000/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ system: sys, messages: history }),
  })
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  const data = await res.json()
  return parseTutorResponse(data.content)
}

export function applyTutorResult(state: AppState, data: TutorResponse): AppState {
  const reply = (data && data.reply) ? String(data.reply) : '—'
  const incomingNodes = Array.isArray(data?.new_nodes) ? data.new_nodes : []
  const incomingEdges = Array.isArray(data?.new_edges) ? data.new_edges : []
  const incomingAnnots = Array.isArray(data?.annotations) ? data.annotations : []
  const focusId = (data && data.focus) ? String(data.focus) : null

  const next: AppState = {
    ...state,
    nodes: state.nodes.slice(),
    edges: state.edges.slice(),
    messages: state.messages.slice(),
    newIds: [],
  }

  const existingIds = new Set(next.nodes.map((n) => n.id))
  const accepted: string[] = []

  for (const cand of incomingNodes) {
    if (!cand || !cand.id || existingIds.has(cand.id)) continue
    const node: any = { ...cand, annotations: [] }
    if (typeof node.category !== 'string' || !CATEGORY_STYLES_LIGHT[node.category as keyof typeof CATEGORY_STYLES_LIGHT]) node.category = 'other'
    if (typeof node.year !== 'number') node.year = 2020
    if (node.kind !== 'concept' && node.kind !== 'paper') node.kind = 'paper'
    if (node.kind === 'concept') {
      if (!node.parent_id || (!existingIds.has(node.parent_id) && !incomingNodes.some((x: any) => x?.id === node.parent_id && x.kind !== 'concept'))) {
        node.kind = 'paper'
        node.parent_id = null
      }
    } else {
      node.parent_id = null
    }
    const positioned = positionNode(node, next.nodes)
    next.nodes.push(positioned)
    accepted.push(positioned.id)
    existingIds.add(node.id)
  }

  if (incomingAnnots.length) {
    const annotsById: Record<string, string[]> = {}
    for (const a of incomingAnnots) {
      if (!a || !a.node_id || !a.text) continue
      ;(annotsById[a.node_id] ||= []).push(String(a.text).trim())
    }
    next.nodes = next.nodes.map((n) => {
      const add = annotsById[n.id]
      if (!add || add.length === 0) return n
      const existing = (n.annotations || []).map((x) => x.text.toLowerCase())
      const fresh = add
        .filter((t) => !existing.includes(t.toLowerCase()))
        .map((t) => ({ text: t, ts: Date.now() }))
      if (fresh.length === 0) return n
      return { ...n, annotations: [...(n.annotations || []), ...fresh].slice(-8) }
    })
  }

  const known = new Set(next.edges.map((e) => `${e.from}->${e.to}->${e.type}`))
  const allNodeIds = new Set(next.nodes.map((n) => n.id))
  for (const e of incomingEdges) {
    if (!e || !e.from || !e.to) continue
    if (!REL_LABELS[e.type as keyof typeof REL_LABELS]) e.type = 'extends'
    const key = `${e.from}->${e.to}->${e.type}`
    if (known.has(key)) continue
    if (!allNodeIds.has(e.from) || !allNodeIds.has(e.to)) continue
    known.add(key)
    next.edges.push({ from: e.from, to: e.to, type: e.type } as any)
  }

  next.messages.push({
    role: 'assistant',
    content: reply,
    addedNodes: accepted.length,
    addedAnnots: incomingAnnots.length,
  })
  next.newIds = accepted
  if (focusId && allNodeIds.has(focusId)) next.focusId = focusId
  else if (accepted.length) next.focusId = accepted[0]

  return next
}

export async function sendUserMessage(text: string): Promise<AppState> {
  const state = loadState()
  state.messages.push({ role: 'user', content: text })
  state.pending = true
  saveState(state)

  try {
    const data = await callTutor(state, text)
    const next = applyTutorResult(state, data)
    next.pending = false
    saveState(next)
    return next
  } catch (err) {
    console.error(err)
    const s = loadState()
    s.messages.push({ role: 'assistant', content: '⚠️ Couldn\'t process the reply. Please try again.' })
    s.pending = false
    saveState(s)
    return s
  }
}

export function setFocus(id: string | null) {
  const s = loadState()
  s.focusId = id
  saveState(s)
}
