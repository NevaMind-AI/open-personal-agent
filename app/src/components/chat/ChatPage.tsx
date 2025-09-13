import type { ContentBlockParam, InputJSONDelta, MessageParam, RawContentBlockDelta, TextBlockParam, TextDelta, ToolUseBlockParam } from '@anthropic-ai/sdk/resources/index.mjs';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { streamAnthropic } from '../../api/client';
import { ChatInput } from './ChatInput.tsx';
import { MessageList } from './MessageList.tsx';
import { ToolsDrawer, ToolsPanel } from './ToolsPanel.tsx';

export function ChatPage() {
  const [messages, setMessages] = useState<MessageParam[]>([]);
  const [loading, setLoading] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);

  const canSend = useMemo(() => !loading, [loading]);

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
          lastBlock.input = JSON.parse(lastBlock.input as string);
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


