import { Router } from 'express';
import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, statSync, unlinkSync } from 'fs';
import { join } from 'path';
import { MEMORY_RETRIEVE_COLLECTION } from '../db/models/memory/consts';
import { findOne } from '../db/jsonDb';

const router = Router();
const rootDir = join(process.cwd(), 'sessions');

function ensureDir() {
  if (!existsSync(rootDir)) mkdirSync(rootDir, { recursive: true });
}

// GET /api/session/:id  -> returns JSON { messages: [...] }
router.get('/session/:id', (req, res) => {
  try {
    ensureDir();
    const id = String(req.params.id || '').trim();
    if (!id) return res.status(400).json({ error: 'id required' });
    const file = join(rootDir, `${id}.json`);
    if (!existsSync(file)) return res.json({ messages: [] });
    const json = JSON.parse(readFileSync(file, 'utf-8'));
    res.json(json);
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

// POST /api/session/:id  body: { messages: [...] }
router.post('/session/:id', (req, res) => {
  try {
    ensureDir();
    const id = String(req.params.id || '').trim();
    if (!id) return res.status(400).json({ error: 'id required' });
    const { messages } = (req.body || {}) as { messages?: unknown };
    const file = join(rootDir, `${id}.json`);
    writeFileSync(file, JSON.stringify({ messages }, null, 2), 'utf-8');
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

export default router;

// List all sessions
router.get('/sessions', (_req, res) => {
  try {
    ensureDir();
    const files = readdirSync(rootDir).filter((f) => f.endsWith('.json'));
    const items = files.map((f) => {
      const p = join(rootDir, f);
      const st = statSync(p);
      return {
        id: f.replace(/\.json$/, ''),
        mtime: st.mtime.toISOString(),
        size: st.size,
      };
    }).sort((a, b) => (a.mtime < b.mtime ? 1 : -1));
    res.json({ sessions: items });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

// Delete one session
router.delete('/session/:id', (req, res) => {
  try {
    ensureDir();
    const id = String(req.params.id || '').trim();
    if (!id) return res.status(400).json({ error: 'id required' });
    const file = join(rootDir, `${id}.json`);
    if (existsSync(file)) unlinkSync(file);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

// GET /api/memory/retrieve/:sessionId
router.get('/memory/retrieve/:sessionId', async (req, res) => {
  try {
    const sessionId = String(req.params.sessionId || '').trim();
    if (!sessionId) return res.status(400).json({ error: 'sessionId required' });
    const data = await findOne(MEMORY_RETRIEVE_COLLECTION, { sessionId });
    res.json({ data: data ?? null });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});


