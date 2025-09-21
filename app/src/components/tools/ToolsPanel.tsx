import { useState } from 'react';
import { ToolsContainer } from './ToolsContainer';
import ApiKeyLogo from '../header/ApiKeyLogo.tsx';

export function ToolsPanel() {
  return (
    <div className="hidden md:block w-80 shrink-0 my-5 mr-5">
      <div className="relative p-[2px] rounded-xl h-full overflow-hidden">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[500%] h-[500%] rounded-full bg-[conic-gradient(at_50%_50%,#a78bfa_0deg,#22d3ee_120deg,#f472b6_240deg,#a78bfa_360deg)] animate-spin-slow opacity-50" />
        <div className="relative rounded-[11px] border border-white/40 bg-white/80 backdrop-blur p-4 h-full overflow-y-auto">
          <ToolsContainer />
        </div>
      </div>
    </div>
  );
}

export function ToolsDrawer() {
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  return (
    <>
      <button
        className="md:hidden absolute top-3 right-5 z-20 bg-transparent text-slate-700 rounded-full p-2"
        onClick={() => { setVisible(true); requestAnimationFrame(() => setOpen(true)); }}
        aria-label="Open tools"
        title="Tools"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
          <rect x="3" y="3" width="4" height="4" rx="1"></rect>
          <rect x="10" y="3" width="4" height="4" rx="1"></rect>
          <rect x="17" y="3" width="4" height="4" rx="1"></rect>
          <rect x="3" y="10" width="4" height="4" rx="1"></rect>
          <rect x="10" y="10" width="4" height="4" rx="1"></rect>
          <rect x="17" y="10" width="4" height="4" rx="1"></rect>
          <rect x="3" y="17" width="4" height="4" rx="1"></rect>
          <rect x="10" y="17" width="4" height="4" rx="1"></rect>
          <rect x="17" y="17" width="4" height="4" rx="1"></rect>
        </svg>
      </button>
      {visible && (
        <div className={`fixed inset-0 h-screen w-screen md:hidden`} style={{ zIndex: 'var(--z-overlay)' }}>
          <div
            className={`absolute inset-0 h-full w-full bg-black/30 transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-0'}`}
            onClick={() => setOpen(false)}
          />
          <div
            className={`absolute right-0 top-0 h-screen w-80 p-4 transition-transform duration-200 ${open ? 'translate-x-0' : 'translate-x-full'}`}
            style={{ zIndex: 'var(--z-drawer)' }}
            onTransitionEnd={() => { if (!open) setVisible(false); }}
          >
            <div className="relative p-[2px] rounded-xl overflow-hidden h-full">
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[500%] h-[500%] rounded-full bg-[conic-gradient(at_50%_50%,#a78bfa_0deg,#22d3ee_120deg,#f472b6_240deg,#a78bfa_360deg)] animate-spin-slow opacity-70" />
              <div className="relative rounded-[11px] border border-white/40 bg-white/80 backdrop-blur p-4 h-full">
                <div className="flex items-center justify-between mb-3">
                  <ApiKeyLogo align="left" />
                  <button
                    className="text-slate-600 hover:text-slate-800 rounded-full p-2 bg-white/20 backdrop-blur hover:bg-slate-100 transition-colors duration-300"
                    onClick={() => setOpen(false)}
                    aria-label="Close tools"
                    title="Close"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
                <ToolsContainer />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


