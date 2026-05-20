import { createContext, ReactNode, useContext } from 'react';
import { OnboardingProfile } from './useOnboarding';

type ProfileCtx = {
  profile: OnboardingProfile | null;
  saveProfile: (p: OnboardingProfile) => Promise<void>;
  openProfile: () => void;
};

export const ProfileContext = createContext<ProfileCtx | null>(null);

export function useProfile(): ProfileCtx {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used inside ProfileContext.Provider');
  return ctx;
}
