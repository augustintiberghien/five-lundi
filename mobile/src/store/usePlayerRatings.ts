import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

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

const DEFAULT_SCORE = 12;
const KEY = '@coach_ratings_v1';

export function defaultRatings(): PlayerRatings {
  return {
    endurance: DEFAULT_SCORE, vitesse: DEFAULT_SCORE,
    technique: DEFAULT_SCORE, vision: DEFAULT_SCORE,
    physique: DEFAULT_SCORE, leadership: DEFAULT_SCORE,
  };
}

export function usePlayerRatings() {
  const [ratings, setRatings] = useState<RatingsStore>({});
  const [loaded, setLoaded]   = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then(raw => raw ? setRatings(JSON.parse(raw)) : null)
      .finally(() => setLoaded(true));
  }, []);

  const saveRatings = useCallback(async (next: RatingsStore) => {
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
    setRatings(next);
  }, []);

  return { ratings, loaded, saveRatings };
}
