import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export function MessageBubble(props: { role: 'user' | 'assistant'; content: string }) {
  const { role, content } = props;
  if (role === 'assistant') {
    return (
      <div className="w-full text-slate-900 leading-relaxed prose prose-slate max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </div>
    );
  }

  return (
    <div className="w-full flex justify-end">
      <div className="max-w-[70%] rounded-2xl rounded-br-sm px-3 py-2 leading-relaxed whitespace-pre-wrap shadow bg-sky-500 text-white">
        {content}
      </div>
    </div>
  );
}


