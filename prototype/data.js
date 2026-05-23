// Constants & seed data for AI Mind — English-only, with annotations

const CANVAS_W = 1600;
const CANVAS_H = 720;
const NODE_W = 140;
const NODE_H = 58;
const YEAR_MIN = 1940;
const YEAR_MAX = 2026;

const STORAGE_KEY = "ai-mind-state-v7";
const CHANNEL_NAME = "ai-mind-channel";

const CATEGORY_STYLES_LIGHT = {
  foundations:  { fill: "#e8dcc4", stroke: "#7a5c2e", text: "#3a2a14", label: "Foundations" },
  vision:       { fill: "#d5e0ce", stroke: "#4a6b48", text: "#243a23", label: "Vision" },
  language:     { fill: "#e8cdbf", stroke: "#9c4a2e", text: "#4a1f10", label: "Language" },
  rl:           { fill: "#cdd5e0", stroke: "#4a5a78", text: "#1f2a40", label: "Reinforcement" },
  architecture: { fill: "#e8d8b8", stroke: "#8c6a2e", text: "#3a2a14", label: "Architecture" },
  other:        { fill: "#dcd4c4", stroke: "#5a5040", text: "#2a2418", label: "Other" },
};

const CATEGORY_STYLES_DARK = {
  foundations:  { fill: "#3a3220", stroke: "#c9a865", text: "#f0e3c2", label: "Foundations" },
  vision:       { fill: "#2a3528", stroke: "#8eb086", text: "#d8e8d2", label: "Vision" },
  language:     { fill: "#3a2820", stroke: "#d59072", text: "#f3d8c6", label: "Language" },
  rl:           { fill: "#252e3c", stroke: "#8aa0c4", text: "#d4ddec", label: "Reinforcement" },
  architecture: { fill: "#3a3022", stroke: "#d4a868", text: "#f0deb4", label: "Architecture" },
  other:        { fill: "#2c2820", stroke: "#9a8a6a", text: "#d8cdb0", label: "Other" },
};

// Initial export: light by default. canvas.jsx reads window.AIMindData.getCategoryStyles() per render.
const CATEGORY_STYLES = CATEGORY_STYLES_LIGHT;
function getCategoryStyles() {
  return document.body.classList.contains("dark") ? CATEGORY_STYLES_DARK : CATEGORY_STYLES_LIGHT;
}

const LANE_FRACS = {
  vision: 0.20,
  rl: 0.36,
  foundations: 0.52,
  architecture: 0.64,
  language: 0.80,
  other: 0.90,
};

const REL_LABELS = {
  extends:     { en: "extends",      dash: "" },
  enables:     { en: "enables",      dash: "" },
  precedes:    { en: "precedes",     dash: "" },
  applies:     { en: "applies to",   dash: "4 3" },
  uses:        { en: "uses",         dash: "4 3" },
  inspired_by: { en: "inspired by",  dash: "2 4" },
  critiques:   { en: "critiques",    dash: "6 3" },
};

// kind: 'paper' = main entity (full-size box) | 'concept' = sub-idea (small chip, hidden until parent active)
const SEED_NODES = [
  { id: "mp_neuron",   kind: "paper", label: "McCulloch–Pitts", year: 1943, category: "foundations", summary: "First mathematical model of a neuron as a logical gate — the seed of every neural network to come.", annotations: [] },
  { id: "perceptron",  kind: "paper", label: "Perceptron",      year: 1958, category: "foundations", summary: "Rosenblatt's first trainable neural network, learning from real data.", annotations: [] },
  { id: "backprop",    kind: "paper", label: "Backpropagation", year: 1986, category: "foundations", summary: "Rumelhart, Hinton, Williams — the algorithm that finally trained deep networks.", annotations: [] },
  { id: "cnn",         kind: "paper", label: "LeNet · CNN",     year: 1989, category: "vision",      summary: "LeCun — convolutional layers that read images by sliding learned filters.", annotations: [] },
  { id: "lstm",        kind: "paper", label: "LSTM",            year: 1997, category: "language",    summary: "Hochreiter & Schmidhuber — solved the vanishing-gradient problem in recurrent nets.", annotations: [] },
  { id: "word2vec",    kind: "paper", label: "word2vec",        year: 2013, category: "language",    summary: "Mikolov — turning words into semantic vectors you could do arithmetic on.", annotations: [] },
  { id: "seq2seq",     kind: "paper", label: "Seq2Seq",         year: 2014, category: "language",    summary: "Sutskever — an encoder/decoder pair for machine translation.", annotations: [] },
  { id: "attention",   kind: "paper", label: "Bahdanau Attention", year: 2014, category: "language", summary: "Bahdanau — letting the decoder look back at every part of the source.", annotations: [] },
  { id: "transformer", kind: "paper", label: "Transformer",     year: 2017, category: "architecture", summary: "Vaswani et al. — Attention Is All You Need. The substrate of every modern LLM.", annotations: [] },
  { id: "bert_gpt",    kind: "paper", label: "BERT · GPT",      year: 2018, category: "language",    summary: "Massive pre-training on raw text. The opening of the large-language-model era.", annotations: [] },

  // Concept children — only render when parent is active
  { id: "c_self_attn",    kind: "concept", parent_id: "transformer", label: "self-attention",       year: 2017, category: "architecture", summary: "Tokens attend to every other token in parallel.", annotations: [] },
  { id: "c_multihead",    kind: "concept", parent_id: "transformer", label: "multi-head",            year: 2017, category: "architecture", summary: "Parallel attention heads, each a learned subspace.", annotations: [] },
  { id: "c_pos_enc",      kind: "concept", parent_id: "transformer", label: "positional encoding",   year: 2017, category: "architecture", summary: "Sinusoidal positions injected since attention is order-blind.", annotations: [] },
  { id: "c_ffn",          kind: "concept", parent_id: "transformer", label: "feed-forward",          year: 2017, category: "architecture", summary: "Per-token MLP after each attention block.", annotations: [] },

  { id: "c_conv_layer",   kind: "concept", parent_id: "cnn",         label: "convolution",           year: 1989, category: "vision",      summary: "Sliding learned filter across the image.", annotations: [] },
  { id: "c_pooling",      kind: "concept", parent_id: "cnn",         label: "pooling",               year: 1989, category: "vision",      summary: "Spatial downsampling for translation invariance.", annotations: [] },

  { id: "c_chain_rule",   kind: "concept", parent_id: "backprop",    label: "chain rule",            year: 1986, category: "foundations", summary: "Gradient flows backward through composed functions.", annotations: [] },
];

