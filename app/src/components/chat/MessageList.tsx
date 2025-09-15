import { forwardRef } from 'react';
// import { MessageBubble } from './MessageBubble.tsx'
import type { ContentBlockParam, MessageParam } from '@anthropic-ai/sdk/resources/index.mjs';
import { AssistantBubble } from './AssistantBubble.tsx';
import { UserBubble } from './UserBubble.tsx';
import { ToolResultBubble } from './ToolResultBubble.tsx';

export const MessageList = forwardRef<HTMLDivElement, {
  messages: MessageParam[]
  loading: boolean
}>(function MessageList(props, ref) {
  const { messages, loading } = props;

  function judgeRenderUserOrToolResult(m: MessageParam): React.ReactNode {
    if (Array.isArray(m.content)) {
      return <ToolResultBubble content={m.content as Array<ContentBlockParam>} />;
    }
    return <UserBubble content={m.content as string} />;
  }
  
  function judgeRenderLeftOrRight(m: MessageParam): 'left' | 'right' {
    if (m.role === 'user') {
      if (Array.isArray(m.content)) {
        return 'left';
      }
      return 'right';
    } else {
      return 'left';
    }
  }

  return (
    <div ref={ref} className="flex-1 min-h-0 border border-slate-200 rounded-xl bg-white p-4 overflow-y-auto shadow-sm">
      {messages.length === 0 ? (
        <div className="text-slate-400">Start chatting with Claude…</div>
      ) : (
        messages.map((m, idx) => (
          <div key={idx} className="flex my-3">
            <div className={`flex-1 flex ${judgeRenderLeftOrRight(m) === 'right' ? 'justify-end' : ''}`}>
              <div className='w-full'>
                {/* <div className={`text-[11px] text-slate-500 mb-1 ${judgeRenderLeftOrRight(m) === 'right' ? 'text-right' : ''}`}>{m.role}</div> */}
                {m.role === 'user' ? (
                  judgeRenderUserOrToolResult(m)
                ) : (
                  <AssistantBubble content={m.content as Array<ContentBlockParam>} />
                )}
              </div>
            </div>
          </div>
        ))
      )}
      {loading && (
        <div className="flex my-2">
          <div className="w-full">
            <div className="inline-flex items-center gap-2 px-2 py-1">
              <span className="sr-only">Generating…</span>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2.5 h-2.5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2.5 h-2.5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});


