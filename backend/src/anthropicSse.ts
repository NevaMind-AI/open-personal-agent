import type { IncomingMessage, ServerResponse } from 'http';
import Anthropic from '@anthropic-ai/sdk';
import type { Messages } from '@anthropic-ai/sdk/resources/messages';
import { toolDefinitions, executeTool } from './utils/functionCalls';

function encodeSseEvent(event: string, data: string): string {
  return `event: ${event}\ndata: ${data}\n\n`;
}

type BasicMessage = { role: 'user' | 'assistant'; content: string };

export async function handleAnthropicSse(req: IncomingMessage, res: ServerResponse) {
  try {
    if ((req as any).method !== 'POST') {
      res.statusCode = 405;
      res.setHeader('Allow', 'POST');
      (res as any).end('Method Not Allowed');
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
      (req as any).on('data', (chunk: any) => { data += chunk; });
      (req as any).on('end', () => resolve(data));
      (req as any).on('error', reject);
    });

    console.log('[anthropicSse] raw body length', body.length);
    let parsed: {
      prompt?: string
      system?: string
      messages?: BasicMessage[]
      model?: string
      max_tokens?: number
      temperature?: number
    } = {};

    try { parsed = body ? JSON.parse(body) : {}; } catch { /* ignore */ }

    const model = parsed.model || 'claude-4-sonnet-20250514';
    const maxTokens = typeof parsed.max_tokens === 'number' ? parsed.max_tokens : 1024;
    const temperature = typeof parsed.temperature === 'number' ? parsed.temperature : 0.7;
    const system = typeof parsed.system === 'string' && parsed.system.trim() !== '' ? parsed.system : undefined;

    console.log('[anthropicSse] parsed', parsed);
    let messages: BasicMessage[] = Array.isArray(parsed.messages) ? parsed.messages.filter(m => m && typeof m.content === 'string' && (m.role === 'user' || m.role === 'assistant')) : [];

    if ((!messages || messages.length === 0) && typeof parsed.prompt === 'string' && parsed.prompt.trim() !== '') {
      messages = [{ role: 'user', content: parsed.prompt }];
    }

    if (!messages || messages.length === 0) {
      res.statusCode = 400;
      (res as any).end('messages or prompt is required');
      return;
    }

    (res as any).writeHead(200, {
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
        ...(system ? { system } : {}),
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
        tools: toolDefinitions.map((t) => ({
          name: t.name,
          description: t.description,
          input_schema: t.input_schema,
          type: 'custom',
        }) as any),
      };
      const stream = await client.messages.stream(params as any);
      console.log('[anthropicSse] stream created', params);

      // initial open event for clients to hook
      try { (res as any).write(encodeSseEvent('open', JSON.stringify({}))); } catch { /* ignore */ }

      // Accumulate tool_use to run, then stream tool_result back as events and append to conversation
      const pendingToolUses: { id: string; name: string; input: any }[] = [];
      for await (const event of stream) {
        try {
          console.debug('[anthropicSse] event', (event as any).type);
          switch ((event as any).type) {
            case 'message_start':
              (res as any).write(encodeSseEvent('message_start', JSON.stringify(event)));
              break;
            case 'content_block_start':
              (res as any).write(encodeSseEvent('content_block_start', JSON.stringify(event)));
              break;
            case 'content_block_delta': {
              const e: any = event;
              if (e.delta?.type === 'text_delta' && typeof e.delta.text === 'string') {
                (res as any).write(encodeSseEvent('text', JSON.stringify({ text: e.delta.text })));
              } else if (e.delta?.type === 'input_json_delta') {
                // tool input partial json - no-op
              } else {
                (res as any).write(encodeSseEvent('content_block_delta', JSON.stringify(event)));
              }
              break;
            }
            case 'content_block_stop': {
              const e: any = event;
              const content = (stream as any).currentMessage?.content?.[e.index];
              if (content?.type === 'tool_use') {
                pendingToolUses.push({ id: content.id, name: content.name, input: content.input });
              }
              (res as any).write(encodeSseEvent('content_block_stop', JSON.stringify(event)));
              break;
            }
            case 'message_delta':
              console.log('[anthropicSse] message_delta', event);
              (res as any).write(encodeSseEvent('message_delta', JSON.stringify(event)));
              break;
            case 'message_stop':
              (res as any).write(encodeSseEvent('message_stop', JSON.stringify(event)));
              // If any tool_use blocks appeared, run them and send a follow-up streaming turn
              if (pendingToolUses.length > 0) {
                const toolResults = [] as { type: 'tool_result'; tool_use_id: string; content: any }[];
                for (const tu of pendingToolUses) {
                  const output = await executeTool(tu.name, tu.input);
                  toolResults.push({ type: 'tool_result', tool_use_id: tu.id, content: output });
                  try {
                    (res as any).write(encodeSseEvent('tool_result', JSON.stringify({
                      tool_use_id: tu.id,
                      name: tu.name,
                      input: tu.input,
                      output,
                    })));
                  } catch (e) {
                    console.error('[anthropicSse] write tool_result error', e);
                  }
                }
                // Append tool_result as user message and continue a second call to get assistant response
                const follow = await client.messages.stream({
                  model,
                  max_tokens: maxTokens,
                  temperature,
                  messages: [
                    ...messages.map((m) => ({ role: m.role, content: m.content })),
                    { role: 'assistant', content: (stream as any).currentMessage?.content || [] },
                    { role: 'user', content: toolResults as any },
                  ],
                  tools: params.tools as any,
                } as any);
                for await (const ev of follow) {
                  try {
                    if ((ev as any).type === 'content_block_delta') {
                      const d: any = ev;
                      if (d.delta?.type === 'text_delta' && typeof d.delta.text === 'string') {
                        (res as any).write(encodeSseEvent('text', JSON.stringify({ text: d.delta.text })));
                      } else {
                        (res as any).write(encodeSseEvent('content_block_delta', JSON.stringify(ev)));
                      }
                    } else if ((ev as any).type === 'content_block_start' || (ev as any).type === 'content_block_stop' || (ev as any).type === 'message_start' || (ev as any).type === 'message_stop') {
                      (res as any).write(encodeSseEvent((ev as any).type, JSON.stringify(ev)));
                    } else {
                      (res as any).write(encodeSseEvent('event', JSON.stringify(ev)));
                    }
                  } catch (e) {
                    console.error('[anthropicSse] follow stream write error', e);
                  }
                }
              }
              break;
            case 'error':
              (res as any).write(encodeSseEvent('error', JSON.stringify(event)));
              break;
            default:
              (res as any).write(encodeSseEvent('event', JSON.stringify(event)));
          }
        } catch {
          // ignore write error
        }
      }
    } catch (err: any) {
      try {
        const message = err?.message || 'stream error';
        console.error('[anthropicSse] error', message);
        (res as any).write(encodeSseEvent('error', JSON.stringify({ message })));
      } catch { /* ignore */ }
    } finally {
      try { (res as any).end(); console.log('[anthropicSse] end'); } catch { /* ignore */ }
    }
  } catch {
    try { (res as any).statusCode = 500; (res as any).end('Internal Error'); console.error('[anthropicSse] fatal'); } catch { /* ignore */ }
  }
}


