import { createContext, useContext } from 'react';

export type WsMsg = { dir: 'in' | 'out'; data: unknown; at: string };

export type ToolsContextValue = {
  connected: boolean;
  history: WsMsg[];
  input: string;
  setInput(v: string): void;
  connect(): void;
  disconnect(): void;
  send(): void;
};

export const ToolsCtx = createContext<ToolsContextValue | null>(null);

export function useTools() {
  const v = useContext(ToolsCtx);
  if (!v) throw new Error('useTools must be used within ToolsProvider');
  return v;
}


