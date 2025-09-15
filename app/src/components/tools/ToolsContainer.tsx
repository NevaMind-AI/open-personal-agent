import { useEffect, useMemo, useState } from 'react';
import { useTools } from './toolsCtx';
import { getApplications, getRunningTask } from '../../api/client';
import type { Application, ApplicationTask } from '../types';
import { WS_EVENT_APPLICATION_NEW_TASK, WS_EVENT_APPLICATION_REFRESH } from '../consts';

export function ToolsContainer() {
  const { connected, history, connect, disconnect } = useTools();
  const [running, setRunning] = useState<ApplicationTask | null>(null);
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(false);

  const refreshToken = useMemo(() => {
    if (!history.length) return '';
    const top = history[0];
    const data = top?.data as any;
    const t = data?.type;
    if (t === WS_EVENT_APPLICATION_NEW_TASK || t === WS_EVENT_APPLICATION_REFRESH) {
      return `${t}|${top.at}`;
    }
    return '';
  }, [history]);

  const load = async () => {
    setLoading(true);
    try {
      const [rt, list] = await Promise.all([getRunningTask(), getApplications()]);
      setRunning(rt);
      setApps(list);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // initial load
    load();
  }, []);

  useEffect(() => {
    if (refreshToken) load();
  }, [refreshToken]);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-semibold">Tools</div>
        <div className="text-xs text-slate-500 flex items-center gap-2">
          <span>WS: {connected ? 'connected' : 'disconnected'}</span>
          {!connected && (
            <button className="text-sky-600 text-xs" onClick={connect}>Reconnect</button>
          )}
          {connected && (
            <button className="text-red-500 text-xs" onClick={disconnect}>Disconnect</button>
          )}
        </div>
      </div>

      {/* running section */}
      {running && (
        <section className="mb-4">
          <div className="text-xs font-semibold text-slate-500 mb-2">Now Creating</div>
          <AppItem title={running.projectName} desc={running.description} />
        </section>
      )}

      {/* list section */}
      <section>
        <div className="text-xs font-semibold text-slate-500 mb-2">Applications</div>
        <div className="flex flex-col gap-2">
          {loading ? (
            <LoadingSkeleton count={3} />
          ) : apps.length > 0 ? (
            apps.map((a) => (
              <AppItem key={a.id} title={a.projectName} desc={a.description} />
            ))
          ) : (
            <EmptyState />
          )}
        </div>
      </section>
    </div>
  );
}

function AppItem(props: { title: string; desc: string }) {
  const { title, desc } = props;
  const initials = (title || '?').trim().charAt(0).toUpperCase();
  return (
    <div className="flex items-center gap-3 p-2 rounded-lg border border-slate-200">
      <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 font-semibold">
        {initials}
      </div>
      <div className="min-w-0">
        <div className="text-sm font-medium truncate">{title}</div>
        <div className="text-xs text-slate-500 truncate">{desc}</div>
      </div>
    </div>
  );
}

function LoadingSkeleton(props: { count?: number }) {
  const { count = 3 } = props;
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-2 rounded-lg border border-slate-200 animate-pulse">
          <div className="h-10 w-10 rounded-xl bg-slate-100" />
          <div className="flex-1">
            <div className="h-3 w-32 bg-slate-100 rounded mb-2" />
            <div className="h-3 w-48 bg-slate-100 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center border border-dashed border-slate-200 rounded-lg">
      <div className="h-16 w-16 rounded-2xl bg-slate-50 flex items-center justify-center mb-3">
        <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8 text-slate-400">
          <path d="M4 7a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7z" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </div>
      <div className="text-sm font-medium text-slate-700 mb-1">No applications yet</div>
      <div className="text-xs text-slate-500">Kick off a new build to see it here.</div>
    </div>
  );
}

// mock preview removed as requested


