import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

export type Position = 'GK' | 'DEF' | 'MIL' | 'ATT';
export type Criterion = 'endurance' | 'vitesse' | 'technique' | 'vision' | 'physique' | 'leadership';

export type OnboardingProfile = {
  name: string;
  photoUri?: string;    // local URI from image picker
  bio?: string;
  position: Position;
  strength: Criterion;
  weakness: Criterion;
};

const KEY = '@onboarding_v2';

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
  }, []);

  const resetOnboarding = useCallback(async () => {
    await AsyncStorage.removeItem(KEY);
    setProfile(null);
  }, []);

  return { profile, loading, saveProfile, resetOnboarding };
}
