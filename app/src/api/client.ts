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

export type AssistantItem =
  | { type: 'text'; text: string }
  | { type: 'tool_use'; id: string; name: string; input: unknown; output?: unknown }

export type ChatMessage =
  | { role: 'user'; content: string }
  | { role: 'assistant'; content: AssistantItem[] }

export type AssistantBlock =
  | { kind: 'text'; text: string }
  | { kind: 'tool_use'; id: string; name: string; input: unknown; output?: unknown }

export type AssistantStreamEvent =
  | { type: 'block_start'; block: AssistantBlock }
  | { type: 'block_delta'; delta: Partial<AssistantBlock> }
  | { type: 'block_stop' }

export type StreamOptions = {
  model?: string
  system?: string
  max_tokens?: number
  temperature?: number
}

export async function streamAnthropic(
  messages: ChatMessage[] | undefined,
  prompt: string | undefined,
  onText: (chunk: string) => void,
  onEvent?: (eventName: string, payload: unknown) => void,
  onAssistantBlock?: (ev: AssistantStreamEvent) => void,
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
      if (name === 'text' && parsed && typeof parsed.text === 'string') {
        // 总是将 text 增量回传给 onText；块级渲染时由页面把它写入最后一个 text item
        onText(parsed.text);
      } else if (name === 'content_block_start' && onAssistantBlock) {
        // cannot know type until backend exposes; we infer from fields when available
        const block = parsed?.content_block;
        if (block?.type === 'tool_use') {
          onAssistantBlock({ type: 'block_start', block: { kind: 'tool_use', id: block.id, name: block.name, input: block.input } });
        } else if (block?.type === 'text') {
          onAssistantBlock({ type: 'block_start', block: { kind: 'text', text: '' } });
        }
      } else if (name === 'content_block_delta' && onAssistantBlock) {
        const delta = parsed?.delta;
        if (delta?.type === 'text_delta' && typeof delta.text === 'string') {
          onAssistantBlock({ type: 'block_delta', delta: { kind: 'text', text: delta.text } });
        }
      } else if (name === 'content_block_stop' && onAssistantBlock) {
        onAssistantBlock({ type: 'block_stop' });
      } else if (name === 'tool_result' && onAssistantBlock) {
        const tr = parsed;
        onAssistantBlock({ type: 'block_delta', delta: { kind: 'tool_use', id: tr.tool_use_id, name: tr.name, input: tr.input, output: tr.output } });
      }
      if (onEvent) onEvent(name, parsed);
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


