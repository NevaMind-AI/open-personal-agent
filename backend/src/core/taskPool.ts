export type PoolKey = string; // sessionId + '|' + apiKeyHash

export type Task = {
  key: PoolKey;
  sessionId: string;
  apiKey: string;
  createdAt: string;
  abort: AbortController;
};

/**
 * Generic in-memory task pool. Can be reused across transports (WS/HTTP) and features.
 */
export class TaskPool {
  private keyToTask = new Map<PoolKey, Task>();
  private sessionToTask = new Map<string, Task>();

  composeKey(sessionId: string, apiKey: string): PoolKey {
    return `${sessionId}|${this.hash(apiKey)}`;
  }

  private hash(s: string): string {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
    return String(h >>> 0);
  }

  /** Create or reuse a task for (sessionId, apiKey). If apiKey is empty returns null. */
  upsert(sessionId: string, apiKey: string): Task | null {
    const trimmed = (apiKey || '').trim();
    if (!trimmed) return null;
    const key = this.composeKey(sessionId, trimmed);
    if (this.keyToTask.has(key)) return this.keyToTask.get(key)!;

    // cancel existing task of same session (api key changed)
    const existing = this.sessionToTask.get(sessionId);
    if (existing) {
      try { existing.abort.abort(); } catch { /* ignore */ }
      this.keyToTask.delete(existing.key);
      this.sessionToTask.delete(sessionId);
    }

    const task: Task = {
      key,
      sessionId,
      apiKey: trimmed,
      createdAt: new Date().toISOString(),
      abort: new AbortController(),
    };
    this.keyToTask.set(key, task);
    this.sessionToTask.set(sessionId, task);
    return task;
  }

  cancelBySession(sessionId: string): boolean {
    const t = this.sessionToTask.get(sessionId);
    if (!t) return false;
    try { t.abort.abort(); } catch { /* ignore */ }
    this.sessionToTask.delete(sessionId);
    this.keyToTask.delete(t.key);
    return true;
  }
}

export const taskPool = new TaskPool();


