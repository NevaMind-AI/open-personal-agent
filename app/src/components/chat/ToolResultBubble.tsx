import type { ContentBlockParam, ToolResultBlockParam } from '@anthropic-ai/sdk/resources/index.mjs';

export function ToolResultBubble(props: { content: Array<ContentBlockParam> }) {
  const { content } = props;

  function prettyMaybeJson(raw: unknown): string {
    if (typeof raw !== 'string') {
      try { return JSON.stringify(raw, null, 2); } catch { return String(raw); }
    }
    try {
      return JSON.stringify(JSON.parse(raw), null, 2);
    } catch {
      return raw; // 流式未完成时直接显示原文，避免抛错
    }
  }

  function renderToolResultBlock(block: ToolResultBlockParam, idx: number): React.ReactNode {
    let content: { tool_use_id: string; name: string; input: unknown; output: unknown } | null = null;
    try {
      content = JSON.parse(block.content as string);
    } catch {
      // 未完成时容错，直接渲染原始字符串
    }
    return (
      <div key={idx} className="w-full rounded-xl border border-slate-200 p-3 bg-slate-50">
        <div className="text-xs text-slate-500 mb-1">tool: {content ? content.name : 'result'}</div>
        <pre className="text-xs whitespace-pre-wrap break-words">{content ? `result: ${prettyMaybeJson(content.output)}` : String(block.content)}</pre>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-2">
      {content.map((item, idx) => {
        switch (item.type) {
          case 'tool_result':
            return renderToolResultBlock(item as ToolResultBlockParam, idx);
          default:
            return null;
        }
      })}
    </div>
  );
}


