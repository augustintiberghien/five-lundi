import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Modal, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import OnboardingScreen from './src/screens/OnboardingScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import RootNavigator from './src/navigation/RootNavigator';
import { SessionsProvider } from './src/store/SessionsContext';
import { ProfileContext } from './src/store/ProfileContext';
import { useOnboarding } from './src/store/useOnboarding';

function AppContent() {
  const { profile, loading, saveProfile } = useOnboarding();
  const [showProfile, setShowProfile] = useState(false);

  if (loading) return <View style={{ flex: 1, backgroundColor: '#0a0a0a' }} />;

  if (!profile) {
    return <OnboardingScreen onDone={saveProfile} />;
  }

  return (
    <ProfileContext.Provider value={{
      profile,
      saveProfile,
      openProfile: () => setShowProfile(true),
    }}>
      <NavigationContainer>
        <StatusBar style="light" />
        <RootNavigator />
      </NavigationContainer>

      <Modal visible={showProfile} animationType="slide" presentationStyle="pageSheet">
        <ProfileScreen
          profile={profile}
          onSave={async (p) => { await saveProfile(p); }}
          onClose={() => setShowProfile(false)}
        />
      </Modal>
    </ProfileContext.Provider>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <SessionsProvider>
        <AppContent />
      </SessionsProvider>
    </SafeAreaProvider>
  );
}
