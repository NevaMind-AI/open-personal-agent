import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { AssistantItem } from '../../api/client';

export function AssistantBubble(props: { content: AssistantItem[] }) {
  const { content } = props;
  return (
    <div className="w-full flex flex-col gap-2">
      {content.map((item, idx) => {
        if (item.type === 'text') {
          return (
            <div key={idx} className="w-full text-slate-900 leading-relaxed prose prose-slate max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{item.text}</ReactMarkdown>
            </div>
          );
        }
        return (
          <div key={idx} className="w-full rounded-xl border border-slate-200 p-3 bg-slate-50">
            <div className="text-xs text-slate-500 mb-1">tool: {item.name}</div>
            <pre className="text-xs whitespace-pre-wrap break-words">input: {JSON.stringify(item.input, null, 2)}</pre>
            {item.output !== undefined && (
              <pre className="text-xs whitespace-pre-wrap break-words mt-2">result: {JSON.stringify(item.output, null, 2)}</pre>
            )}
          </div>
        );
      })}
    </div>
  );
}