const SEED_EDGES = [
  { from: "mp_neuron",   to: "perceptron",  type: "extends" },
  { from: "perceptron",  to: "backprop",    type: "enables" },
  { from: "backprop",    to: "cnn",         type: "applies" },
  { from: "backprop",    to: "lstm",        type: "applies" },
  { from: "lstm",        to: "seq2seq",     type: "uses" },
  { from: "word2vec",    to: "seq2seq",     type: "inspired_by" },
  { from: "seq2seq",     to: "attention",   type: "extends" },
  { from: "attention",   to: "transformer", type: "extends" },
  { from: "transformer", to: "bert_gpt",    type: "extends" },
];

const EXAMPLE_PROMPTS = [
  "Tell me about AlexNet and why it was a turning point.",
  "How does attention actually relate to the Transformer?",
  "Add AlphaGo and connect it to reinforcement learning.",
];

const WELCOME_MESSAGES = [
  {
    role: "assistant",
    content: "Welcome to your notebook. This is a living chart of how machines learned to think. Ask me about any idea, person, or paper — I'll explain it and draw it onto the map. The things we discuss will become annotations in the margins of each node."
  }
];

function jitter(seed, range) {
  const x = Math.sin(seed * 9301 + 49297) * 43758.5453;
  return ((x - Math.floor(x)) * 2 - 1) * range;
}
function hashId(id) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return Math.abs(h);
}
function xFromYear(year) {
  const left = 110, right = CANVAS_W - 110;
  const t = (year - YEAR_MIN) / (YEAR_MAX - YEAR_MIN);
  return left + Math.max(0, Math.min(1, t)) * (right - left);
}
function yFromCategory(category, seed) {
  const frac = LANE_FRACS[category] ?? 0.5;
  return frac * CANVAS_H + jitter(seed, 22);
}
function rotationFor(seed) {
  return jitter(seed + 7, 1.4);
}
function rectsOverlap(ax, ay, bx, by, padX, padY) {
  return Math.abs(ax - bx) < (NODE_W + padX) && Math.abs(ay - by) < (NODE_H + padY);
}
function positionNode(node, existingNodes) {
  // Concept nodes are positioned relative to their parent at render-time, not stored on the timeline
  if (node.kind === "concept") {
    return { ...node, x: 0, y: 0, rotation: rotationFor(hashId(node.id) + 3) };
  }
  const baseX = xFromYear(node.year);
  const baseY = yFromCategory(node.category, hashId(node.id));
  // Try a spiral of candidate positions until no collision
  const candidates = [
    [0, 0],
    [0, -80], [0, 80],
    [-28, -80], [28, -80], [-28, 80], [28, 80],
    [0, -160], [0, 160],
    [-40, -160], [40, -160], [-40, 160], [40, 160],
    [0, -240], [0, 240],
    [-60, -240], [60, -240], [-60, 240], [60, 240],
  ];
  let chosenX = baseX, chosenY = baseY;
  for (const [dx, dy] of candidates) {
    const tx = baseX + dx;
    const ty = baseY + dy;
    let collide = false;
    for (const other of existingNodes) {
      if (other.id === node.id) continue;
      if (other.kind === "concept") continue;
      if (rectsOverlap(tx, ty, other.x, other.y, 24, 22)) { collide = true; break; }
    }
    if (!collide) { chosenX = tx; chosenY = ty; break; }
  }
  chosenY = Math.max(110, Math.min(CANVAS_H - 110, chosenY));
  const rotation = rotationFor(hashId(node.id) + 3);
  return { ...node, x: chosenX, y: chosenY, rotation };
}

window.AIMindData = {
  CANVAS_W, CANVAS_H, NODE_W, NODE_H, YEAR_MIN, YEAR_MAX,
  STORAGE_KEY, CHANNEL_NAME,
  CATEGORY_STYLES, getCategoryStyles, LANE_FRACS, REL_LABELS,
  SEED_NODES, SEED_EDGES,
  EXAMPLE_PROMPTS, WELCOME_MESSAGES,
  xFromYear, yFromCategory, rotationFor, positionNode, hashId,
};
