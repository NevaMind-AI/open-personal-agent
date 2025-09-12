import express from 'express';
import cors from 'cors';
import { handleAgentStream } from './agentStream';
import { handleAnthropicSse } from './anthropicSse';

const app = express();
app.use(cors());

// Place streaming POST routes BEFORE body parsers to avoid consumed streams
app.post('/api/agent/stream', (req, res) => {
  console.log('[server] /api/agent/stream');
   
  handleAgentStream(req as any, res as any);
});

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
app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});
