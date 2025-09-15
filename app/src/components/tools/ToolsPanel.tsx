import { useState } from 'react';
import { ToolsContainer } from './ToolsContainer';

export function ToolsPanel() {
  return (
    <div className="w-80 shrink-0 border border-slate-200 rounded-xl bg-white my-4 mr-4 p-4 overflow-y-auto shadow-sm hidden md:block">
      <ToolsContainer />
    </div>
  );
}

export function ToolsDrawer() {
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  return (
    <>
      <button
        className="md:hidden absolute top-3 right-3 z-20 bg-slate-900 text-white rounded-lg px-3 py-1 text-sm"
        onClick={() => { setVisible(true); requestAnimationFrame(() => setOpen(true)); }}
      >
        Tools
      </button>
      {visible && (
        <div className={`fixed inset-0 h-screen w-screen md:hidden`} style={{ zIndex: 'var(--z-overlay)' }}>
          <div
            className={`absolute inset-0 h-full w-full bg-black/30 transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-0'}`}
            onClick={() => setOpen(false)}
          />
          <div
            className={`absolute right-0 top-0 h-screen w-80 bg-white shadow-xl border-l border-slate-200 p-4 transition-transform duration-200 ${open ? 'translate-x-0' : 'translate-x-full'}`}
            style={{ zIndex: 'var(--z-drawer)' }}
            onTransitionEnd={() => { if (!open) setVisible(false); }}
          >
            <div className="flex items-center justify-end mb-3">
              <button className="text-slate-500" onClick={() => setOpen(false)}>Close</button>
            </div>
            <ToolsContainer />
          </div>
        </div>
      )}
    </>
  );
}


