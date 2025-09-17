export function UserBubble(props: { content: string }) {
  const { content } = props;
  return (
    <div className="w-full flex justify-end">
      <div className="max-w-[70%]">
        <div className="p-[1.5px] rounded-2xl rounded-br-sm bg-gradient-to-tr from-fuchsia-200 via-pink-200 to-rose-200">
          <div className="rounded-2xl rounded-br-sm px-4 py-2.5 leading-relaxed whitespace-pre-wrap bg-white/60 backdrop-blur-xl text-violet-900 border border-white/50">
            {content}
          </div>
        </div>
      </div>
    </div>
  );
}


