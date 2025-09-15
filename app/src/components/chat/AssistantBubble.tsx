import type { ContentBlockParam, TextBlockParam, ToolUseBlockParam } from '@anthropic-ai/sdk/resources/index.mjs';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { prettyMaybeJson, renderJsonBlock } from './utils';

export function AssistantBubble(props: { content: Array<ContentBlockParam> }) {
  const { content } = props;

  function renderTextBlock(block: TextBlockParam, idx: number): React.ReactNode {
    return (
      <div key={idx} className="w-full text-slate-900 leading-relaxed prose prose-slate max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{block.text}</ReactMarkdown>
      </div>
    );
  }

  function renderToolUseBlock(block: ToolUseBlockParam, idx: number): React.ReactNode {
    const toolTitle = `tool: ${block.name}`;
    const toolContent = `input: ${prettyMaybeJson(block.input as string)}`;
    return renderJsonBlock(idx, toolTitle, toolContent);
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


