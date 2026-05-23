// Shared state + AI tutor + cross-window sync
(function () {
  const {
    STORAGE_KEY, CHANNEL_NAME,
    SEED_NODES, SEED_EDGES, WELCOME_MESSAGES,
    CATEGORY_STYLES, REL_LABELS,
    positionNode,
  } = window.AIMindData;

  function buildInitialState() {
    const placed = [];
    for (const n of SEED_NODES) placed.push(positionNode(n, placed));
    return {
      nodes: placed,
      edges: SEED_EDGES.slice(),
      messages: WELCOME_MESSAGES.slice(),
      focusId: null,
      newIds: [],
    };
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return buildInitialState();
      const parsed = JSON.parse(raw);
      if (!parsed.nodes || !parsed.messages) return buildInitialState();
      // ensure annotations array exists
      // strip legacy arabic fields & ensure annotations array
      parsed.nodes = parsed.nodes.map((n) => {
        const { label_ar, ...rest } = n;
        return { ...rest, annotations: n.annotations || [] };
      });
      parsed.newIds = [];
      return parsed;
    } catch (e) {
      return buildInitialState();
    }
  }

  function saveState(state) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) {}
  }

  function resetState() {
    const s = buildInitialState();
    saveState(s);
    broadcast({ type: "state", state: s });
    return s;
  }

  const channel = ("BroadcastChannel" in window) ? new BroadcastChannel(CHANNEL_NAME) : null;
  function broadcast(msg) {
    if (channel) channel.postMessage(msg);
  }
  function subscribe(handler) {
    if (channel) channel.onmessage = (ev) => handler(ev.data);
    window.addEventListener("storage", (ev) => {
      if (ev.key === STORAGE_KEY && ev.newValue) {
        try {
          handler({ type: "state", state: JSON.parse(ev.newValue) });
        } catch (e) {}
      }
    });
  }

  function parseTutorResponse(raw) {
    if (!raw) throw new Error("empty");
    let txt = String(raw).trim();
    txt = txt.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "");
    try { return JSON.parse(txt); } catch (e) {}
    const m = txt.match(/\{[\s\S]*\}/);
    if (m) {
      try { return JSON.parse(m[0]); } catch (e2) {}
    }
    throw new Error("parse failed");
  }

  async function callTutor(state, userText) {
    const nodeSummary = state.nodes
      .map((n) => `${n.id}=${n.label}(${n.year})`)
      .join("; ");
    const validCategories = Object.keys(CATEGORY_STYLES).join("|");
    const validRelTypes = Object.keys(REL_LABELS).join("|");

    const sys = `You are a scholarly tutor on the history of artificial intelligence, writing inside a personal knowledge-graph notebook. Respond ONLY with a valid JSON object (no markdown fences, no preamble), no other text. Shape:
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
- Edges should genuinely follow from the discussion — don't invent spurious relationships.`;

    const history = state.messages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .slice(-10)
      .map((m) => ({ role: m.role, content: m.content }));
    history.push({ role: "user", content: userText });

    const raw = await window.claude.complete({ system: sys, messages: history });
    return parseTutorResponse(raw);
  }

  function applyTutorResult(state, data) {
    const reply = (data && data.reply) ? String(data.reply) : "—";
    const incomingNodes = Array.isArray(data?.new_nodes) ? data.new_nodes : [];
    const incomingEdges = Array.isArray(data?.new_edges) ? data.new_edges : [];
    const incomingAnnots = Array.isArray(data?.annotations) ? data.annotations : [];
    const focusId = (data && data.focus) ? String(data.focus) : null;

    const next = {
      ...state,
      nodes: state.nodes.slice(),
      edges: state.edges.slice(),
      messages: state.messages.slice(),
      newIds: [],
    };

    const existingIds = new Set(next.nodes.map((n) => n.id));
    const accepted = [];
    for (const cand of incomingNodes) {
      if (!cand || !cand.id || existingIds.has(cand.id)) continue;
      const node = { ...cand, annotations: [] };
      if (!CATEGORY_STYLES[node.category]) node.category = "other";
      if (typeof node.year !== "number") node.year = 2020;
      // Normalize kind / parent linkage
      if (node.kind !== "concept" && node.kind !== "paper") node.kind = "paper";
      if (node.kind === "concept") {
        // require an existing or about-to-exist paper parent
        if (!node.parent_id || (!existingIds.has(node.parent_id) && !incomingNodes.some((x) => x?.id === node.parent_id && x.kind !== "concept"))) {
          // demote to paper if parent missing
          node.kind = "paper";
          node.parent_id = null;
        }
      } else {
        node.parent_id = null;
      }
      const positioned = positionNode(node, next.nodes);
      next.nodes.push(positioned);
      accepted.push(positioned.id);
      existingIds.add(node.id);
    }

    // annotations — append to nodes by id
    if (incomingAnnots.length) {
      const annotsById = {};
      for (const a of incomingAnnots) {
        if (!a || !a.node_id || !a.text) continue;
        (annotsById[a.node_id] ||= []).push(String(a.text).trim());
      }
      next.nodes = next.nodes.map((n) => {
        const add = annotsById[n.id];
        if (!add || add.length === 0) return n;
        const existing = (n.annotations || []).map((x) => x.text.toLowerCase());
        const fresh = add
          .filter((t) => !existing.includes(t.toLowerCase()))
          .map((t) => ({ text: t, ts: Date.now() }));
        if (fresh.length === 0) return n;
        return { ...n, annotations: [...(n.annotations || []), ...fresh].slice(-8) };
      });
    }

    // edges
    const known = new Set(next.edges.map((e) => `${e.from}->${e.to}->${e.type}`));
    const allNodeIds = new Set(next.nodes.map((n) => n.id));
    for (const e of incomingEdges) {
      if (!e || !e.from || !e.to) continue;
      if (!REL_LABELS[e.type]) e.type = "extends";
      const key = `${e.from}->${e.to}->${e.type}`;
      if (known.has(key)) continue;
      if (!allNodeIds.has(e.from) || !allNodeIds.has(e.to)) continue;
      known.add(key);
      next.edges.push({ from: e.from, to: e.to, type: e.type });
    }

    next.messages.push({
      role: "assistant",
      content: reply,
      addedNodes: accepted.length,
      addedAnnots: incomingAnnots.length,
    });
    next.newIds = accepted;
    if (focusId && allNodeIds.has(focusId)) next.focusId = focusId;
    else if (accepted.length) next.focusId = accepted[0];

    return next;
  }

  async function sendUserMessage(text) {
    const state = loadState();
    state.messages.push({ role: "user", content: text });
    state.pending = true;
    saveState(state);
    broadcast({ type: "state", state });

    try {
      const data = await callTutor(state, text);
      const next = applyTutorResult(state, data);
      next.pending = false;
      saveState(next);
      broadcast({ type: "state", state: next });
    } catch (err) {
      console.error(err);
      const s = loadState();
      s.messages.push({ role: "assistant", content: "⚠️ Couldn't process the reply. Please try again." });
      s.pending = false;
      saveState(s);
      broadcast({ type: "state", state: s });
    }
  }

  function setFocus(id) {
    const s = loadState();
    s.focusId = id;
    saveState(s);
    broadcast({ type: "state", state: s });
  }

  window.AIMindStore = {
    loadState, saveState, resetState,
    broadcast, subscribe,
    sendUserMessage, setFocus,
  };
})();
