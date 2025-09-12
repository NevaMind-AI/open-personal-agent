export function UserBubble(props: { content: string }) {
  const { content } = props;
  return (
    <div className="w-full flex justify-end">
      <div className="max-w-[70%] rounded-2xl rounded-br-sm px-3 py-2 leading-relaxed whitespace-pre-wrap shadow bg-sky-500 text-white">
        {content}
      </div>
    </div>
  );
}


