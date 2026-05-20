import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from './src/navigation/RootNavigator';
import { SessionsProvider } from './src/store/SessionsContext';

export default function App() {
  return (
    <SafeAreaProvider>
      <SessionsProvider>
        <NavigationContainer>
          <StatusBar style="light" />
          <RootNavigator />
        </NavigationContainer>
      </SessionsProvider>
    </SafeAreaProvider>
  );
}
