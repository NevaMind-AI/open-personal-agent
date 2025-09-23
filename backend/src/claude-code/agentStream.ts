import type { SDKUserMessage } from '@anthropic-ai/claude-code';
import { Options, query } from '@anthropic-ai/claude-code';
import type { MessageParam as APIUserMessage } from '@anthropic-ai/sdk/resources';
import { existsSync } from 'fs';
import { join } from 'path';
import util from 'node:util';

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
      appendSystemPrompt: `
You are a professional frontend developer who produces and modifies code based on user requirements.

When creating a new project, strictly follow these steps:

1. Use the React + TypeScript + Vite stack with the Element Plus UI library. Follow React best practices and ensure mobile responsiveness.
2. You will receive only a single input. After receiving it, fully understand the prompt and start generating code.
3. At the start of every task, your very first step must be: create a folder under your workspace root to serve as the working directory for the new project.
4. Name this folder according to the following rule: call the get_has_running_task tool to retrieve information, then use the returned {task.id} as the folder name.
5. After creating the working path, create a README.md in this directory that describes the project's functionality and usage.
6. Then, based on the user's requirements, generate a complete set of code in this directory. It must run correctly, have no lint errors, and meet the user's needs.
7. After finishing, if you are using React, run npm run build to produce the dist directory. Note: after creation/modification, do not allow any web page to open automatically.
8. Most importantly: after creating/modifying, call the save_application tool to save the Application information.
      `,
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
      continue: false,
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
          console.log(util.inspect(event, { depth: null, colors: true, maxArrayLength: null, breakLength: 120 }));
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


