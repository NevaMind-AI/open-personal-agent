import { Router } from 'express';
import { handleAgentCode } from '../claude-code/agentStream';
import { callClaudeCodeDefine, callClaudeCodeExec, CallClaudeCodeInput } from '../utils/tools/callClaudeCode';
import { saveApplicationDefine, saveApplicationExec } from '../utils/tools/saveApplication';
import { getHasRunningTaskDefine, getHasRunningTaskExec } from '../utils/tools/getHasRunningTask';

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

router.post('/agent-code/mcp-proxy', async (req, res) => {
  try {
    const { type, data } = req.body;
    switch (type) {
      case callClaudeCodeDefine.name: {
        const result = await callClaudeCodeExec(data as CallClaudeCodeInput);
        res.status(200).json(result);
        break;
      }
      case saveApplicationDefine.name: {
        const result = await saveApplicationExec();
        res.status(200).json(result);
        break;
      }
      case getHasRunningTaskDefine.name: {
        const result = await getHasRunningTaskExec();
        res.status(200).json(result);
        break;
      }
    }
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});


export default router;


