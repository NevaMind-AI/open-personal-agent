export function renderJsonBlock(key: number, title: string, content: string): React.ReactNode {
    return (
        <div key={key} className="w-full rounded-xl border border-slate-200 p-3 bg-slate-50">
            <div className="text-xs text-slate-500 mb-1">{title}</div>
            <pre className="text-xs whitespace-pre-wrap break-words">{content}</pre>
        </div>
    );
}

export function prettyMaybeJson(raw: unknown): string {
    if (typeof raw !== 'string') {
        try { return JSON.stringify(raw, null, 2); } catch { return String(raw); }
    }
    try {
        return JSON.stringify(JSON.parse(raw), null, 2);
    } catch {
      return raw; // When streaming is incomplete, show the original text to avoid errors
    }
}
