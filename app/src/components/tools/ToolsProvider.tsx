import { useCallback, useEffect, useMemo, useRef, useState, type PropsWithChildren } from 'react';
import { ToolsCtx, type ToolsContextValue, type WsMsg } from './toolsCtx.ts';

export default function ToolsProvider(props: PropsWithChildren) {
  const { children } = props;
  const [connected, setConnected] = useState(false);
  const [history, setHistory] = useState<WsMsg[]>([]);
  const [input, setInput] = useState('{"ping":"hello"}');
  const wsRef = useRef<WebSocket | null>(null);

  const wsUrl = useMemo(() => `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws/chat`, []);

  const push = useCallback((dir: 'in' | 'out', data: unknown) => {
    setHistory((prev) => [{ dir, data, at: new Date().toISOString() }, ...prev].slice(0, 100));
  }, []);

  const connect = useCallback(() => {
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) return;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;
    ws.onopen = () => { setConnected(true); };
    ws.onmessage = (ev) => {
      try { push('in', JSON.parse(ev.data as string)); } catch { push('in', String(ev.data)); }
    };
    ws.onclose = () => { setConnected(false); };
    ws.onerror = () => { /* ignore */ };
  }, [push, wsUrl]);

  const disconnect = useCallback(() => {
    try { wsRef.current?.close(); } catch { /* ignore */ }
    wsRef.current = null;
  }, []);

  const send = useCallback(() => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    let payload: unknown = input;
    try { payload = JSON.parse(input); } catch { /* keep as string */ }
    ws.send(typeof payload === 'string' ? payload : JSON.stringify(payload));
    push('out', payload);
  }, [input, push]);

  useEffect(() => () => { try { wsRef.current?.close(); } catch { /* ignore */ } }, []);

  const value: ToolsContextValue = useMemo(() => ({ connected, history, input, setInput, connect, disconnect, send }), [connected, history, input, connect, disconnect, send]);

  return <ToolsCtx.Provider value={value}>{children}</ToolsCtx.Provider>;
}

// no hooks export here to satisfy fast-refresh guideline (only default component export)


