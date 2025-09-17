import type { ContentBlockParam, TextBlockParam, ToolUseBlockParam } from '@anthropic-ai/sdk/resources/index.mjs';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { prettyMaybeJson, renderJsonBlock } from './utils';

export function AssistantBubble(props: { content: Array<ContentBlockParam> }) {
  const { content } = props;

  function renderTextBlock(block: TextBlockParam, idx: number): React.ReactNode {
    return (
      <div key={idx} className="w-full">
        <div className="p-[1.5px] rounded-2xl bg-gradient-to-tr from-cyan-200 via-sky-200 to-indigo-200">
          <div className="rounded-2xl px-5 py-4 leading-relaxed bg-white/60 backdrop-blur-xl border border-white/50 prose max-w-none text-violet-900">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: (props) => <h1 className="mt-2 mb-3 text-2xl font-semibold tracking-tight" {...props} />,
                h2: (props) => <h2 className="mt-3 mb-2 text-xl font-semibold tracking-tight" {...props} />,
                h3: (props) => <h3 className="mt-3 mb-2 text-lg font-semibold" {...props} />,
                p: (props) => <p className="my-3 leading-7" {...props} />,
                a: (props) => <a className="text-violet-700 underline decoration-violet-300 hover:decoration-violet-600" target="_blank" rel="noreferrer" {...props} />,
                ul: (props) => <ul className="my-3 pl-6 list-disc space-y-2" {...props} />,
                ol: (props) => <ol className="my-3 pl-6 list-decimal space-y-2" {...props} />,
                li: (props) => <li className="leading-7" {...props} />,
                blockquote: (props) => (
                  <blockquote className="my-3 border-l-2 border-violet-200 pl-3 italic bg-violet-50/40 rounded" {...props} />
                ),
                hr: () => <hr className="my-4 border-violet-100" />,
                table: (props) => (
                  <div className="my-3 overflow-x-auto">
                    <table className="min-w-full text-sm border border-violet-100" {...props} />
                  </div>
                ),
                th: (props) => <th className="bg-violet-50/60 px-3 py-2 text-left font-medium border-b border-violet-100" {...props} />,
                td: (props) => <td className="px-3 py-2 align-top border-b border-violet-50" {...props} />,
                code(codeProps) {
                  const { inline, className, children, ...rest } = codeProps as any;
                  if (inline) {
                    return (
                      <code className="px-1.5 py-0.5 rounded bg-violet-50 text-violet-900 border border-violet-100" {...rest}>
                        {children}
                      </code>
                    );
                  }
                  return (
                    <pre className="my-3 rounded-xl bg-slate-900/90 text-slate-50 p-3 overflow-x-auto">
                      <code className={className} {...rest}>{children}</code>
                    </pre>
                  );
                },
              }}
            >
              {block.text}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    );
  }

  function renderToolUseBlock(block: ToolUseBlockParam, idx: number): React.ReactNode {
    const toolTitle = `tool: ${block.name}`;
    const toolContent = `input: ${prettyMaybeJson(block.input as string)}`;
    return renderJsonBlock(idx, toolTitle, toolContent);
  }

  return (
    <div className="w-full flex flex-col gap-3">
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


