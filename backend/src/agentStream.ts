import type { IncomingMessage, ServerResponse } from 'http';
import { join } from 'path';
import { existsSync } from 'fs';
import { Options, query } from '@anthropic-ai/claude-code';
import type { MessageParam as APIUserMessage } from '@anthropic-ai/sdk/resources';
import type { SDKUserMessage } from '@anthropic-ai/claude-code';

function encodeSseEvent(event: string, data: string): string {
  return `event: ${event}\ndata: ${data}\n\n`;
}

export async function handleAgentStream(req: IncomingMessage, res: ServerResponse) {
  try {
    if ((req as any).method !== 'POST') {
      res.statusCode = 405;
      res.setHeader('Allow', 'POST');
      (res as any).end('Method Not Allowed');
      return;
    }

    const body = await new Promise<string>((resolve, reject) => {
      let data = '';
      (req as any).on('data', (chunk: any) => { data += chunk; });
      (req as any).on('end', () => resolve(data));
      (req as any).on('error', reject);
    });

    let parsed: { prompt?: string; session?: string; history?: { text: string }[] } = {};
    try { parsed = body ? JSON.parse(body) : {}; } catch { /* ignore */ }
    const prompt = parsed.prompt ?? 'Hello';
    const session = parsed.session ?? undefined;
    const history = Array.isArray(parsed.history) ? parsed.history : [];

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
      allowedTools: [
        '*'
      ],
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
      ...(session ? {
        resume: session
      } : {}),
      model: 'claude-4-sonnet-20250514',
      permissionMode: 'bypassPermissions',
      stderr: (s) => console.error('[claude-code]', s),
    };

    (res as any).writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

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
      for await (const event of query({ prompt: input, options })) {
        try {
          (res as any).write(encodeSseEvent('event', JSON.stringify(event)));
        } catch {
          // ignore write error
        }
      }
    } catch {
      // swallow errors to keep contract: only query events
    } finally {
      try { (res as any).end(); } catch { /* ignore */ }
    }
  } catch {
    try { (res as any).statusCode = 500; (res as any).end('Internal Error'); } catch { /* ignore */ }
  }
}


