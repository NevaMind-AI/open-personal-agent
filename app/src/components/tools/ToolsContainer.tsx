import { useTools } from './toolsCtx';

export function ToolsContainer() {
  const { connected, history, input, setInput, connect, disconnect, send } = useTools();

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-semibold">Tools</div>
        <div className="text-xs text-slate-500">WS: {connected ? 'connected' : 'disconnected'}</div>
      </div>

      <div className="flex gap-2 mb-2">
        {connected ? (
          <button className="text-red-500 text-sm" onClick={disconnect}>Disconnect</button>
        ) : (
          <button className="text-sky-600 text-sm" onClick={connect}>Connect</button>
        )}
      </div>

      <div className="flex gap-2 mb-3">
        <input
          className="flex-1 border border-slate-200 rounded-md px-2 py-1 text-sm"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder='{"ping":"hello"}'
        />
        <button className="bg-sky-500 text-white rounded-md px-3 text-sm disabled:opacity-50" disabled={!connected} onClick={send}>Send</button>
      </div>

      <div className="text-xs text-slate-500 mb-1">Recent</div>
      <div className="border border-slate-200 rounded-md p-2 max-h-64 overflow-auto text-xs">
        {history.length === 0 ? (
          <div className="text-slate-400">No messages</div>
        ) : (
          history.map((m: any, i: number) => (
            <div key={i} className="mb-2">
              <div className="text-[10px] text-slate-400 mb-0.5">{m.at} · {m.dir}</div>
              <pre className="whitespace-pre-wrap break-words">{typeof m.data === 'string' ? m.data : JSON.stringify(m.data, null, 2)}</pre>
            </div>
          ))
        )}
      </div>
    </div>
  );
}


