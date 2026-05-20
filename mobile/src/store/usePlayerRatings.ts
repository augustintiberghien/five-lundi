import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Position } from './useOnboarding';

export type Criterion = 'endurance' | 'vitesse' | 'technique' | 'vision' | 'physique' | 'leadership';

export const CRITERIA_META: {
  key: Criterion; label: string; icon: string; desc: string;
}[] = [
  { key: 'endurance',  label: 'Endurance',  icon: '🫁', desc: 'Maintenir le niveau sur 60 min' },
  { key: 'vitesse',    label: 'Vitesse',    icon: '💨', desc: 'Rapidité balle au pied et en sprint' },
  { key: 'technique',  label: 'Technique',  icon: '🎯', desc: 'Contrôle, passe, frappe' },
  { key: 'vision',     label: 'Vision',     icon: '👁️', desc: 'Lecture du jeu et anticipation' },
  { key: 'physique',   label: 'Physique',   icon: '💪', desc: 'Force, duels, pressing' },
  { key: 'leadership', label: 'Leadership', icon: '🗣️', desc: 'Communication et mentalité' },
];

export type PlayerRatings = Record<Criterion, number>; // 0-20
export type RatingsStore  = Record<string, PlayerRatings>; // playerName → ratings

const CRITERIA: Criterion[] = ['endurance', 'vitesse', 'technique', 'vision', 'physique', 'leadership'];
const DEFAULT_SCORE = 12;
const LOCAL_KEY = '@coach_ratings_v1';

export function defaultRatings(): PlayerRatings {
  return {
    endurance: DEFAULT_SCORE, vitesse: DEFAULT_SCORE,
    technique: DEFAULT_SCORE, vision: DEFAULT_SCORE,
    physique: DEFAULT_SCORE, leadership: DEFAULT_SCORE,
  };
}

type SbRow = { player_name: string; position?: Position } & Record<Criterion, number>;

function rowToRatings(row: SbRow): PlayerRatings {
  const r: Partial<PlayerRatings> = {};
  for (const c of CRITERIA) r[c] = row[c] ?? DEFAULT_SCORE;
  return r as PlayerRatings;
}

export function usePlayerRatings() {
  const [ratings, setRatings]       = useState<RatingsStore>({});
  const [positions, setPositions]   = useState<Record<string, Position>>({});
  const [loaded, setLoaded]         = useState(false);

  useEffect(() => {
    (async () => {
      // 1. Load local cache immediately
      const raw = await AsyncStorage.getItem(LOCAL_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { ratings?: RatingsStore; positions?: Record<string, Position> };
        if (parsed.ratings)   setRatings(parsed.ratings);
        if (parsed.positions) setPositions(parsed.positions);
      }

      // 2. Fetch from Supabase (remote is source of truth)
      try {
        const { data } = await supabase
          .from('coach_ratings')
          .select('*');

        if (data && data.length > 0) {
          const remoteRatings: RatingsStore = {};
          const remotePositions: Record<string, Position> = {};
          for (const row of data as SbRow[]) {
            remoteRatings[row.player_name] = rowToRatings(row);
            if (row.position) remotePositions[row.player_name] = row.position;
          }
          setRatings(remoteRatings);
          setPositions(remotePositions);
          await AsyncStorage.setItem(LOCAL_KEY, JSON.stringify({ ratings: remoteRatings, positions: remotePositions }));
        }
      } catch {
        // offline — keep local
      }

      setLoaded(true);
    })();
  }, []);

  const saveRatings = useCallback(async (nextRatings: RatingsStore, nextPositions?: Record<string, Position>) => {
    const pos = nextPositions ?? positions;
    setRatings(nextRatings);
    if (nextPositions) setPositions(nextPositions);

    // Persist locally
    await AsyncStorage.setItem(LOCAL_KEY, JSON.stringify({ ratings: nextRatings, positions: pos }));

    // Sync to Supabase
    const rows = Object.entries(nextRatings).map(([player_name, r]) => ({
      player_name,
      ...r,
      position: pos[player_name] ?? null,
      updated_at: new Date().toISOString(),
    }));

    try {
      await supabase
        .from('coach_ratings')
        .upsert(rows, { onConflict: 'player_name' });
    } catch {
      // offline — local already saved
    }
  }, [positions]);

  return { ratings, positions, loaded, saveRatings };
}
