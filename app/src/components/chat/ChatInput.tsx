import { useState, useCallback } from 'react';

export function ChatInput(props: {
  disabled?: boolean
  onSend: (text: string) => void
  onNewChat: () => void
}) {
  const { disabled, onSend, onNewChat } = props;
  const [input, setInput] = useState('');

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text || disabled) return;
    onSend(text);
    setInput('');
  }, [disabled, input, onSend]);

  return (
    <div className="sticky bottom-0">
      <div className="w-full mx-0 flex gap-2">
        <textarea
          className="flex-1 border border-slate-200 bg-white rounded-xl px-3 py-2 resize-none min-h-11 max-h-52 outline-none"
          value={input}
          placeholder="Send a message"
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <button className="bg-sky-500 text-white rounded-lg px-3 min-w-20 disabled:opacity-50" disabled={disabled || !input.trim()} onClick={handleSend}>Send</button>
      </div>
      <div className="flex items-center justify-between mt-1 text-xs text-slate-500">
        <div>Enter to send • Shift+Enter for new line</div>
        <button className="text-sky-500" onClick={onNewChat}>New chat</button>
      </div>
    </div>
  );
}


