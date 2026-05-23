const { useState, useRef, useEffect } = React;

// ===== Seed data: canonical AI history =====
const SEED_NODES = [
  { id: 'mp_neuron', label: 'McCulloch–Pitts', label_ar: 'الخلية العصبية الرياضية', year: 1943, category: 'foundations', summary: 'أول نموذج رياضي للخلية العصبية كبوابة منطقية. حوّل أفكار المنطق إلى دوائر عصبية افتراضية.' },
  { id: 'perceptron', label: 'Perceptron', label_ar: 'البيرسبترون', year: 1958, category: 'foundations', summary: 'Rosenblatt — أول شبكة عصبية قابلة للتدريب. مهّد للتعلم الآلي الحديث.' },
  { id: 'backprop', label: 'Backpropagation', label_ar: 'الانتشار العكسي', year: 1986, category: 'foundations', summary: 'Rumelhart, Hinton, Williams — خوارزمية تدريب الشبكات متعددة الطبقات.' },
  { id: 'cnn', label: 'LeNet · CNN', label_ar: 'الشبكة الالتفافية', year: 1989, category: 'vision', summary: 'LeCun — معالجة الصور بطبقات الالتفاف. أساس الرؤية الحاسوبية.' },
  { id: 'lstm', label: 'LSTM', label_ar: 'الذاكرة الطويلة', year: 1997, category: 'language', summary: 'Hochreiter & Schmidhuber — حلّ مشكلة تلاشي التدرج في الشبكات المتكررة.' },
  { id: 'word2vec', label: 'word2vec', label_ar: 'تمثيل الكلمات', year: 2013, category: 'language', summary: 'Mikolov — تحويل الكلمات إلى متجهات دلالية. اللغة صارت رياضيات.' },
  { id: 'seq2seq', label: 'Seq2Seq', label_ar: 'تسلسل إلى تسلسل', year: 2014, category: 'language', summary: 'Sutskever — معمارية encoder–decoder للترجمة الآلية.' },
  { id: 'attention', label: 'Attention', label_ar: 'آلية الانتباه', year: 2014, category: 'language', summary: 'Bahdanau — السماح للنموذج بـ"النظر" لأجزاء مختلفة من المدخل.' },
  { id: 'transformer', label: 'Transformer', label_ar: 'المحوّل', year: 2017, category: 'architecture', summary: 'Vaswani et al. — Attention Is All You Need. تخلّى عن RNN كلياً.' },
  { id: 'bert_gpt', label: 'BERT · GPT', label_ar: 'BERT و GPT', year: 2018, category: 'language', summary: 'Pre-training ضخم على Transformer. ولادة عصر LLMs.' },
];

const SEED_EDGES = [
  { from: 'mp_neuron', to: 'perceptron', type: 'extends' },
  { from: 'perceptron', to: 'backprop', type: 'enables' },
  { from: 'backprop', to: 'cnn', type: 'applies' },
  { from: 'backprop', to: 'lstm', type: 'applies' },
  { from: 'lstm', to: 'seq2seq', type: 'uses' },
  { from: 'word2vec', to: 'seq2seq', type: 'inspired_by' },
  { from: 'seq2seq', to: 'attention', type: 'extends' },
  { from: 'attention', to: 'transformer', type: 'extends' },
  { from: 'transformer', to: 'bert_gpt', type: 'extends' },
];

// ===== Visual constants =====
const CATEGORY_STYLES = {
  foundations: { fill: '#e8dcc4', stroke: '#7a5c2e', text: '#3a2a14', label: 'أساسيات' },
  vision:      { fill: '#d5e0ce', stroke: '#4a6b48', text: '#243a23', label: 'رؤية' },
  language:    { fill: '#e8cdbf', stroke: '#9c4a2e', text: '#4a1f10', label: 'لغة' },
  rl:          { fill: '#cdd5e0', stroke: '#4a5a78', text: '#1f2a40', label: 'تعزيز' },
  architecture:{ fill: '#e8d8b8', stroke: '#8c6a2e', text: '#3a2a14', label: 'معمارية' },
  other:       { fill: '#dcd4c4', stroke: '#5a5040', text: '#2a2418', label: 'أخرى' },
};

