export type ColorTheme = {
  outer: string; // base gradient classes for outer border (e.g., 'from-... via-... to-...')
  outerHover: string; // hover gradient classes for outer border (prefixed with hover:)
  logo: string; // base gradient for logo block
  logoHover: string; // hover gradient for logo block (prefixed with group-hover:)
};

export const COLOR_THEMES: ColorTheme[] = [
  {
    outer: 'from-violet-200 via-sky-200 to-fuchsia-200',
    outerHover: 'hover:from-violet-300 hover:via-sky-300 hover:to-fuchsia-300',
    logo: 'from-violet-300 via-sky-300 to-fuchsia-300',
    logoHover: 'group-hover:from-violet-400 group-hover:via-sky-400 group-hover:to-fuchsia-400',
  },
  {
    outer: 'from-cyan-200 via-teal-200 to-emerald-200',
    outerHover: 'hover:from-cyan-300 hover:via-teal-300 hover:to-emerald-300',
    logo: 'from-cyan-300 via-teal-300 to-emerald-300',
    logoHover: 'group-hover:from-cyan-400 group-hover:via-teal-400 group-hover:to-emerald-400',
  },
  {
    outer: 'from-rose-200 via-orange-200 to-amber-200',
    outerHover: 'hover:from-rose-300 hover:via-orange-300 hover:to-amber-300',
    logo: 'from-rose-300 via-orange-300 to-amber-300',
    logoHover: 'group-hover:from-rose-400 group-hover:via-orange-400 group-hover:to-amber-400',
  },
  {
    outer: 'from-indigo-200 via-violet-200 to-sky-200',
    outerHover: 'hover:from-indigo-300 hover:via-violet-300 hover:to-sky-300',
    logo: 'from-indigo-300 via-violet-300 to-sky-300',
    logoHover: 'group-hover:from-indigo-400 group-hover:via-violet-400 group-hover:to-sky-400',
  },
  {
    outer: 'from-lime-200 via-emerald-200 to-teal-200',
    outerHover: 'hover:from-lime-300 hover:via-emerald-300 hover:to-teal-300',
    logo: 'from-lime-300 via-emerald-300 to-teal-300',
    logoHover: 'group-hover:from-lime-400 group-hover:via-emerald-400 group-hover:to-teal-400',
  },
  {
    outer: 'from-blue-200 via-cyan-200 to-indigo-200',
    outerHover: 'hover:from-blue-300 hover:via-cyan-300 hover:to-indigo-300',
    logo: 'from-blue-300 via-cyan-300 to-indigo-300',
    logoHover: 'group-hover:from-blue-400 group-hover:via-cyan-400 group-hover:to-indigo-400',
  },
  {
    outer: 'from-amber-200 via-lime-200 to-emerald-200',
    outerHover: 'hover:from-amber-300 hover:via-lime-300 hover:to-emerald-300',
    logo: 'from-amber-300 via-lime-300 to-emerald-300',
    logoHover: 'group-hover:from-amber-400 group-hover:via-lime-400 group-hover:to-emerald-400',
  },
  {
    outer: 'from-pink-200 via-rose-200 to-fuchsia-200',
    outerHover: 'hover:from-pink-300 hover:via-rose-300 hover:to-fuchsia-300',
    logo: 'from-pink-300 via-rose-300 to-fuchsia-300',
    logoHover: 'group-hover:from-pink-400 group-hover:via-rose-400 group-hover:to-fuchsia-400',
  },
  {
    outer: 'from-slate-200 via-gray-200 to-zinc-200',
    outerHover: 'hover:from-slate-300 hover:via-gray-300 hover:to-zinc-300',
    logo: 'from-slate-300 via-gray-300 to-zinc-300',
    logoHover: 'group-hover:from-slate-400 group-hover:via-gray-400 group-hover:to-zinc-400',
  },
  {
    outer: 'from-purple-200 via-fuchsia-200 to-rose-200',
    outerHover: 'hover:from-purple-300 hover:via-fuchsia-300 hover:to-rose-300',
    logo: 'from-purple-300 via-fuchsia-300 to-rose-300',
    logoHover: 'group-hover:from-purple-400 group-hover:via-fuchsia-400 group-hover:to-rose-400',
  },
];

export function hashCode(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h * 31 + input.charCodeAt(i)) | 0;
  }
  return h;
}


