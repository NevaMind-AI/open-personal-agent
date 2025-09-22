import type { Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { taskPool } from '../core/taskPool';
import { startOrContinuePolling } from '../services/summaryPoller';

let wssRef: WebSocketServer | null = null;

export function attachWs(server: HttpServer) {
  const wss = new WebSocketServer({ server, path: '/ws/chat' });
  wssRef = wss;

  wss.on('connection', (ws: WebSocket) => {
    ws.send(JSON.stringify({ type: 'hello', time: new Date().toISOString() }));

    ws.on('message', (data, isBinary) => {
      // echo basic message back with timestamp; payload is expected JSON
      try {
        console.log('message', data);
        const text = isBinary ? data.toString() : String(data);
        const payload = JSON.parse(text);
        if (payload?.type === 'handshake') {
          const sessionId = String(payload.sessionId || '').trim();
          const apiKey = String(payload.apiKey || '');
          const task = taskPool.upsert(sessionId, apiKey);
          if (task) startOrContinuePolling(task.sessionId, task.apiKey, task.abort);
          ws.send(JSON.stringify({ type: 'handshake_ack', at: new Date().toISOString(), accepted: Boolean(task) }));
          return;
        }
        if (payload?.type === 'api_key_update') {
          const sessionId = String(payload.sessionId || '').trim();
          const apiKey = String(payload.apiKey || '');
          const task = taskPool.upsert(sessionId, apiKey);
          if (task) startOrContinuePolling(task.sessionId, task.apiKey, task.abort);
          ws.send(JSON.stringify({ type: 'api_key_update_ack', at: new Date().toISOString(), accepted: Boolean(task) }));
          return;
        }
        ws.send(JSON.stringify({ type: 'ack', at: new Date().toISOString(), payload }));
      } catch (e) {
        ws.send(JSON.stringify({ type: 'error', message: (e as Error).message }));
      }
    });

    ws.on('close', () => {
      // no-op
    });
  });

  return wss;
}

export function broadcast(data: unknown): number {
  const wss = wssRef;
  if (!wss) return 0;
  const payload = typeof data === 'string' ? data : JSON.stringify(data);
  let count = 0;
  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) {
      try { client.send(payload); count += 1; } catch { /* ignore */ }
    }
  }
  return count;
}


