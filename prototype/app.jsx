// Graph page — the canvas; chat lives in a separate window

const { getCategoryStyles, REL_LABELS } = window.AIMindData;

const THEME_KEY = "ai-mind-theme";
function applyTheme(t) {
  document.body.classList.toggle("dark", t === "dark");
}
// apply persisted theme on load
applyTheme(localStorage.getItem(THEME_KEY) || "light");
const { loadState, subscribe, resetState, setFocus } = window.AIMindStore;
const Canvas = window.AIMindCanvas;
const Inspector = window.AIMindInspector;

function App() {
  const [state, setState] = React.useState(() => loadState());
  const [selectedId, setSelectedId] = React.useState(null);
  const [chatWin, setChatWin] = React.useState(null);
  const [theme, setTheme] = React.useState(() => localStorage.getItem(THEME_KEY) || "light");

  React.useEffect(() => {
    applyTheme(theme);
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  React.useEffect(() => {
    subscribe((msg) => {
      if (msg && msg.type === "state") setState(msg.state);
    });
  }, []);

  // Watch chat window — show "open chat" again if closed
  React.useEffect(() => {
    if (!chatWin) return;
    const id = setInterval(() => {
      if (chatWin.closed) setChatWin(null);
    }, 1000);
    return () => clearInterval(id);
  }, [chatWin]);

  function openChat() {
    if (chatWin && !chatWin.closed) { chatWin.focus(); return; }
    const w = window.open("chat.html", "ai-mind-chat", "width=440,height=720,resizable=yes");
    setChatWin(w);
  }

  const focused = state.focusId ? state.nodes.find((n) => n.id === state.focusId) : null;
  const selectedNode = selectedId ? state.nodes.find((n) => n.id === selectedId) : null;
  const inspectorNode = selectedNode || focused;

  const relatedForInspector = React.useMemo(() => {
    if (!inspectorNode) return [];
    const id = inspectorNode.id;
    const out = [];
    for (const e of state.edges) {
      if (e.from === id) {
        const n = state.nodes.find((x) => x.id === e.to);
        const rel = REL_LABELS[e.type];
        if (n && rel) out.push({ label: `${rel.en} → ${n.label}` });
      } else if (e.to === id) {
        const n = state.nodes.find((x) => x.id === e.from);
        const rel = REL_LABELS[e.type];
        if (n && rel) out.push({ label: `${n.label} ${rel.en} →` });
      }
    }
    return out;
  }, [inspectorNode, state.edges, state.nodes]);

  function handleSelect(id) {
    setSelectedId(id);
    setFocus(id);
  }

  function handleReset() {
    if (confirm("Reset the notebook? All discussion and added nodes will be cleared.")) {
      const s = resetState();
      setState(s);
      setSelectedId(null);
    }
  }

  return (
    <div className="app graph-only">
      <header className="header">
        <div className="brand">
          <span className="brand-mark">AI Mind</span>
          <span className="brand-tag">a personal natural history of machine intelligence</span>
        </div>
        <div className="legend">
          {["foundations", "vision", "language", "rl", "architecture"].map((cat) => {
            const cs = getCategoryStyles()[cat];
            return (
              <div key={cat} className="legend-item">
                <span className="legend-swatch"
                  style={{ background: cs.fill, color: cs.stroke }}/>
                <span>{cs.label}</span>
              </div>
            );
          })}
          <span className="legend-stat">
            {state.nodes.length} nodes · {state.edges.length} edges
          </span>
          <button className="header-btn ghost" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} title="Toggle theme">
            {theme === "dark" ? "☽ Dark" : "☼ Light"}
          </button>
          <button className="header-btn ghost" onClick={handleReset} title="Reset notebook">Reset</button>
          <button className={`header-btn ${chatWin && !chatWin.closed ? "active" : ""}`} onClick={openChat}>
            {chatWin && !chatWin.closed ? "Chat ✓ open" : "Open Chat ↗"}
          </button>
        </div>
      </header>

      <div className="canvas-wrap">
        <Canvas
          state={state}
          selectedId={selectedId}
          onSelectNode={handleSelect}
          onClearSelection={() => { setSelectedId(null); setFocus(null); }}
        />
        <Inspector
          node={inspectorNode}
          related={relatedForInspector}
          onClose={() => { setSelectedId(null); setFocus(null); }}
        />
        <div className="folio">folio I · {new Date().getFullYear()}</div>
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
