import Anthropic from '@anthropic-ai/sdk';
import { MessageStream } from '@anthropic-ai/sdk/lib/MessageStream';
import type { MessageParam, Messages, ToolResultBlockParam } from '@anthropic-ai/sdk/resources/messages';
import type { IncomingMessage, ServerResponse } from 'http';
import { PendingToolUse } from './types';
import { broadcast } from './wsServer';
import { executeTool, toolDefinitions } from './utils/toolBase';

function encodeSseEvent(event: string, data: string): string {
  return `event: ${event}\ndata: ${data}\n\n`;
}

export async function handleAnthropicSse(req: IncomingMessage, res: ServerResponse) {
  try {
    if (req.method !== 'POST') {
      res.statusCode = 405;
      res.setHeader('Allow', 'POST');
      res.end('Method Not Allowed');
      return;
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      res.statusCode = 500;
      (res as any).end('ANTHROPIC_API_KEY is not set');
      return;
    }

    const body = await new Promise<string>((resolve, reject) => {
      let data = '';
      req.on('data', (chunk: Buffer) => { data += chunk.toString(); });
      req.on('end', () => resolve(data));
      req.on('error', reject);
    });

    console.log('[anthropicSse] raw body length', body.length);
    let parsed: {
      prompt?: string
      messages?: Array<MessageParam>
      model?: string
      max_tokens?: number
      temperature?: number
    } = {};

    try { parsed = body ? JSON.parse(body) : {}; } catch { /* ignore */ }

    const model = parsed.model || 'claude-4-sonnet-20250514';
    const maxTokens = typeof parsed.max_tokens === 'number' ? parsed.max_tokens : 1024;
    const temperature = typeof parsed.temperature === 'number' ? parsed.temperature : 0.7;
    // const system = "你是一个态度温和、善解人意的助手，同时，你也具备敏锐与高超的产品思维。" +
    //   "在与用户的聊天过程中，你总是能发现用户的生活中存在些许不便。" +
    //   "当你察觉这些时，你会得出一个产品的基础形态。" +
    //   "在与用户聊天的过程中，你会巧妙地通过用户得到信息，不断地完善你的产品逻辑与思路。" +
    //   "当你判断你获得的信息已经足够支持一个完整的产品时，你会告诉用户，你帮助TA设计了一款应用，然后询问用户是否创建这个应用。" +
    //   "得到用户的确认后，你会总结一段prompt，交付给Claude Code，让它去生成这个产品的代码。" +
    //   "需要注意的是，你不会将这段prompt直接告诉用户。" +
    //   "你与Claude Code的交互是通过Tools调用的方式进行的、仅有一次提交的机会，因此务必确保你提交的prompt是完整的、正确的。" +
    //   "你与用户的聊天过程中，除非用户主动要求，不然你不会主动提及代码、工具、工具调用等与编程相关的内容。";
    const system = '';

    console.log('[anthropicSse] parsed', parsed);
    let messages: Array<MessageParam> = Array.isArray(parsed.messages) ? parsed.messages : [];

    if ((!messages || messages.length === 0) && typeof parsed.prompt === 'string' && parsed.prompt.trim() !== '') {
      messages = [{ role: 'user', content: parsed.prompt }];
    }

    if (!messages || messages.length === 0) {
      res.statusCode = 400;
      (res as any).end('messages or prompt is required');
      return;
    }

    res.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    const client = new Anthropic({ apiKey });

    try {
      console.log('[anthropicSse] create stream', { model, maxTokens, temperature, hasSystem: Boolean(system), messageCount: messages.length });

      const params: Messages.MessageStreamParams = {
        model,
        max_tokens: maxTokens,
        temperature,
        system,
        messages,
        tools: toolDefinitions,
      };

      // initial open event for clients to hook
      try {
        res.write(encodeSseEvent('open', JSON.stringify({})));
      } catch { /* ignore */ }

      while (true) {
        const stream = client.messages.stream(params);
        // console.log('[anthropicSse] stream created', params);

        // Accumulate tool_use to run, then stream tool_result back as events and append to conversation
        const pendingToolUses: PendingToolUse[] = [];
        const toolResults: ToolResultBlockParam[] = [];

        let shouldContinue = false;
        for await (const event of stream) {
          try {
            console.debug('[anthropicSse] event', event.type, event);
            shouldContinue = await sendEvent(stream, res, event, pendingToolUses, toolResults, () => {
              if (shouldContinue) {
                params.messages = [
                  ...messages,
                  { role: 'assistant', content: stream.currentMessage?.content || [] },
                  { role: 'user', content: toolResults as any },
                ];
              }
            }) || shouldContinue;
          } catch {
            // ignore write error
          }
        }

        if (!shouldContinue) {
          break;
        }
      }
    } catch (err: any) {
      try {
        const message = err?.message || 'stream error';
        console.error('[anthropicSse] error', message);
        (res as any).write(encodeSseEvent('error', JSON.stringify({ message })));
      } catch { /* ignore */ }
    } finally {
      try { res.end(); console.log('[anthropicSse] end'); } catch { /* ignore */ }
    }
  } catch {
    try { res.statusCode = 500; res.end('Internal Error'); console.error('[anthropicSse] fatal'); } catch { /* ignore */ }
  }
}

async function sendEvent(
  stream: MessageStream,
  res: ServerResponse,
  event: Messages.RawMessageStreamEvent,
  pendingToolUses: PendingToolUse[],
  toolResults: ToolResultBlockParam[],
  onMessageStop: () => void,
): Promise<boolean> {
  let shouldContinue = false;

  switch (event.type) {
    case 'message_start':
      res.write(encodeSseEvent('message_start', JSON.stringify(event)));
      break;
    case 'content_block_start':
      res.write(encodeSseEvent('content_block_start', JSON.stringify(event)));
      break;
    case 'content_block_delta': {
      res.write(encodeSseEvent('content_block_delta', JSON.stringify(event)));
      break;
    }
    case 'content_block_stop': {
      const e = event as Messages.RawContentBlockStopEvent;
      const content = (stream as any).currentMessage?.content?.[e.index];
      if (content?.type === 'tool_use') {
        pendingToolUses.push({ id: content.id, name: content.name, input: content.input });
      }
      res.write(encodeSseEvent('content_block_stop', JSON.stringify(event)));
      break;
    }
    case 'message_delta':
      res.write(encodeSseEvent('message_delta', JSON.stringify(event)));
      if (event.delta?.stop_reason === 'tool_use' && pendingToolUses.length > 0) {
        shouldContinue = true;
        dealWithToolUses(res, pendingToolUses, toolResults);
      }
      break;
    case 'message_stop':
      res.write(encodeSseEvent('message_stop', JSON.stringify(event)));
      onMessageStop();
      break;
  }

  return shouldContinue;
}

async function dealWithToolUses(
  res: ServerResponse,
  pendingToolUses: PendingToolUse[],
  toolResults: ToolResultBlockParam[],
) {
  for (const tu of pendingToolUses) {
    const output = await executeTool(tu.name, tu.input);
    toolResults.push({
      type: 'tool_result',
      tool_use_id: tu.id,
      content: JSON.stringify(output)
    });
    try {
      res.write(encodeSseEvent('tool_result', JSON.stringify({
        tool_use_id: tu.id,
        name: tu.name,
        input: tu.input,
        output,
      })));
      // also push via websocket for live tools panel
      broadcast({
        type: 'tool_result',
        at: new Date().toISOString(),
        tool_use_id: tu.id,
        name: tu.name,
        input: tu.input,
        output,
      });
    } catch (e) {
      console.error('[anthropicSse] write tool_result error', e);
    }
  }
}
