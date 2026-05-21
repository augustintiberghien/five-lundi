import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Session, SESSIONS as STATIC_SESSIONS } from '../types/session';

type SessionsCtx = {
  sessions: Session[];
  loading: boolean;
  deleteSession: (id: string) => void;
  addSessions: (s: Session[]) => Promise<void>;
  updateSession: (id: string, patch: Partial<Session>) => void;
};

const Ctx = createContext<SessionsCtx | null>(null);

type SbRow = {
  id: string; date: string; date_iso: string; score: string; score_winner: string;
  name_a: string; name_b: string; inscriptions_open: boolean; max_players: number;
  confirmed_count: number; bench_count: number; time?: string; location?: string;
  mvp?: string; vote_open?: boolean; article?: string;
  players?: { name: string; team: 'A' | 'B' }[];
  compo?: Record<string, string>;
};

function rowToSession(row: SbRow): Session {
  return {
    id: row.id,
    date: row.date,
    dateISO: row.date_iso,
    score: row.score,
    scoreWinner: row.score_winner as Session['scoreWinner'],
    nameA: row.name_a,
    nameB: row.name_b,
    inscriptionsOpen: row.inscriptions_open,
    maxPlayers: row.max_players,
    confirmedCount: row.confirmed_count,
    benchCount: row.bench_count,
    time: row.time,
    location: row.location,
    mvp: row.mvp,
    voteOpen: row.vote_open,
    article: row.article,
    players: row.players,
    compo: row.compo,
  };
}

function sessionToRow(s: Session): Record<string, unknown> {
  return {
    id: s.id,
    date: s.date,
    date_iso: s.dateISO,
    score: s.score,
    score_winner: s.scoreWinner,
    name_a: s.nameA,
    name_b: s.nameB,
    inscriptions_open: s.inscriptionsOpen,
    max_players: s.maxPlayers,
    confirmed_count: s.confirmedCount,
    bench_count: s.benchCount,
    time: s.time ?? null,
    location: s.location ?? null,
    mvp: s.mvp ?? null,
    vote_open: s.voteOpen ?? false,
    article: s.article ?? null,
    players: s.players ?? null,
    compo: s.compo ?? null,
  };
}

export function SessionsProvider({ children }: { children: ReactNode }) {
  const [sessions, setSessions] = useState<Session[]>(STATIC_SESSIONS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase
          .from('sessions')
          .select('*')
          .order('date_iso', { ascending: false });

        if (data && data.length > 0) {
          const remote = (data as SbRow[]).map(rowToSession);
          // Merge: remote wins, but fill article/players/compo from static if missing
          const merged = remote.map(r => {
            const stat = STATIC_SESSIONS.find(s => s.id === r.id);
            return {
              ...r,
              article: r.article ?? stat?.article,
              players: r.players ?? stat?.players,
              compo: r.compo ?? stat?.compo,
            };
          });
          // Append static sessions not yet in Supabase
          const remoteIds = new Set(merged.map(s => s.id));
          const staticOnly = STATIC_SESSIONS.filter(s => !remoteIds.has(s.id));
          setSessions([...merged, ...staticOnly]);
        }
      } catch {
        // offline — keep static
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const deleteSession = useCallback((id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id));
    supabase.from('sessions').delete().eq('id', id).then(() => {});
  }, []);

  const addSessions = useCallback(async (incoming: Session[]) => {
    setSessions(prev => [...incoming, ...prev]);
    try {
      await supabase.from('sessions').upsert(incoming.map(sessionToRow), { onConflict: 'id' });
    } catch {
      // offline — local already updated
    }
  }, []);

  const updateSession = useCallback((id: string, patch: Partial<Session>) => {
    setSessions(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s));
    const dbPatch: Record<string, unknown> = {};
    if (patch.score !== undefined) dbPatch.score = patch.score;
    if (patch.scoreWinner !== undefined) dbPatch.score_winner = patch.scoreWinner;
    if (patch.confirmedCount !== undefined) dbPatch.confirmed_count = patch.confirmedCount;
    if (patch.benchCount !== undefined) dbPatch.bench_count = patch.benchCount;
    if (patch.inscriptionsOpen !== undefined) dbPatch.inscriptions_open = patch.inscriptionsOpen;
    if (patch.mvp !== undefined) dbPatch.mvp = patch.mvp;
    if (patch.voteOpen !== undefined) dbPatch.vote_open = patch.voteOpen;
    if (Object.keys(dbPatch).length > 0) {
      supabase.from('sessions').update(dbPatch).eq('id', id).then(() => {});
    }
  }, []);

  return (
    <Ctx.Provider value={{ sessions, loading, deleteSession, addSessions, updateSession }}>
      {children}
    </Ctx.Provider>
  );
}

export function useSessions(): SessionsCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useSessions must be used inside SessionsProvider');
  return ctx;
}
