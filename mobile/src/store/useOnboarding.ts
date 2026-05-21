import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export type Role = 'coach' | 'player';
export type Position = 'GK' | 'DEF' | 'MIL' | 'ATT';
export type Criterion = 'endurance' | 'vitesse' | 'technique' | 'vision' | 'physique' | 'leadership';

export type OnboardingProfile = {
  role: Role;
  name: string;
  photoUri?: string;
  bio?: string;
  position?: Position;
  strength?: Criterion;
  weakness?: Criterion;
};

const KEY = '@onboarding_v3';

export function useOnboarding() {
  const [profile, setProfile] = useState<OnboardingProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then(raw => raw ? setProfile(JSON.parse(raw)) : null)
      .finally(() => setLoading(false));
  }, []);

  const saveProfile = useCallback(async (p: OnboardingProfile) => {
    await AsyncStorage.setItem(KEY, JSON.stringify(p));
    setProfile(p);
    // Sync to Supabase player_profiles (fire and forget)
    supabase.from('player_profiles').upsert({
      name: p.name,
      role: p.role,
      bio: p.bio ?? null,
      position: p.position ?? null,
      strength: p.strength ?? null,
      weakness: p.weakness ?? null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'name' }).then(() => {});
  }, []);

  const resetOnboarding = useCallback(async () => {
    await AsyncStorage.removeItem(KEY);
    setProfile(null);
  }, []);

  return { profile, loading, saveProfile, resetOnboarding };
}