const EDGE_STYLES = {
  extends:     { dash: 'none', label: 'يمدّد' },
  enables:     { dash: 'none', label: 'يُمكّن' },
  applies:     { dash: '4,3', label: 'يطبّق' },
  uses:        { dash: '4,3', label: 'يستخدم' },
  inspired_by: { dash: '2,4', label: 'مستوحى من' },
  precedes:    { dash: 'none', label: 'يسبق' },
  critiques:   { dash: '6,3', label: 'ينتقد' },
};

// ===== Timeline layout =====
const YEAR_MIN = 1940;
const YEAR_MAX = 2026;
const CANVAS_W = 1600;
const CANVAS_H = 720;
const PADDING_X = 80;
const PADDING_Y = 60;

const yearToX = (year) => {
  const span = YEAR_MAX - YEAR_MIN;
  const usable = CANVAS_W - PADDING_X * 2;
  return PADDING_X + ((year - YEAR_MIN) / span) * usable;
};

const CATEGORY_LANES = {
  foundations: 0.5,
  vision: 0.15,
  language: 0.75,
  rl: 0.35,
  architecture: 0.5,
  other: 0.9,
};

const categoryToY = (category, jitter = 0) => {
  const lane = CATEGORY_LANES[category] ?? 0.5;
  return PADDING_Y + lane * (CANVAS_H - PADDING_Y * 2) + jitter;
};

// Pre-compute positions for seed nodes with manual tweaks
const layoutSeedNodes = () => {
  const positioned = SEED_NODES.map((n, i) => ({
    ...n,
    x: yearToX(n.year),
    y: categoryToY(n.category, (i % 2 === 0 ? -20 : 20)),
    rotation: (Math.sin(i * 1.3) * 1.2), // tiny organic tilt
  }));
  // Manual nudges to avoid overlap on the dense modern side
  const adjust = { lstm: -30, word2vec: 20, seq2seq: 60, attention: -10, transformer: 0, bert_gpt: 30 };
  return positioned.map(n => adjust[n.id] !== undefined ? { ...n, y: n.y + adjust[n.id] } : n);
};

// ===== Hand-drawn-ish path between two points =====
const handDrawnPath = (x1, y1, x2, y2) => {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const mx = x1 + dx * 0.5;
  const my = y1 + dy * 0.5;
  // gentle bezier control points for an organic curve
  const cp1x = x1 + dx * 0.3;
  const cp1y = y1 + dy * 0.1 + (Math.abs(dy) > 80 ? Math.sign(dy) * 30 : 20);
  const cp2x = x1 + dx * 0.7;
  const cp2y = y2 - dy * 0.1 - (Math.abs(dy) > 80 ? Math.sign(dy) * 30 : 20);
  return `M ${x1} ${y1} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}`;
};

