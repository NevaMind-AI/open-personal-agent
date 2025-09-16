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
      appendSystemPrompt: '你是一名专业的前端开发者，会根据用户的需求生产、修改代码。' +
        '当你新建项目时：技术栈为React+TypScript+Vite结构，使用Element-plus UI库，代码写法符合React开发规范，适配移动端。' +
        '当你新建项目时：你只会获得一次输入，因此在获得这次输入之后，你需要完全理解输入prompt的含义，并且开始生成代码。' +
        '当你新建项目时：你需要先获取当前正在运行的任务（通过工具get_has_running_task），从正在运行的任务信息获取projectName，然后使用projectName作为名称，在总工作目录下生成一个新文件夹，作为该项目的工作目录。' +
        '当你新建项目时：创建完工作路径之后，你应该在这个目录下生成一个README.md文件，描述这个项目的功能和使用方法。' +
        '然后，根据用户的需求，在这个目录下生成完整的一套代码。它必须能够正常运行，无lint错误，并且符合用户的需求。' +
        '生成完毕之后，调用npm run build，生成dist目录，然后调用save_application工具保存Application信息。',
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


