import { createNativeStackNavigator } from '@react-navigation/native-stack';
import CoachRatingScreen from '../screens/CoachRatingScreen';
import CoachScreen from '../screens/CoachScreen';
import CompoScreen from '../screens/CompoScreen';
import CreateSessionScreen from '../screens/CreateSessionScreen';
import MVPScreen from '../screens/MVPScreen';
import PlayerDetailScreen from '../screens/PlayerDetailScreen';
import PlayersScreen from '../screens/PlayersScreen';
import SessionDetailScreen from '../screens/SessionDetailScreen';
import TabNavigator from './TabNavigator';

export type RootStackParamList = {
  Main: undefined;
  SessionDetail: { sessionId: string };
  Compo: { sessionId: string };
  MVP: { sessionId: string };
  Player: { playerName: string };
  Players: undefined;
  Coach: undefined;
  CoachRating: undefined;
  CreateSession: undefined;
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
      <Stack.Screen name="Compo" component={CompoScreen} />
      <Stack.Screen name="MVP" component={MVPScreen} />
      <Stack.Screen name="Player" component={PlayerDetailScreen} />
      <Stack.Screen name="Players" component={PlayersScreen} />
      <Stack.Screen name="Coach" component={CoachScreen} />
      <Stack.Screen name="CoachRating" component={CoachRatingScreen} />
      <Stack.Screen name="CreateSession" component={CreateSessionScreen} />
    </Stack.Navigator>
  );
}
