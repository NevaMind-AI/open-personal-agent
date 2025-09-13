import type { ContentBlockParam, TextBlockParam, ToolUseBlockParam } from '@anthropic-ai/sdk/resources/index.mjs';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export function AssistantBubble(props: { content: Array<ContentBlockParam> }) {
  const { content } = props;

  function renderTextBlock(block: TextBlockParam, idx: number): React.ReactNode {
    return (
      <div key={idx} className="w-full text-slate-900 leading-relaxed prose prose-slate max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{block.text}</ReactMarkdown>
      </div>
    );
  }

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

  function renderToolUseBlock(block: ToolUseBlockParam, idx: number): React.ReactNode {
    return (
      <div key={idx} className="w-full rounded-xl border border-slate-200 p-3 bg-slate-50">
        <div className="text-xs text-slate-500 mb-1">tool: {block.name}</div>
        <pre className="text-xs whitespace-pre-wrap break-words">input: {prettyMaybeJson(block.input as string)}</pre>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-2">
      {content.map((item, idx) => {
        switch (item.type) {
          case 'text':
            return renderTextBlock(item as TextBlockParam, idx);
          case 'tool_use':
            return renderToolUseBlock(item as ToolUseBlockParam, idx);
          default:
            return null;
        }
      })}
    </div>
  );
}


