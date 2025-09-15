import { join } from 'path';
import { existsSync } from 'fs';
import { Options, query } from '@anthropic-ai/claude-code';
import type { MessageParam as APIUserMessage } from '@anthropic-ai/sdk/resources';
import type { SDKUserMessage } from '@anthropic-ai/claude-code';

export type AgentStreamParams = {
  prompt?: string;
  session?: string;
  history?: { text: string }[];
};

function buildOptions(base: AgentStreamParams): Options {
  const { session } = base;
  const userDataCwd = join(process.cwd(), 'user_data');
  const claudeExecutable = process.env.CLAUDE_CODE_EXECUTABLE ?? join(
    process.cwd(),
    'node_modules',
    '.bin',
    process.platform === 'win32' ? 'claude.cmd' : 'claude'
  );
  const mcpScript = join(process.cwd(), 'scripts', 'mcp', 'set-active-tab-server.mjs');

  const options: Options = {
    maxTurns: 100,
    appendSystemPrompt: '你是一名专业的开发者，请根据用户的需求生成代码。代码为React+TypScript+Vite结构，使用Element-plus UI库，代码写法符合React开发规范。当用户需要你构建一个工具/应用时，你需要引导用户告诉你他的准确诉求。当你判断用户的描述足够支撑你开发一个功能完备的应用时，你应该主动询问用户是否开始创建项目。得到用户的同意后，你将在你的工作目录下的default_user目录生成一个新文件夹，作为该项目的工作目录，名称由你根据用户的需求生成。创建完毕之后，你应该在这个目录下生成一个README.md文件，描述这个项目的功能和使用方法。然后，根据用户的需求，在这个目录下生成完整的一套代码。生成完毕之后，调用npm run build，生成dist目录。',
    cwd: userDataCwd,
    allowedTools: ['*'],
    ...(existsSync(mcpScript) ? {
      mcpServers: {
        ui: {
          type: 'stdio',
          command: 'node',
          args: [mcpScript],
        },
      },
    } : {}),
    pathToClaudeCodeExecutable: claudeExecutable,
    continue: true,
    ...(session ? { resume: session } : {}),
    model: 'claude-4-sonnet-20250514',
    permissionMode: 'bypassPermissions',
    stderr: (s) => console.error('[claude-code]', s),
  };
  return options;
}

async function* buildPrompt(history: { text: string }[], finalText: string, sessionId: string): AsyncGenerator<SDKUserMessage, void> {
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
    message: { role: 'user', content: [{ type: 'text', text: finalText }] } as unknown as APIUserMessage,
    parent_tool_use_id: null,
    session_id: sessionId,
  };
  yield finalMsg;
}

// Node 可直接调用的异步生成器：按原逻辑产出 query 事件
export async function* agentStream(params: AgentStreamParams): AsyncGenerator<unknown, void> {
  const prompt = params.prompt ?? 'Hello';
  const session = params.session ?? undefined;
  const history = Array.isArray(params.history) ? params.history : [];
  const options = buildOptions(params);

  try {
    const useStream = Boolean(session) && history.length > 0;
    const input = useStream ? buildPrompt(history, prompt, session as string) : prompt;
    for await (const event of query({ prompt: input, options })) {
      yield event;
    }
  } catch {
    // 保持行为：静默错误，调用方自行处理
  }
}
