import type { SDKUserMessage } from '@anthropic-ai/claude-code';
import { Options, query } from '@anthropic-ai/claude-code';
import type { MessageParam as APIUserMessage } from '@anthropic-ai/sdk/resources';
import { existsSync } from 'fs';
import { join } from 'path';

export async function handleAgentCode(input: { prompt?: string; session?: string; history?: { text: string }[] }) {
  try {
    const prompt = input.prompt ?? 'Hello';
    const session = input.session ?? undefined;
    const history = Array.isArray(input.history) ? input.history : [];

    const userDataCwd = join(process.cwd(), 'workspace');

    const claudeExecutable = process.env.CLAUDE_CODE_EXECUTABLE ?? join(
      process.cwd(),
      'node_modules',
      '.bin',
      process.platform === 'win32' ? 'claude.cmd' : 'claude'
    );

    const mcpScript = join(process.cwd(), 'scripts', 'mcp', 'local-tools-server.mjs');

    const options: Options = {
      maxTurns: 100,
      appendSystemPrompt: 'You are a professional frontend developer who produces and modifies code according to user needs.' +
        ' When creating a new project: use React + TypeScript + Vite, with the Element-plus UI library; follow React best practices and support mobile.' +
        ' When creating a new project: you will receive only a single input. After receiving it, fully understand the prompt and begin generating code.' +
        ' When creating a new project: first obtain the currently running task (via the get_has_running_task tool), retrieve the projectName from it, then create a new folder under the workspace root named after projectName as the project working directory.' +
        ' When creating a new project: after creating the working directory, generate a README.md in this directory that describes the project functionality and usage.' +
        " Then, based on the user's needs, generate a complete set of code in this directory. It must run correctly, have no lint errors, and meet the user's requirements." +
        ' After finishing, if using React, run npm run build to generate the dist directory. Note: after creating/modifying, do not auto-open any web pages.' +
        ' [Most important: after creating/modifying, call the save_application tool to save the Application information.]',
      cwd: userDataCwd,
      allowedTools: ['*'],
      ...(existsSync(mcpScript) ? {
        mcpServers: {
          local_tools: {
            type: 'stdio',
            command: 'node',
            args: [mcpScript],
          },
        },
      } : {}),
      pathToClaudeCodeExecutable: claudeExecutable,
      continue: true,
      ...(session ? {
        resume: session,
      } : {}),
      model: 'claude-4-sonnet-20250514',
      permissionMode: 'bypassPermissions',
      stderr: (s) => console.error('[claude-code]', s),
    };

    // Build prompt as AsyncIterable: replay history user turns then current prompt
    async function* buildPrompt(sessionId: string): AsyncGenerator<SDKUserMessage, void> {
      for (const h of history) {
        if (!h || typeof h.text !== 'string' || h.text.trim() === '') continue;
        const msg: SDKUserMessage = {
          type: 'user',
          message: { role: 'user', content: [{ type: 'text', text: h.text }] } as unknown as APIUserMessage,
          parent_tool_use_id: null,
          session_id: sessionId,
        };
        yield msg;
      }
      const finalMsg: SDKUserMessage = {
        type: 'user',
        message: { role: 'user', content: [{ type: 'text', text: prompt }] } as unknown as APIUserMessage,
        parent_tool_use_id: null,
        session_id: sessionId,
      };
      yield finalMsg;
    }

    try {
      const useStream = Boolean(session) && history.length > 0;
      const input = useStream ? buildPrompt(session as string) : prompt;
      console.log('[handleAgentCode] input', input, options);
      for await (const event of query({ prompt: input, options })) {
        try {
          console.log('[handleAgentCode] event', event);
        } catch (err) {
          console.error('[handleAgentCode] error', err);
          // ignore write error
        }
      }

      console.log('[handleAgentCode] end');
    } catch (err) {
      console.error('[handleAgentCode] error', err);
      // swallow errors to keep contract: only query events
    }
  } catch (err) {
    console.error('[handleAgentCode] error', err);
    // swallow errors to keep contract: only query events
  }
}


