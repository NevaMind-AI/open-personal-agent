import { useEffect, useMemo, useRef, useState } from 'react';
import { LS_MEMU_API_KEY } from '../consts';

const LS_KEY = LS_MEMU_API_KEY;

export default function ApiKeyLogo(props: { align?: 'left' | 'right' }) {
  const { align = 'right' } = props;
  const [open, setOpen] = useState(false);
  const [show, setShow] = useState(false);
  const [value, setValue] = useState('');
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [reveal, setReveal] = useState(false);
  const hasKey = useMemo(() => value.trim().length > 0, [value]);

  useEffect(() => {
    try {
      const v = localStorage.getItem(LS_KEY) || '';
      setValue(v);
    } catch { /* ignore */ }
  }, []);

  // autosave on change; no explicit save button

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) {
        setShow(false);
        setTimeout(() => setOpen(false), 200);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  return (
    <div className="relative" ref={rootRef}>
      <button
        className="relative inline-flex items-center gap-2 rounded-full px-2 py-1 hover:bg-white/50"
        onClick={() => { setOpen(true); requestAnimationFrame(() => setShow(true)); }}
        title={hasKey ? 'API key configured' : 'Set API key'}
        aria-label="API key"
      >
        <span className={`h-2 w-2 mt-1 rounded-full ${hasKey ? 'bg-emerald-500' : 'bg-rose-500'}`} />
        <img
          src="/memu-logo.svg"
          alt="logo"
          className={`h-6 w-auto ${hasKey ? '' : 'grayscale opacity-70'}`}
        />
      </button>

      {open && (
        <div className={`absolute ${align === 'left' ? 'left-0' : 'right-0'} top-9 z-[70]`}>
          <div className={`${align === 'left' ? 'w-64' : 'w-72 max-w-[80vw]'} rounded-xl border border-white/40 bg-white backdrop-blur p-4 shadow-sm transition duration-200 ${show ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-1 scale-95'}`}
          >
            <div className="text-sm font-semibold mb-2 text-slate-700">Set API Key</div>
            <div className="relative">
              <input
                type={reveal ? 'text' : 'password'}
                className="w-full border border-slate-200 rounded-md pl-2 pr-8 py-1 text-sm bg-white"
                placeholder="Enter your API key"
                value={value}
                onChange={(e) => {
                  const v = e.target.value;
                  setValue(v);
                  try { localStorage.setItem(LS_KEY, v.trim()); } catch { /* ignore */ }
                  // notify ws provider
                  const evt = new CustomEvent('api_key_update', { detail: { apiKey: v.trim() } });
                  window.dispatchEvent(evt);
                }}
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                onClick={() => setReveal((v) => !v)}
                aria-label={reveal ? 'Hide key' : 'Show key'}
                title={reveal ? 'Hide' : 'Show'}
              >
                {reveal ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                    <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-5 0-9.27-3.11-11-8 1.02-2.86 3.1-5.23 5.82-6.61M9.9 4.24A10.94 10.94 0 0 1 12 4c5 0 9.27 3.11 11 8a11.73 11.73 0 0 1-2.32 3.95" />
                    <path d="M1 1l22 22" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
            {/* autosave on change; click outside to dismiss */}
          </div>
        </div>
      )}
    </div>
  );
}


