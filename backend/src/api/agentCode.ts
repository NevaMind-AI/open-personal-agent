import { Router } from 'express';
import { handleAgentCode } from '../claude-code/agentStream';

const router = Router();

// POST /api/agent-code/test
// body: { prompt?: string; session?: string; history?: { text: string }[] }
// Triggers handleAgentCode in background and returns immediately
router.post('/agent-code/test', async (req, res) => {
  try {
    const { prompt, session, history } = req.body || {};
    void handleAgentCode({ prompt, session, history });
    res.status(202).json({ queued: true });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

export default router;


