import type { ContentBlockParam, InputJSONDelta, MessageParam, RawContentBlockDelta, TextBlockParam, TextDelta, ToolUseBlockParam } from '@anthropic-ai/sdk/resources/index.mjs';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { streamAnthropic, getSession, saveSession, listSessions, deleteSession } from '../../api/client';
import { ChatInput } from './ChatInput.tsx';
import { MessageList } from './MessageList.tsx';
import { ToolsDrawer, ToolsPanel } from '../tools/ToolsPanel.tsx';
import ToolsProvider from '../tools/ToolsProvider.tsx';
import ApiKeyLogo from '../header/ApiKeyLogo.tsx';

export function ChatPage() {
  const [messages, setMessages] = useState<MessageParam[]>([]);
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyShow, setHistoryShow] = useState(false);
  const [sessions, setSessions] = useState<{ id: string; mtime: string; size: number }[]>([]);
  const [historyPos, setHistoryPos] = useState<{ x: number; y: number } | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const canSend = useMemo(() => !loading, [loading]);

  // ensure a session id in localStorage, load messages if exist
  useEffect(() => {
    function ensureId(): string {
      const key = 'chat_session_id';
      let id = localStorage.getItem(key) || '';
      if (!id) {
        id = (crypto as any).randomUUID ? (crypto as any).randomUUID() : String(Date.now());
        localStorage.setItem(key, id);
      }
      return id;
    }
    const id = ensureId();
    setSessionId(id);
    (async () => {
      try {
        const data = await getSession(id);
        if (Array.isArray(data?.messages)) {
          setMessages(data.messages as MessageParam[]);
        }
      } catch {
        // ignore
      }
    })();
  }, []);

  const onNewMessages = useCallback((messages: MessageParam[]) => {
    setMessages((prev) => {
      const next = [...prev];
      next.push(...messages);
      return next;
    });
  }, []);

  const onNewBlock = useCallback((block: ContentBlockParam) => {
    setMessages((prev) => {
      const next = [...prev];
      if (next.length === 0 || next[next.length - 1].role !== 'assistant') {
        next.push({
          role: 'assistant',
          content: [] as Array<ContentBlockParam>,
        } as MessageParam);
      }
      const last = next[next.length - 1] as MessageParam;
      if (Array.isArray(last.content)) {
        last.content.push(block);
      }
      return next;
    });
  }, []);

  const onAppendAssistantDelta = useCallback((delta: RawContentBlockDelta) => {
    setMessages((prev) => {
      const next = [...prev];
      if (next.length === 0 || next[next.length - 1].role !== 'assistant') {
        // not effect delta, ignore
        return next;
      }
      const last = next[next.length - 1] as MessageParam;
      function ensureLastBlock(type: string, action: (block: ContentBlockParam) => void) {
        if (Array.isArray(last.content) && last.content.length > 0) {
          const lastBlock = last.content[last.content.length - 1];
          if (lastBlock.type === type) {
            action(lastBlock);
          }
        }
      }
      switch (delta.type) {
        case 'text_delta': {
          ensureLastBlock('text', (lastBlock) => {
            const textDelta = delta as TextDelta;
            (lastBlock as TextBlockParam).text += textDelta.text;
          });
          break;
        }
        case 'input_json_delta': {
          ensureLastBlock('tool_use', (lastBlock) => {
            const inputJsonDelta = delta as InputJSONDelta;
            (lastBlock as ToolUseBlockParam).input += inputJsonDelta.partial_json;
          });
          break;
        }
      }
      return next;
    });
  }, []);

  const onBlockStop = useCallback(() => {
    setMessages((prev) => {
      const next = [...prev];
      if (next.length === 0 || next[next.length - 1].role !== 'assistant') {
        return next;
      }
      const last = next[next.length - 1] as MessageParam;
      if (Array.isArray(last.content)) {
        const lastBlock = last.content[last.content.length - 1];
        if (lastBlock.type === 'tool_use') {
          try {
            lastBlock.input = JSON.parse(lastBlock.input as string);
          } catch {
            lastBlock.input = JSON.parse("{}");
          }
        }
      }
      return next;
    });
  }, []);

  const send = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setMessages((prev) => [...prev, { role: 'user', content: trimmed }]);
    setLoading(true);
    try {
      await streamAnthropic(
        [...messages, { role: 'user', content: trimmed }],
        undefined,
        onNewMessages,
        onNewBlock,
        onAppendAssistantDelta,
        onBlockStop,
      );
    } catch (e) {
      onNewBlock({
        type: 'text',
        text: `\n[Error] ${(e as Error).message}`,
      } as TextBlockParam);
    } finally {
      setLoading(false);
    }
  }, [loading, messages, onNewMessages, onNewBlock, onAppendAssistantDelta, onBlockStop]);

  // persist messages (debounced)
  useEffect(() => {
    if (!sessionId) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      void (async () => {
        try { await saveSession(sessionId, messages as unknown[]); } catch { /* ignore */ }
      })();
    }, 400);
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, [messages, sessionId]);

  const showHistory = useCallback(async (anchor?: DOMRect) => {
    try {
      const res = await listSessions();
      setSessions(res.sessions || []);
      setHistoryPos(anchor ? { x: anchor.right, y: anchor.top } : null);
      setHistoryOpen(true);
      requestAnimationFrame(() => setHistoryShow(true));
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, loading]);

  return (
    <ToolsProvider>
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 via-sky-50 to-violet-50 text-slate-900">
      <header className="sticky top-0 backdrop-blur-md bg-white/60 border-b border-white/20" style={{ zIndex: 'var(--z-header)' }}>
        <div className="max-w-none w-full mx-0 px-6 py-3 flex items-center gap-3 relative">
          <div className="text-2xl font-extrabold tracking-tight">
            <span className="inline-block">
              <span className="bg-gradient-to-r from-pink-400 via-sky-400 to-fuchsia-300 bg-clip-text text-transparent">Open Macaron</span>
              <span className="block h-[2px] mt-[-8px] -mr-2 rounded-full bg-gradient-to-r from-slate-800 to-slate-700"></span>
            </span>
          </div>
          <div className="ml-auto flex items-center">
            <span className="hidden md:flex">
              <ApiKeyLogo align="right" />
            </span>
            <ToolsDrawer />
          </div>
        </div>
      </header>

      <div className="flex-1 min-h-0 flex">
        <main className="w-full max-w-none m-0 p-6 flex flex-col gap-4 flex-1 min-h-0">
          <MessageList ref={listRef} messages={messages} loading={loading} />

          <ChatInput
            disabled={!canSend}
            onSend={send}
            onNewChat={() => {
              setMessages([]);
              const key = 'chat_session_id';
              const id = (crypto as any).randomUUID ? (crypto as any).randomUUID() : String(Date.now());
              const prev = localStorage.getItem(key) || '';
              localStorage.setItem(key, id);
              setSessionId(id);
              // immediately persist empty session
              void (async () => { try { await saveSession(id, []); } catch { /* ignore */ } })();
              // ws notify session switch
              try {
                const apiKey = localStorage.getItem('memu_api_key') || '';
                const evt = new CustomEvent('api_key_update', { detail: {} }); // ensure provider inited
                window.dispatchEvent(evt);
                // provider listens only api_key_update; send explicit session_switch via ws if needed
                (window as any).__wsSend?.({ type: 'session_switch', prevSessionId: prev, nextSessionId: id, apiKey });
              } catch { /* ignore */ }
            }}
            onShowHistory={showHistory}
          />
        </main>
        <ToolsPanel />
      </div>
      {historyOpen && (
        <div className="fixed inset-0 z-[80]">
          <div
            className={`absolute inset-0 transition-opacity duration-200 ${historyShow ? 'opacity-100' : 'opacity-0'} bg-black/40`}
            onClick={() => { setHistoryShow(false); setTimeout(() => setHistoryOpen(false), 200); }}
          />
          <div
            className={`absolute w-80 max-h-[60vh] rounded-xl border border-white/40 bg-white/80 backdrop-blur p-3 overflow-y-auto transition duration-200 ${historyShow ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-1 scale-95'}`}
            style={{
              right: historyPos ? `${Math.max(8, window.innerWidth - historyPos.x)}px` : '24px',
              bottom: historyPos ? `${Math.max(8, window.innerHeight - historyPos.y) + 8}px` : '80px',
              top: historyPos ? 'auto' : 'auto'
            }}
          >
            <div className="text-sm font-semibold mb-2 text-slate-700">History</div>
            <div className="flex flex-col gap-1">
              {sessions.filter((s) => s.id !== sessionId).length === 0 ? (
                <div className="text-xs text-slate-500">No sessions</div>
              ) : sessions.filter((s) => s.id !== sessionId).map((s) => (
                <div key={s.id} className="group flex items-center justify-between gap-2 px-2 py-1 rounded hover:bg-slate-50">
                  <button
                    className="text-left text-xs text-slate-700 truncate flex-1"
                    onClick={async () => {
                      try {
                        const data = await getSession(s.id);
                        if (Array.isArray(data?.messages)) setMessages(data.messages as MessageParam[]);
                        localStorage.setItem('chat_session_id', s.id);
                        setSessionId(s.id);
                        setHistoryOpen(false);
                      } catch { /* ignore */ }
                    }}
                  >
                    {s.id}
                  </button>
                  <button
                    className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-600 text-xs"
                    onClick={async () => {
                      if (!confirm('Delete this session?')) return;
                      try {
                        await deleteSession(s.id);
                        setSessions((prev) => prev.filter((i) => i.id !== s.id));
                        // if current session deleted, switch to new one
                        if (sessionId === s.id) {
                          const key = 'chat_session_id';
                          const id = (crypto as any).randomUUID ? (crypto as any).randomUUID() : String(Date.now());
                          localStorage.setItem(key, id);
                          setSessionId(id);
                          setMessages([]);
                          void (async () => { try { await saveSession(id, []); } catch { /* ignore */ } })();
                        }
                      } catch { /* ignore */ }
                    }}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
    </ToolsProvider>
  );
}


