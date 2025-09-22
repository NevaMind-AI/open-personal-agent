import { useCallback, useEffect, useMemo, useRef, useState, type PropsWithChildren } from 'react';
import { ToolsCtx, type ToolsContextValue, type WsMsg } from './toolsCtx.ts';
import { LS_MEMU_API_KEY } from '../consts.ts';

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
    ws.onopen = () => {
      setConnected(true);
      try {
        const sessionId = localStorage.getItem('chat_session_id') || '';
        const apiKey = localStorage.getItem(LS_MEMU_API_KEY) || '';
        ws.send(JSON.stringify({ type: 'handshake', sessionId, apiKey }));
      } catch { /* ignore */ }
    };
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

  useEffect(() => {
    // auto-connect on mount
    connect();
    return () => { try { wsRef.current?.close(); } catch { /* ignore */ } };
  }, [connect]);

  // listen api key updates from UI
  useEffect(() => {
    const onKeyUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail || {};
      const apiKey = typeof detail.apiKey === 'string' ? detail.apiKey : (localStorage.getItem(LS_MEMU_API_KEY) || '');
      const sessionId = localStorage.getItem('chat_session_id') || '';
      const ws = wsRef.current;
      if (ws && ws.readyState === WebSocket.OPEN) {
        try { ws.send(JSON.stringify({ type: 'api_key_update', sessionId, apiKey })); } catch { /* ignore */ }
      }
    };
    window.addEventListener('api_key_update', onKeyUpdate as EventListener);
    return () => window.removeEventListener('api_key_update', onKeyUpdate as EventListener);
  }, []);

  const value: ToolsContextValue = useMemo(() => ({ connected, history, input, setInput, connect, disconnect, send }), [connected, history, input, connect, disconnect, send]);

  return <ToolsCtx.Provider value={value}>{children}</ToolsCtx.Provider>;
}

// no hooks export here to satisfy fast-refresh guideline (only default component export)


