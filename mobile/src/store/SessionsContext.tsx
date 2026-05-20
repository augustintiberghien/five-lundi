import { createContext, ReactNode, useCallback, useContext, useState } from 'react';
import { Session, SESSIONS } from '../types/session';

type SessionsCtx = {
  sessions: Session[];
  deleteSession: (id: string) => void;
  addSessions: (s: Session[]) => void;
  updateSession: (id: string, patch: Partial<Session>) => void;
};

const Ctx = createContext<SessionsCtx | null>(null);

export function SessionsProvider({ children }: { children: ReactNode }) {
  const [sessions, setSessions] = useState<Session[]>(SESSIONS);

  const deleteSession = useCallback((id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id));
  }, []);

  const addSessions = useCallback((incoming: Session[]) => {
    setSessions(prev => [...incoming, ...prev]);
  }, []);

  const updateSession = useCallback((id: string, patch: Partial<Session>) => {
    setSessions(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s));
  }, []);

  return (
    <Ctx.Provider value={{ sessions, deleteSession, addSessions, updateSession }}>
      {children}
    </Ctx.Provider>
  );
}

export function useSessions(): SessionsCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useSessions must be used inside SessionsProvider');
  return ctx;
}
