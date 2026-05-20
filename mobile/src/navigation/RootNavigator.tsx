import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SessionDetailScreen from '../screens/SessionDetailScreen';
import TabNavigator from './TabNavigator';

export type RootStackParamList = {
  Main: undefined;
  SessionDetail: { sessionId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#0a0a0a' },
        animation: 'slide_from_bottom',
      }}
    >
      <Stack.Screen name="Main" component={TabNavigator} />
      <Stack.Screen name="SessionDetail" component={SessionDetailScreen} />
    </Stack.Navigator>
  );
}
