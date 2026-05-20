import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import OnboardingScreen from './src/screens/OnboardingScreen';
import RootNavigator from './src/navigation/RootNavigator';
import { SessionsProvider } from './src/store/SessionsContext';
import { useOnboarding } from './src/store/useOnboarding';

function AppContent() {
  const { profile, loading, saveProfile } = useOnboarding();

  if (loading) return <View style={{ flex: 1, backgroundColor: '#0a0a0a' }} />;

  if (!profile) {
    return <OnboardingScreen onDone={saveProfile} />;
  }

  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <RootNavigator />
    </NavigationContainer>
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
