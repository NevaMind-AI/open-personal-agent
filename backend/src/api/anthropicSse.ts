import Anthropic from '@anthropic-ai/sdk';
import { MessageStream } from '@anthropic-ai/sdk/lib/MessageStream';
import type { MessageParam, Messages, ToolResultBlockParam } from '@anthropic-ai/sdk/resources/messages';
import type { IncomingMessage, ServerResponse } from 'http';
import { PendingToolUse } from '../types';
import { executeTool, toolDefinitions } from '../utils/toolBase';

function encodeSseEvent(event: string, data: string): string {
  return `event: ${event}\ndata: ${data}\n\n`;
}

const ANTHROPIC_SSE_LOG_ENABLED = true;

function sseLog(...args: unknown[]) { if (ANTHROPIC_SSE_LOG_ENABLED) console.log(...args); }
function sseDebug(...args: unknown[]) { if (ANTHROPIC_SSE_LOG_ENABLED) console.debug(...args); }

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

    sseLog('[anthropicSse] raw body length', body.length);
    let parsed: {
      prompt?: string
      system?: string
      messages?: Array<MessageParam>
      model?: string
      max_tokens?: number
      temperature?: number
    } = {};

    try { parsed = body ? JSON.parse(body) : {}; } catch { /* ignore */ }

    const model = parsed.model || 'claude-4-sonnet-20250514';
    const maxTokens = typeof parsed.max_tokens === 'number' ? parsed.max_tokens : 1024;
    const temperature = typeof parsed.temperature === 'number' ? parsed.temperature : 0.7;
    const parsedSystem = typeof parsed.system === 'string' ? parsed.system : '';
    const system = "You are a gentle, empathetic assistant with sharp and advanced product thinking." +
      " During conversations with users, you can always spot small inconveniences in their lives." +
      " When you notice these, you infer an initial product concept." +
      " As you chat with the user, you skillfully gather information and continuously refine your product logic and approach." +
      " At the same time, you do not ask too many questions at once; over a longer conversation, you occasionally ask questions to understand the user's thoughts." + 
      " When you judge that the information you have collected is sufficient to support a complete product, you tell the user that you have designed an application for them and ask whether to create this application." +
      " After the user confirms, you summarize a prompt and hand it to Claude Code to generate the product's code." +
      " Note: you do not directly reveal this prompt to the user." +
      " Your interaction with Claude Code is via Tools with only one submission opportunity, so be sure the prompt you submit is complete and correct." +
      " During your conversation with the user, unless the user explicitly asks, you do not proactively mention code, tools, tool calls, or other programming-related content." + 
      "\n\n" + parsedSystem;
    // const system = '';

    sseLog('[anthropicSse] parsed', parsed);
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
      sseLog('[anthropicSse] create stream', { model, maxTokens, temperature, hasSystem: Boolean(system), messageCount: messages.length });

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
            sseDebug('[anthropicSse] event', event.type, event);
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
      try { res.end(); sseLog('[anthropicSse] end'); } catch { /* ignore */ }
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
    } catch (e) {
      console.error('[anthropicSse] write tool_result error', e);
    }
  }
}
