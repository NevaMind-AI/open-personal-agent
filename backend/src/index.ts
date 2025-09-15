import express from 'express';
import cors from 'cors';
import { handleAnthropicSse } from './anthropicSse';
import type { Server } from 'http';
import { createServer } from 'http';
import { attachWs } from './wsServer';

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


const PORT = process.env.PORT || 5174;
const server: Server = createServer(app);
attachWs(server);
server.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});
