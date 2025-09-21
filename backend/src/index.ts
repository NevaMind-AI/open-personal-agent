import express from 'express';
import cors from 'cors';
import { handleAnthropicSse } from './api/anthropicSse';
import type { Server } from 'http';
import { createServer } from 'http';
import { attachWs } from './ws/wsServer';
import { join } from 'path';
import applicationRouter from './api/application';
import agentCodeRouter from './api/agentCode';
import sessionRouter from './api/session';

const app = express();
app.use(cors());

// Place streaming POST routes BEFORE body parsers to avoid consumed streams

app.post('/api/anthropic/stream', (req, res) => {
  console.log('[server] /api/anthropic/stream');
   
  handleAnthropicSse(req as any, res as any);
});

// JSON parser for non-stream routes
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.use('/api', applicationRouter);
app.use('/api', agentCodeRouter);
app.use('/api', sessionRouter);

// static serve workspace outputs
app.use('/workspace', express.static(join(process.cwd(), 'workspace')));


const PORT = process.env.PORT || 5174;
const server: Server = createServer(app);
attachWs(server);
server.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});
