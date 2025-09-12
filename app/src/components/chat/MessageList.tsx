import { forwardRef } from 'react';
import type { ChatMessage } from '../../api/client';
// import { MessageBubble } from './MessageBubble.tsx'
import { UserBubble } from './UserBubble.tsx';
import { AssistantBubble } from './AssistantBubble.tsx';

export const MessageList = forwardRef<HTMLDivElement, {
  messages: ChatMessage[]
  loading: boolean
}>(function MessageList(props, ref) {
  const { messages, loading } = props;
  return (
    <div ref={ref} className="flex-1 min-h-0 border border-slate-200 rounded-xl bg-white p-4 overflow-y-auto shadow-sm">
      {messages.length === 0 ? (
        <div className="text-slate-400">Start chatting with Claude…</div>
      ) : (
        messages.map((m, idx) => (
          <div key={idx} className="flex my-3">
            <div className={`flex-1 flex ${m.role === 'user' ? 'justify-end' : ''}`}>
              <div className='w-full'>
                <div className={`text-[11px] text-slate-500 mb-1 ${m.role === 'user' ? 'text-right' : ''}`}>{m.role}</div>
                {m.role === 'user' ? (
                  <UserBubble content={m.content as string} />
                ) : (
                  <AssistantBubble content={m.content as any} />
                )}
              </div>
            </div>
          </div>
        ))
      )}
      {loading && (
        <div className="flex my-2">
          <div className="max-w-[70%]"><div className="rounded-2xl rounded-bl-sm bg-slate-100 text-slate-900 px-3 py-2 shadow">Generating…</div></div>
        </div>
      )}
    </div>
  );
});


