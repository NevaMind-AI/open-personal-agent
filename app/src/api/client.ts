import type { ContentBlockParam, InputJSONDelta, MessageParam, RawContentBlockDelta, RawContentBlockDeltaEvent, RawContentBlockStartEvent, TextBlockParam, TextDelta, ToolResultBlockParam, ToolUseBlockParam } from '@anthropic-ai/sdk/resources/messages';

export interface HealthResponse {
  status: string
  time: string
}

const API_PREFIX = '/api' as const;

export async function getHealth(): Promise<HealthResponse> {
  const res = await fetch(`${API_PREFIX}/health`, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`);
  }
  return res.json();
}

export type StreamOptions = {
  model?: string
  max_tokens?: number
  temperature?: number
}

export async function streamAnthropic(
  messages: MessageParam[] | undefined,
  prompt: string | undefined,
  onNewMessages: (messages: MessageParam[]) => void,
  onNewBlock: (content: ContentBlockParam) => void,
  onAppend: (delta: RawContentBlockDelta) => void,
  onBlockStop: () => void,
  options?: StreamOptions,
): Promise<void> {
  const controller = new AbortController();
  console.log('[streamAnthropic] start', { messages, hasPrompt: Boolean(prompt), options });
  const res = await fetch(`${API_PREFIX}/anthropic/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'text/event-stream' },
    body: JSON.stringify({ messages, prompt, ...options }),
    signal: controller.signal,
  });
  if (!res.ok || !res.body) {
    console.error('[streamAnthropic] response not ok/body missing', res.status);
    throw new Error(`Stream request failed: ${res.status}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  function handleEvent(name: string, data: string) {
    console.debug('[streamAnthropic] event', name, data);
    try {
      const parsed = data ? JSON.parse(data) : null;
      switch (name) {
        case 'content_block_start': {
          onNewBlock(parseContentBlockStartEvent(parsed as RawContentBlockStartEvent));
          break;
        }
        case 'content_block_delta': {
          onAppend(parseContentBlockDeltaEvent(parsed as RawContentBlockDeltaEvent));
          break;
        }
        // temporary do nothing
        case 'content_block_stop': {
          onBlockStop();
          break;
        }
        // this is a custom event type, we use it to append tool_result to message
        case 'tool_result': {
          onNewMessages([
            {
              role: 'user',
              content: [
                {
                  type: 'tool_result',
                  tool_use_id: parsed.tool_use_id,
                  content: JSON.stringify(parsed),
                } as ToolResultBlockParam
              ] as Array<ContentBlockParam>
            } as MessageParam,
          ]);
          break;
        }
      }
    } catch {
      // swallow parse errors
    }
  }

  while (true) {
    const { value, done } = await reader.read();
    if (done) {
      console.log('[streamAnthropic] done');
      break;
    }
    buffer += decoder.decode(value, { stream: true });
    console.debug('[streamAnthropic] chunk', value?.length);

    let idx: number;
    while ((idx = buffer.indexOf('\n\n')) !== -1) {
      const raw = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 2);

      // parse SSE lines like: event: <name>\ndata: <json>
      const lines = raw.split('\n');
      let ev = '';
      let data = '';
      for (const l of lines) {
        if (l.startsWith('event: ')) ev = l.slice(7).trim();
        else if (l.startsWith('data: ')) data = l.slice(6);
      }
      if (!ev && !data) {
        console.debug('[streamAnthropic] skip empty block');
      }
      if (ev) handleEvent(ev, data);
    }
  }
}


function parseContentBlockStartEvent(parsed: RawContentBlockStartEvent): ContentBlockParam {
  switch (parsed.content_block.type) {
    case 'tool_use':
      return {
        type: 'tool_use',
        id: parsed.content_block.id,
        name: parsed.content_block.name,
        input: '',
      } as ToolUseBlockParam;
      break;
    case 'text':
      return {
        type: 'text',
        text: '',
      } as TextBlockParam;
      break;
  }
  throw new Error(`Unknown content block type: ${parsed.content_block.type}`);
}

function parseContentBlockDeltaEvent(parsed: RawContentBlockDeltaEvent): RawContentBlockDelta {
  switch (parsed.delta.type) {
    case 'text_delta':
      return parsed.delta as TextDelta;
    case 'input_json_delta':
      return parsed.delta as InputJSONDelta;
  }
  throw new Error(`Unknown content block delta type: ${parsed.delta.type}`);
}