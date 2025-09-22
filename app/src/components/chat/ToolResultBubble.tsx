import type { ContentBlockParam, ToolResultBlockParam } from '@anthropic-ai/sdk/resources/index.mjs';
import { prettyMaybeJson, renderJsonBlock } from './utils';

export function ToolResultBubble(props: { content: Array<ContentBlockParam> }) {
  const { content } = props;

  function renderToolResultBlock(block: ToolResultBlockParam, idx: number): React.ReactNode {
    let content: { tool_use_id: string; name: string; input: unknown; output: unknown } | null = null;
    try {
      content = JSON.parse(block.content as string);
    } catch {
      // Be tolerant when incomplete; render the raw string directly
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
            return (
              <div key={idx} className="p-[1.5px] rounded-2xl bg-gradient-to-tr from-amber-200 via-rose-200 to-fuchsia-200">
                <div className="rounded-2xl px-4 py-3 bg-white/60 backdrop-blur-xl border border-white/50">
                  {renderToolResultBlock(item as ToolResultBlockParam, idx)}
                </div>
              </div>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}


