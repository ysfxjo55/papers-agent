import { useState, useRef, useEffect } from 'react'
import type { ChatMessage } from '@/lib/types'

interface ChatPanelProps {
  messages: ChatMessage[]
  pending?: boolean
  onSendMessage: (text: string) => void
}

export function ChatPanel({ messages, pending, onSendMessage }: ChatPanelProps) {
  const [draft, setDraft] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, pending])

  function submit() {
    const t = draft.trim()
    if (!t || pending) return
    setDraft('')
    onSendMessage(t)
  }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  return (
    <div className="chat-page">
      <header className="chat-head">
        <div>
          <div className="chat-title">Chat</div>
        </div>
        <div className="chat-status" />
      </header>

      <div className="chat-scroll" ref={scrollRef}>
        {messages.map((m, i) => (
          <div className={`msg ${m.role}`} key={i}>
            <div className="msg-meta">
              <span>{m.role === 'user' ? 'You' : 'Notebook'}</span>
              {m.addedNodes ? (
                <span className="meta-tag">+{m.addedNodes} {m.addedNodes === 1 ? 'node' : 'nodes'}</span>
              ) : null}
              {m.addedAnnots ? (
                <span className="meta-tag">+{m.addedAnnots} {m.addedAnnots === 1 ? 'note' : 'notes'}</span>
              ) : null}
            </div>
            <div className="msg-body">{m.content}</div>
          </div>
        ))}
        {pending && (
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
          disabled={pending}
          rows={3}
        />
        <div className="composer-row">
          <span className="composer-hint">enter to send · shift+enter newline</span>
          <button className="send-btn" onClick={submit} disabled={pending || !draft.trim()}>
            Send
          </button>
        </div>
      </div>
    </div>
  )
}
