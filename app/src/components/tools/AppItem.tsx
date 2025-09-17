import { COLOR_THEMES, hashCode } from '../../theme/colorTheme';

export default function AppItem(props: { title: string; desc: string }) {
  const { title, desc } = props;

  function toTitleCase(input: string): string {
    const clean = (input || '')
      .replace(/[-_]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (!clean) return '';
    return clean
      .split(' ')
      .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : ''))
      .join(' ');
  }

  const displayTitle = toTitleCase(title);
  const initials = displayTitle
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w.charAt(0))
    .join('')
    .toUpperCase() || '?';

  const idx = Math.abs(hashCode(displayTitle)) % COLOR_THEMES.length;
  const theme = COLOR_THEMES[idx];

  return (
    <div className={`group p-[2px] rounded-2xl bg-gradient-to-br ${theme.outer} transition duration-200 ${theme.outerHover}`}>
      <div className="rounded-[14px] border border-white/60 bg-white/70 backdrop-blur p-2 transition duration-200 hover:bg-white/80 hover:border-white/80">
        <div className="flex items-center gap-3">
          <div className="p-[1.5px] rounded-xl ">
            <div className={`h-9 w-9 rounded-[10px] bg-gradient-to-br ${theme.logo} transition ${theme.logoHover} backdrop-blur flex items-center justify-center text-white font-bold`}>
            {initials}
          </div>
        </div>

        <div className="min-w-0 select-none">
          <div className="truncate text-[15px] md:text-base font-semibold tracking-tight text-slate-900">
            {displayTitle}
          </div>
          <div className="mb-1 truncate text-[10px] text-slate-600">
            {desc}
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}


