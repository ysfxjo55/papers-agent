// Chat sidebar — RTL Arabic with Anthropic-backed tutor

const { EXAMPLE_PROMPTS } = window.AIMindData;

function Chat({ messages, busy, onSend, onExample }) {
  const [draft, setDraft] = React.useState("");
  const scrollRef = React.useRef(null);
  const taRef = React.useRef(null);

  React.useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, busy]);

  function submit() {
    const t = draft.trim();
    if (!t || busy) return;
    setDraft("");
    onSend(t);
  }

  function onKey(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-head">
        <div className="sidebar-title">دفتر التاريخ</div>
        <div className="sidebar-sub">a tutor for the history of machine cognition</div>
      </div>

      <div className="chat-scroll" ref={scrollRef}>
        {messages.map((m, i) => (
          <div className={`msg ${m.role}`} key={i}>
            {m.role !== "system" && (
              <div className="msg-meta">
                {m.role === "user" ? "أنت" : "الدفتر"}
                {m.addedCount ? ` · أضاف ${m.addedCount} ${m.addedCount === 1 ? "عقدة" : "عُقد"}` : ""}
              </div>
            )}
            <div className="msg-body">{m.content}</div>
          </div>
        ))}
        {busy && (
          <div className="msg assistant">
            <div className="msg-meta">الدفتر</div>
            <div className="msg-body">
              <span className="thinking">
                يفكّر
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
          ref={taRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKey}
          placeholder="اكتب سؤالًا عن أيّ فكرة في تاريخ الذكاء الاصطناعي..."
          disabled={busy}
          rows={2}
        />
        <div className="composer-row">
          <span className="composer-hint">enter to send · shift+enter newline</span>
          <button className="send-btn" onClick={submit} disabled={busy || !draft.trim()}>
            أرسل
          </button>
        </div>
        <div className="examples">
          <span className="examples-label">جرّب:</span>
          {EXAMPLE_PROMPTS.map((p, i) => (
            <button
              key={i}
              className="example-chip"
              disabled={busy}
              onClick={() => onExample(p)}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}

window.AIMindChat = Chat;
