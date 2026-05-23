// Chat page — separate window, talks to graph via shared store

const { EXAMPLE_PROMPTS } = window.AIMindData;
const { loadState, subscribe, sendUserMessage } = window.AIMindStore;

function ChatApp() {
  const [state, setState] = React.useState(() => loadState());
  const [draft, setDraft] = React.useState("");
  const scrollRef = React.useRef(null);

  React.useEffect(() => {
    subscribe((msg) => {
      if (msg && msg.type === "state") setState(msg.state);
    });
  }, []);

  React.useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [state.messages, state.pending]);

  function submit() {
    const t = draft.trim();
    if (!t || state.pending) return;
    setDraft("");
    sendUserMessage(t);
  }
  function onKey(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }
  function useExample(p) {
    if (state.pending) return;
    sendUserMessage(p);
  }

  return (
    <div className="chat-page">
      <header className="chat-head">
        <div>
          <div className="chat-title">The Notebook</div>
          <div className="chat-sub">a tutor for the history of machine cognition</div>
        </div>
        <div className="chat-status">
          {state.nodes.length} nodes · {state.edges.length} edges
        </div>
      </header>

      <div className="chat-scroll" ref={scrollRef}>
        {state.messages.map((m, i) => (
          <div className={`msg ${m.role}`} key={i}>
            <div className="msg-meta">
              <span>{m.role === "user" ? "You" : "Notebook"}</span>
              {m.addedNodes ? (
                <span className="meta-tag">+{m.addedNodes} {m.addedNodes === 1 ? "node" : "nodes"}</span>
              ) : null}
              {m.addedAnnots ? (
                <span className="meta-tag">+{m.addedAnnots} {m.addedAnnots === 1 ? "note" : "notes"}</span>
              ) : null}
            </div>
            <div className="msg-body">{m.content}</div>
          </div>
        ))}
        {state.pending && (
          <div className="msg assistant">
            <div className="msg-meta"><span>Notebook</span></div>
            <div className="msg-body">
              <span className="thinking">
                thinking
                <span className="dot"></span>
                <span className="dot"></span>
                <span className="dot"></span>
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="composer">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKey}
          placeholder="Ask about any idea in the history of artificial intelligence..."
          disabled={state.pending}
          rows={3}
        />
        <div className="composer-row">
          <span className="composer-hint">enter to send · shift+enter newline</span>
          <button className="send-btn" onClick={submit} disabled={state.pending || !draft.trim()}>
            Send
          </button>
        </div>
        <div className="examples">
          <span className="examples-label">try:</span>
          {EXAMPLE_PROMPTS.map((p, i) => (
            <button key={i} className="example-chip" disabled={state.pending} onClick={() => useExample(p)}>
              {p}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<ChatApp />);