// ===== App =====
function App() {
  const [nodes, setNodes] = useState(layoutSeedNodes());
  const [edges, setEdges] = useState(SEED_EDGES);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [newlyAdded, setNewlyAdded] = useState(new Set());

  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: 'أهلاً. هذي خريطتك في تاريخ الذكاء الاصطناعي — من أول نموذج رياضي للخلية العصبية سنة 1943 إلى عصر LLMs. اسألني عن أي مفهوم، أو اطرح فكرة تبيها تُضاف للخريطة.',
    },
  ]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const chatScrollRef = useRef(null);
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, busy]);

  // Position a new node coming from the AI
  const positionNewNode = (newNode, currentNodes) => {
    const year = newNode.year || 2024;
    const category = CATEGORY_STYLES[newNode.category] ? newNode.category : 'other';
    const baseX = yearToX(year);
    let y = categoryToY(category);
    // Avoid collision: nudge down if too close to existing node within 80px x
    const conflicts = currentNodes.filter(n => Math.abs(n.x - baseX) < 90 && Math.abs(n.y - y) < 70);
    if (conflicts.length > 0) {
      y += 70 * conflicts.length * (Math.random() > 0.5 ? 1 : -1);
      y = Math.max(PADDING_Y + 40, Math.min(CANVAS_H - PADDING_Y - 40, y));
    }
    return {
      ...newNode,
      category,
      x: baseX,
      y,
      rotation: (Math.random() - 0.5) * 2,
    };
  };

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || busy) return;
    setError(null);
    const userMsg = { role: 'user', text: trimmed };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput('');
    setBusy(true);

    const existingNodesList = nodes.map(n => `${n.id} (${n.label}, ${n.year})`).join('\n');

    const systemPrompt = `أنت معلّم متخصص في تاريخ الذكاء الاصطناعي وأوراقه البحثية. تشرح للمستخدم بالعربية الفصحى البسيطة.

مهمتك في كل رد:
1. أجب على سؤال المستخدم بدقة واختصار (2-4 جمل، حد أقصى).
2. حدّد أي مفاهيم أو أوراق رئيسية ذُكرت في الإجابة ولم تكن موجودة في الخريطة بعد، وأرجعها كعقد جديدة.
3. حدّد العلاقات بين هذه المفاهيم وبين العقد الموجودة.

العقد الموجودة حالياً في الخريطة:
${existingNodesList}

تنسيق الرد المطلوب — أرجع JSON خالصاً بدون أي نص قبله أو بعده وبدون أسوار markdown:

{
  "reply": "إجابتك بالعربية",
  "new_nodes": [
    {
      "id": "snake_case_id_فريد_بالإنجليزية",
      "label": "الاسم بالإنجليزية مختصر",
      "label_ar": "الاسم بالعربية",
      "year": 2017,
      "category": "foundations|vision|language|rl|architecture",
      "summary": "وصف مختصر بسطر واحد بالعربية"
    }
  ],
  "new_edges": [
    { "from": "id_موجود_أو_جديد", "to": "id_موجود_أو_جديد", "type": "extends|enables|applies|uses|inspired_by|precedes|critiques" }
  ]
}

قواعد:
- لا تكرّر عقد موجودة. إذا ذكرت مفهوماً موجوداً، استخدم id الموجود في new_edges فقط.
- إذا كان السؤال عاماً ولا يستدعي إضافة مفاهيم، اجعل new_nodes و new_edges مصفوفتين فارغتين.
- استخدم السنوات الصحيحة للأوراق الكلاسيكية.
- اجعل الـ id بالإنجليزية snake_case، فريداً، وقصيراً.`;

    try {
      // Build a single prompt: system instructions + transcript.
      // window.claude.complete is a single-turn helper, so we serialize the
      // conversation into one prompt.
      const transcript = nextMessages.map(m =>
        `${m.role === 'user' ? 'المستخدم' : 'المساعد'}: ${m.text}`
      ).join('\n\n');
      const fullPrompt = `${systemPrompt}\n\n— سجل المحادثة —\n\n${transcript}\n\nالمساعد (أرجع JSON فقط):`;

      let text = await window.claude.complete(fullPrompt);
      text = (text || '').trim();

      // Strip markdown fences if present
      text = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();

      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch (e) {
        // Try extracting JSON object from text
        const match = text.match(/\{[\s\S]*\}/);
        if (match) parsed = JSON.parse(match[0]);
        else throw new Error('فشل تحليل رد النموذج');
      }

      const assistantText = parsed.reply || 'تم.';
      setMessages(prev => [...prev, { role: 'assistant', text: assistantText }]);

      // Apply new nodes & edges
      if (Array.isArray(parsed.new_nodes) && parsed.new_nodes.length > 0) {
        setNodes(prev => {
          const existing = new Set(prev.map(n => n.id));
          const fresh = parsed.new_nodes.filter(n => n.id && !existing.has(n.id));
          const positioned = [];
          let working = [...prev];
          for (const nn of fresh) {
            const placed = positionNewNode(nn, working);
            positioned.push(placed);
            working = [...working, placed];
          }
          // Mark as newly added for animation
          setNewlyAdded(new Set(positioned.map(n => n.id)));
          setTimeout(() => setNewlyAdded(new Set()), 2500);
          return [...prev, ...positioned];
        });
      }

      if (Array.isArray(parsed.new_edges) && parsed.new_edges.length > 0) {
        setEdges(prev => {
          const existing = new Set(prev.map(e => `${e.from}->${e.to}`));
          const fresh = parsed.new_edges.filter(e =>
            e.from && e.to && !existing.has(`${e.from}->${e.to}`)
          );
          return [...prev, ...fresh];
        });
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'حدث خطأ');
      setMessages(prev => [...prev, { role: 'assistant', text: '⚠️ تعذّر معالجة الرد. حاول مرة أخرى.' }]);
    } finally {
      setBusy(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Build a map for edge lookups
  const nodeMap = Object.fromEntries(nodes.map(n => [n.id, n]));

  // Identify connected nodes for highlight
  const highlightedNodeIds = selectedNode
    ? new Set([
        selectedNode,
        ...edges.filter(e => e.from === selectedNode).map(e => e.to),
        ...edges.filter(e => e.to === selectedNode).map(e => e.from),
      ])
    : null;

  const selectedNodeData = selectedNode ? nodeMap[selectedNode] : null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=IBM+Plex+Sans+Arabic:wght@300;400;500;600&display=swap');

        * { box-sizing: border-box; }
        html, body, #root { margin: 0; padding: 0; height: 100%; }
        body {
          font-family: 'IBM Plex Sans Arabic', 'Fraunces', serif;
          background: #f0e8d6;
          color: #2a2418;
          overflow: hidden;
        }

        .app {
          display: grid;
          grid-template-columns: 1fr 380px;
          height: 100vh;
          background:
            radial-gradient(ellipse at top left, rgba(122,92,46,0.05), transparent 50%),
            radial-gradient(ellipse at bottom right, rgba(156,74,46,0.04), transparent 50%),
            #f0e8d6;
          position: relative;
        }
        /* Paper grain texture */
        .app::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence baseFrequency='0.9' numOctaves='2'/><feColorMatrix values='0 0 0 0 0.2  0 0 0 0 0.15  0 0 0 0 0.08  0 0 0 0.04 0'/></filter><rect width='200' height='200' filter='url(%23n)'/></svg>");
          pointer-events: none;
          opacity: 0.6;
          mix-blend-mode: multiply;
          z-index: 1;
        }

        .canvas-wrap {
          position: relative;
          overflow: auto;
          z-index: 2;
        }

        .header {
          position: absolute;
          top: 18px;
          left: 24px;
          right: 24px;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          z-index: 10;
          pointer-events: none;
        }
        .brand {
          pointer-events: auto;
        }
        .brand-mark {
          font-family: 'Amiri', serif;
          font-size: 28px;
          font-weight: 700;
          letter-spacing: -0.5px;
          color: #2a2418;
          line-height: 1;
        }
        .brand-sub {
          font-family: 'Fraunces', serif;
          font-style: italic;
          font-size: 12px;
          color: #6a5a3a;
          margin-top: 4px;
          letter-spacing: 0.5px;
        }
        .legend {
          pointer-events: auto;
          display: flex;
          gap: 14px;
          font-family: 'IBM Plex Sans Arabic';
          font-size: 11px;
          color: #4a3f2a;
        }
        .legend-item {
          display: flex;
          align-items: center;
          gap: 5px;
        }
        .legend-dot {
          width: 9px;
          height: 9px;
          border-radius: 50%;
          border: 1.5px solid;
        }

        .timeline-label {
          position: absolute;
          font-family: 'Fraunces', serif;
          font-size: 11px;
          color: #8a7a5a;
          font-style: italic;
          pointer-events: none;
        }

        .node-group {
          cursor: pointer;
          transition: transform 0.25s ease;
        }
        .node-group:hover {
          transform: scale(1.04);
          transform-origin: center;
        }
        .node-group.dimmed { opacity: 0.25; }
        .node-group.selected .node-rect {
          stroke-width: 2.5px;
          filter: drop-shadow(0 6px 12px rgba(42,36,24,0.18));
        }
        .node-group.newly-added {
          animation: nodeAppear 1.5s ease-out;
        }
        @keyframes nodeAppear {
          0% { opacity: 0; transform: scale(0.7); }
          50% { opacity: 1; transform: scale(1.08); }
          100% { opacity: 1; transform: scale(1); }
        }
        .node-rect {
          stroke-width: 1.5px;
          transition: stroke-width 0.2s, filter 0.2s;
          filter: drop-shadow(0 2px 4px rgba(42,36,24,0.08));
        }
        .node-year {
          font-family: 'Fraunces', serif;
          font-size: 10px;
          font-style: italic;
          font-weight: 500;
          fill: rgba(0,0,0,0.5);
        }
        .node-title-en {
          font-family: 'Fraunces', serif;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: -0.2px;
        }
        .node-title-ar {
          font-family: 'IBM Plex Sans Arabic', sans-serif;
          font-size: 10.5px;
          font-weight: 400;
        }

        .edge-path {
          fill: none;
          stroke: #6a5a3a;
          stroke-width: 1.3px;
          opacity: 0.55;
          transition: opacity 0.2s, stroke-width 0.2s;
        }
        .edge-path.dimmed { opacity: 0.15; }
        .edge-path.highlighted {
          opacity: 0.95;
          stroke-width: 2px;
        }
        .edge-label {
          font-family: 'Fraunces', serif;
          font-size: 9px;
          font-style: italic;
          fill: #6a5a3a;
          opacity: 0;
          transition: opacity 0.2s;
        }
        .edge-path.highlighted + .edge-label,
        .edge-group:hover .edge-label {
          opacity: 1;
        }

        /* Inspector card */
        .inspector {
          position: absolute;
          bottom: 24px;
          left: 24px;
          max-width: 320px;
          background: rgba(255,250,238,0.95);
          border: 1px solid rgba(122,92,46,0.3);
          padding: 14px 16px;
          z-index: 5;
          font-family: 'IBM Plex Sans Arabic', sans-serif;
          box-shadow: 0 4px 16px rgba(42,36,24,0.1);
          animation: fadeIn 0.3s ease;
        }
        @keyframes fadeIn { from { opacity:0; transform: translateY(8px); } to { opacity:1; transform: translateY(0); } }
        .inspector-year {
          font-family: 'Fraunces', serif;
          font-style: italic;
          font-size: 11px;
          color: #8a7a5a;
        }
        .inspector-title {
          font-family: 'Fraunces', serif;
          font-size: 18px;
          font-weight: 600;
          margin: 2px 0 4px;
          color: #2a2418;
        }
        .inspector-title-ar {
          font-size: 13px;
          color: #5a4f3a;
          margin-bottom: 8px;
        }
        .inspector-summary {
          font-size: 13px;
          line-height: 1.6;
          color: #3a3220;
        }
        .inspector-close {
          position: absolute;
          top: 8px;
          left: 8px;
          background: none;
          border: none;
          font-size: 16px;
          color: #8a7a5a;
          cursor: pointer;
          padding: 0;
          width: 20px;
          height: 20px;
        }

        /* Chat panel */
        .chat {
          background: rgba(245,236,217,0.85);
          border-right: 1px solid rgba(122,92,46,0.18);
          display: flex;
          flex-direction: column;
          z-index: 3;
          backdrop-filter: blur(8px);
          direction: rtl;
        }
        .chat-header {
          padding: 22px 22px 14px;
          border-bottom: 1px solid rgba(122,92,46,0.15);
        }
        .chat-title {
          font-family: 'Amiri', serif;
          font-size: 20px;
          font-weight: 700;
          color: #2a2418;
        }
        .chat-subtitle {
          font-family: 'Fraunces', serif;
          font-style: italic;
          font-size: 11px;
          color: #6a5a3a;
          margin-top: 2px;
        }
        .messages {
          flex: 1;
          overflow-y: auto;
          padding: 18px 20px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .msg {
          font-family: 'IBM Plex Sans Arabic', sans-serif;
          font-size: 13.5px;
          line-height: 1.7;
          max-width: 92%;
          padding: 10px 14px;
        }
        .msg.user {
          align-self: flex-start;
          background: #2a2418;
          color: #f0e8d6;
          border-radius: 14px 14px 14px 4px;
        }
        .msg.assistant {
          align-self: flex-end;
          background: rgba(255,250,238,0.7);
          color: #2a2418;
          border-radius: 14px 14px 4px 14px;
          border: 1px solid rgba(122,92,46,0.15);
        }
        .typing {
          align-self: flex-end;
          padding: 12px 14px;
          font-family: 'Fraunces', serif;
          font-style: italic;
          font-size: 12px;
          color: #8a7a5a;
        }
        .typing-dot {
          display: inline-block;
          width: 5px; height: 5px;
          background: #8a7a5a;
          border-radius: 50%;
          margin: 0 1px;
          animation: blink 1.4s infinite;
        }
        .typing-dot:nth-child(2) { animation-delay: 0.2s; }
        .typing-dot:nth-child(3) { animation-delay: 0.4s; }
        @keyframes blink { 0%, 60%, 100% { opacity: 0.3; } 30% { opacity: 1; } }

        .composer {
          padding: 14px 18px 18px;
          border-top: 1px solid rgba(122,92,46,0.15);
          display: flex;
          gap: 8px;
        }
        .composer textarea {
          flex: 1;
          font-family: 'IBM Plex Sans Arabic', sans-serif;
          font-size: 13.5px;
          background: rgba(255,250,238,0.7);
          border: 1px solid rgba(122,92,46,0.25);
          padding: 10px 12px;
          resize: none;
          height: 44px;
          color: #2a2418;
          outline: none;
          direction: rtl;
        }
        .composer textarea:focus {
          border-color: #7a5c2e;
        }
        .send-btn {
          background: #2a2418;
          color: #f0e8d6;
          border: none;
          padding: 0 16px;
          cursor: pointer;
          font-family: 'Fraunces', serif;
          font-size: 13px;
          letter-spacing: 0.3px;
          transition: opacity 0.2s, background 0.2s;
        }
        .send-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .send-btn:hover:not(:disabled) { background: #1a1410; }

        .hint {
          padding: 0 20px 8px;
          font-family: 'Fraunces', serif;
          font-style: italic;
          font-size: 10.5px;
          color: #8a7a5a;
          text-align: center;
        }

        .messages::-webkit-scrollbar { width: 6px; }
        .messages::-webkit-scrollbar-track { background: transparent; }
        .messages::-webkit-scrollbar-thumb { background: rgba(122,92,46,0.25); border-radius: 3px; }
      `}</style>

      <div className="app">
        {/* ===== CANVAS ===== */}
        <div className="canvas-wrap">
          <div className="header">
            <div className="brand">
              <div className="brand-mark">ذاكرة · Memory</div>
              <div className="brand-sub">a living map of artificial intelligence</div>
            </div>
            <div className="legend">
              {Object.entries(CATEGORY_STYLES).filter(([k]) => k !== 'other').map(([k, s]) => (
                <div className="legend-item" key={k}>
                  <span className="legend-dot" style={{ background: s.fill, borderColor: s.stroke }} />
                  <span>{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          <svg
            width={CANVAS_W}
            height={CANVAS_H}
            style={{ display: 'block', minWidth: '100%' }}
            onClick={(e) => {
              if (e.target.tagName === 'svg') setSelectedNode(null);
            }}
          >
            <defs>
              <pattern id="paper" patternUnits="userSpaceOnUse" width="100" height="100">
                <rect width="100" height="100" fill="transparent"/>
              </pattern>
              {/* Soft arrowhead */}
              <marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
                <path d="M0,0 L8,4 L0,8 L2,4 Z" fill="#6a5a3a" opacity="0.7"/>
              </marker>
            </defs>

            {/* Timeline ticks */}
            {[1940, 1960, 1980, 2000, 2020].map(y => (
              <g key={y}>
                <line
                  x1={yearToX(y)} y1={PADDING_Y - 30}
                  x2={yearToX(y)} y2={CANVAS_H - PADDING_Y + 30}
                  stroke="#7a5c2e" strokeWidth="0.5" strokeDasharray="2,6" opacity="0.25"
                />
                <text
                  x={yearToX(y)} y={CANVAS_H - 20}
                  textAnchor="middle"
                  className="timeline-label"
                  style={{ fontFamily: 'Fraunces, serif', fontSize: 12, fill: '#8a7a5a', fontStyle: 'italic' }}
                >
                  {y}
                </text>
              </g>
            ))}

            {/* Edges */}
            {edges.map((edge, i) => {
              const a = nodeMap[edge.from];
              const b = nodeMap[edge.to];
              if (!a || !b) return null;
              const isHighlighted = highlightedNodeIds && (highlightedNodeIds.has(edge.from) && highlightedNodeIds.has(edge.to));
              const isDimmed = highlightedNodeIds && !isHighlighted;
              const edgeStyle = EDGE_STYLES[edge.type] || EDGE_STYLES.extends;
              // Connect edges to node edges (not centers) — approximate with x offset
              const dir = b.x > a.x ? 1 : -1;
              const x1 = a.x + dir * 55;
              const x2 = b.x - dir * 55;
              const path = handDrawnPath(x1, a.y, x2, b.y);
              const midX = (x1 + x2) / 2;
              const midY = (a.y + b.y) / 2;
              return (
                <g key={i} className="edge-group">
                  <path
                    d={path}
                    className={`edge-path ${isHighlighted ? 'highlighted' : ''} ${isDimmed ? 'dimmed' : ''}`}
                    strokeDasharray={edgeStyle.dash !== 'none' ? edgeStyle.dash : undefined}
                    markerEnd="url(#arrow)"
                  />
                  <text x={midX} y={midY - 4} textAnchor="middle" className="edge-label">
                    {edgeStyle.label}
                  </text>
                </g>
              );
            })}

            {/* Nodes */}
            {nodes.map(n => {
              const style = CATEGORY_STYLES[n.category] || CATEGORY_STYLES.other;
              const isHighlighted = highlightedNodeIds && highlightedNodeIds.has(n.id);
              const isDimmed = highlightedNodeIds && !isHighlighted;
              const isSelected = selectedNode === n.id;
              const isNew = newlyAdded.has(n.id);
              const W = 130;
              const H = 56;
              return (
                <g
                  key={n.id}
                  className={`node-group ${isDimmed ? 'dimmed' : ''} ${isSelected ? 'selected' : ''} ${isNew ? 'newly-added' : ''}`}
                  transform={`translate(${n.x},${n.y}) rotate(${n.rotation || 0})`}
                  onClick={(e) => { e.stopPropagation(); setSelectedNode(prev => prev === n.id ? null : n.id); }}
                  onMouseEnter={() => setHoveredNode(n.id)}
                  onMouseLeave={() => setHoveredNode(null)}
                >
                  <rect
                    x={-W/2} y={-H/2} width={W} height={H} rx={3}
                    className="node-rect"
                    fill={style.fill}
                    stroke={style.stroke}
                  />
                  <text x={-W/2 + 8} y={-H/2 + 14} className="node-year" style={{ fill: style.text, opacity: 0.6 }}>
                    {n.year}
                  </text>
                  <text x={0} y={-2} textAnchor="middle" className="node-title-en" style={{ fill: style.text }}>
                    {n.label}
                  </text>
                  <text x={0} y={15} textAnchor="middle" className="node-title-ar" style={{ fill: style.text, opacity: 0.75 }}>
                    {n.label_ar}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Inspector card */}
          {selectedNodeData && (
            <div className="inspector">
              <button className="inspector-close" onClick={() => setSelectedNode(null)}>×</button>
              <div className="inspector-year">{selectedNodeData.year} · {CATEGORY_STYLES[selectedNodeData.category]?.label}</div>
              <div className="inspector-title">{selectedNodeData.label}</div>
              <div className="inspector-title-ar">{selectedNodeData.label_ar}</div>
              <div className="inspector-summary">{selectedNodeData.summary}</div>
            </div>
          )}
        </div>

        {/* ===== CHAT ===== */}
        <div className="chat">
          <div className="chat-header">
            <div className="chat-title">المُحادِث</div>
            <div className="chat-subtitle">ask · the map grows</div>
          </div>
          <div className="messages" ref={chatScrollRef}>
            {messages.map((m, i) => (
              <div key={i} className={`msg ${m.role}`}>{m.text}</div>
            ))}
            {busy && (
              <div className="typing">
                يفكّر<span className="typing-dot"></span><span className="typing-dot"></span><span className="typing-dot"></span>
              </div>
            )}
          </div>
          <div className="hint">جرّب: "احكِ لي عن GAN" · "وش هو الـ diffusion؟" · "ايش علاقة CLIP بـ Transformer؟"</div>
          <div className="composer">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="اكتب سؤالك..."
              disabled={busy}
            />
            <button className="send-btn" onClick={sendMessage} disabled={busy || !input.trim()}>
              أرسل
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
