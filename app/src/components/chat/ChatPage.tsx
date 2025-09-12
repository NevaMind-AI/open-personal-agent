import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { streamAnthropic, type ChatMessage } from '../../api/client';
import { MessageList } from './MessageList.tsx';
import { ChatInput } from './ChatInput.tsx';
import { ToolsPanel, ToolsDrawer } from './ToolsPanel.tsx';

export function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  // 辅助：确保尾部存在 assistant 消息且 content 为数组
  const ensureAssistantArray = useCallback(() => {
    setMessages((prev) => {
      const next = [...prev];
      if (next.length === 0 || next[next.length - 1].role !== 'assistant') {
        next.push({ role: 'assistant', content: [] as any[] } as any);
      } else if (!Array.isArray((next[next.length - 1] as any).content)) {
        (next[next.length - 1] as any).content = [];
      }
      return next;
    });
  }, []);
  const listRef = useRef<HTMLDivElement | null>(null);
  const textSnapshotRef = useRef<string>('');

  const canSend = useMemo(() => !loading, [loading]);

  const appendAssistantChunk = useCallback((chunk: string) => {
    setMessages((prev) => {
      const next = [...prev];
      if (next.length === 0 || next[next.length - 1].role !== 'assistant') {
        next.push({ role: 'assistant', content: [{ type: 'text', text: chunk }] as any[] } as any);
        return next;
      }
      const last = next[next.length - 1] as any;
      if (!Array.isArray(last.content)) last.content = [];
      const items = last.content as any[];
      if (items.length === 0 || items[items.length - 1].type !== 'text') {
        items.push({ type: 'text', text: '' });
      }
      items[items.length - 1].text += chunk;
      return next;
    });
  }, []);

  const send = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setMessages((prev) => [...prev, { role: 'user', content: trimmed }]);
    setLoading(true);
    try {
      // 预创建一个空的 assistant 气泡作为承载容器
      ensureAssistantArray();
      await streamAnthropic(
        [...messages, { role: 'user', content: trimmed }],
        undefined,
        (chunk) => {
          console.debug('[onText] chunk', { len: chunk.length, head: chunk.slice(0, 40) });
          // 兼容 SDK 文本流可能为 snapshot 或 delta：
          // 若 chunk 以现有文本开头，则视为 snapshot，直接覆盖；否则按 delta 追加。
          setMessages((prev) => {
            const next = [...prev];
            if (next.length === 0 || next[next.length - 1].role !== 'assistant') return next;
            const last = next[next.length - 1] as any;
            if (!Array.isArray(last.content)) last.content = [{ type: 'text', text: '' }];
            const items = last.content as any[];
            if (items.length === 0 || items[items.length - 1].type !== 'text') items.push({ type: 'text', text: '' });
            const prevText: string = items[items.length - 1].text || '';
            // React StrictMode 会双调用 updater；若已包含本次 chunk，直接跳过
            if (prevText === chunk || (prevText && prevText.endsWith(chunk))) {
              console.debug('[onText] skip-duplicate', { prevLen: prevText.length, chunkLen: chunk.length });
              return next;
            }
            const isSnapshot = chunk.startsWith(prevText);
            items[items.length - 1].text = isSnapshot ? chunk : prevText + chunk;
            console.debug('[onText] merge', { prevLen: prevText.length, isSnapshot, newLen: items[items.length - 1].text.length });
            textSnapshotRef.current = items[items.length - 1].text;
            return next;
          });
        },
        (name, payload) => {
          if (name === 'message_stop') console.log('[Chat] stop');
          if (name === 'error') console.error('[Chat] error', payload);
        },
        (ev) => {
          console.debug('[onAssistantBlock]', ev);
          if (ev.type === 'block_start') {
            ensureAssistantArray();
            setMessages((prev) => {
              const next = [...prev];
              const last = next[next.length - 1] as any;
              if (!Array.isArray(last.content)) last.content = [];
              if (ev.block.kind === 'text') {
                (last.content as any[]).push({ type: 'text', text: '' });
              } else {
                (last.content as any[]).push({ type: 'tool_use', id: ev.block.id, name: ev.block.name, input: ev.block.input });
              }
              console.debug('[block_start] items', (last.content as any[]).length);
              return next;
            });
          } else if (ev.type === 'block_delta') {
            setMessages((prev) => {
              const next = [...prev];
              if (next.length === 0) return next;
              const last = next[next.length - 1] as any;
              if (!Array.isArray(last.content) || (last.content as any[]).length === 0) return next;
              const items = last.content as any[];
              const tail = items[items.length - 1];
              if (ev.delta.kind === 'text' && ev.delta.text) {
                if (tail && tail.type === 'text') tail.text += ev.delta.text;
              } else if (ev.delta.kind === 'tool_use') {
                if (tail && tail.type === 'tool_use') {
                  if (ev.delta.output !== undefined) {
                    tail.output = ev.delta.output;
                  }
                  tail.input = ev.delta.input || {};
                }
              }
              console.debug('[block_delta] updated tail', { kind: tail?.type, textLen: tail?.type === 'text' ? tail.text.length : undefined, hasOutput: tail?.type === 'tool_use' ? Boolean(tail.output) : undefined });
              return next;
            });
          }
        },
      );
    } catch (e) {
      appendAssistantChunk(`\n[Error] ${(e as Error).message}`);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appendAssistantChunk, loading, messages]);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, loading]);

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-slate-50 to-white text-slate-900">
      <header className="sticky top-0 backdrop-blur-md bg-white/75 border-b border-slate-200" style={{ zIndex: 'var(--z-header)' }}>
        <div className="max-w-none w-full mx-0 px-4 py-3 flex items-center gap-3 relative">
          <div className="text-base font-semibold">Open Macaron</div>
          <ToolsDrawer />
        </div>
      </header>

      <div className="flex-1 min-h-0 flex">
        <main className="w-full max-w-none m-0 p-4 flex flex-col gap-3 flex-1 min-h-0">
          <MessageList ref={listRef} messages={messages} loading={loading} />

          <ChatInput
            disabled={!canSend}
            onSend={send}
            onNewChat={() => setMessages([])}
          />
        </main>
        <ToolsPanel />
      </div>
    </div>
  );
}


