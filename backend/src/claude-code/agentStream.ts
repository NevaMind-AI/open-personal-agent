import type { SDKUserMessage } from '@anthropic-ai/claude-code';
import { createSdkMcpServer, Options, query } from '@anthropic-ai/claude-code';
import type { MessageParam as APIUserMessage } from '@anthropic-ai/sdk/resources';
import { join } from 'path';
import { codeToolDefinitions } from '../utils/toolBase';

export type AgentStreamParams = {
  prompt?: string;
  session?: string;
  history?: { text: string }[];
};

const mcpServers = createSdkMcpServer({
  name: 'local_tools',
  version: '1.0.0',
  tools: codeToolDefinitions,
});

function buildOptions(base: AgentStreamParams): Options {
  const { session } = base;
  const userDataCwd = join(process.cwd(), 'workspace');
  const claudeExecutable = process.env.CLAUDE_CODE_EXECUTABLE ?? join(
    process.cwd(),
    'node_modules',
    '.bin',
    process.platform === 'win32' ? 'claude.cmd' : 'claude'
  );

  const options: Options = {
    maxTurns: 100,
    appendSystemPrompt:
      '你是一名专业的前端开发者，会根据用户的需求生产、修改代码。' +
      '当你新建项目时：技术栈为React+TypScript+Vite结构，使用Element-plus UI库，代码写法符合React开发规范，适配移动端。' +
      '当你新建项目时：你只会获得一次输入，因此在获得这次输入之后，你需要完全理解输入prompt的含义，并且开始生成代码。' +
      '当你新建项目时：你需要先获取当前正在运行的任务（通过工具get_has_running_task），从正在运行的任务信息获取projectName，然后使用projectName作为名称，在总工作目录下生成一个新文件夹，作为该项目的工作目录。' +
      '当你新建项目时：创建完工作路径之后，你应该在这个目录下生成一个README.md文件，描述这个项目的功能和使用方法。' +
      '然后，根据用户的需求，在这个目录下生成完整的一套代码。它必须能够正常运行，无lint错误，并且符合用户的需求。' +
      '生成完毕之后，调用npm run build，生成dist目录。',
    cwd: userDataCwd,
    allowedTools: ['*'],
    mcpServers: {
      'local_tools': mcpServers,
    },
    pathToClaudeCodeExecutable: claudeExecutable,
    continue: true,
    ...(session ? { resume: session } : {}),
    model: 'claude-4-sonnet-20250514',
    permissionMode: 'bypassPermissions',
    stderr: (s) => console.error('[claude-code]', s),
  };
  return options;
}

async function* buildPrompt(
  history: { text: string }[],
  finalText: string,
  sessionId: string
): AsyncGenerator<SDKUserMessage, void> {
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
