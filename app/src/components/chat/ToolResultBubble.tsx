import type { ContentBlockParam, ToolResultBlockParam } from '@anthropic-ai/sdk/resources/index.mjs';
import { prettyMaybeJson, renderJsonBlock } from './utils';

export function ToolResultBubble(props: { content: Array<ContentBlockParam> }) {
  const { content } = props;

  function renderToolResultBlock(block: ToolResultBlockParam, idx: number): React.ReactNode {
    let content: { tool_use_id: string; name: string; input: unknown; output: unknown } | null = null;
    try {
      content = JSON.parse(block.content as string);
    } catch {
      // 未完成时容错，直接渲染原始字符串
    }
    const resultTitle = `tool: ${content ? content.name : 'result'}`;
    const resultContent = content ? `result: ${prettyMaybeJson(content.output)}` : String(block.content);
    return renderJsonBlock(idx, resultTitle, resultContent);
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


