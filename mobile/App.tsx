import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Modal, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import OnboardingScreen from './src/screens/OnboardingScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import AuthScreen from './src/screens/AuthScreen';
import RootNavigator from './src/navigation/RootNavigator';
import { navigationRef } from './src/navigation/navigationRef';
import { SessionsProvider } from './src/store/SessionsContext';
import { ProfileContext } from './src/store/ProfileContext';
import { AuthProvider, useAuth } from './src/store/AuthContext';
import { useOnboarding, OnboardingProfile } from './src/store/useOnboarding';
import { usePushNotifications } from './src/store/usePushNotifications';

const DEV_SKIP_AUTH = __DEV__;

const DEV_PROFILE: OnboardingProfile = { role: 'coach', name: 'Dev' };

function AppContent() {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading, saveProfile } = useOnboarding();
  const [showProfile, setShowProfile] = useState(false);

  usePushNotifications();

  if (authLoading || profileLoading) {
    return <View style={{ flex: 1, backgroundColor: '#0d1117' }} />;
  }

  if (!user && !DEV_SKIP_AUTH) {
    return <AuthScreen />;
  }

  const activeProfile = profile ?? (DEV_SKIP_AUTH ? DEV_PROFILE : null);

  if (!activeProfile) {
    return <OnboardingScreen onDone={saveProfile} />;
  }

  return (
    <ProfileContext.Provider value={{
      profile: activeProfile,
      saveProfile,
      openProfile: () => setShowProfile(true),
    }}>
      <NavigationContainer ref={navigationRef}>
        <StatusBar style="light" />
        <RootNavigator />
      </NavigationContainer>

      <Modal visible={showProfile} animationType="slide" presentationStyle="pageSheet">
        <ProfileScreen
          profile={activeProfile}
          onSave={async (p) => { await saveProfile(p); }}
          onClose={() => setShowProfile(false)}
        />
      </Modal>
    </ProfileContext.Provider>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <SessionsProvider>
            <AppContent />
          </SessionsProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
