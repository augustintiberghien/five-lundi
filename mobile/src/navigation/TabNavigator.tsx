import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import CalendarScreen from '../screens/CalendarScreen';
import CoachScreen from '../screens/CoachScreen';
import HomeScreen from '../screens/HomeScreen';
import ProfileTab from '../screens/ProfileTab';
import StatsScreen from '../screens/StatsScreen';
import { useProfile } from '../store/ProfileContext';

const Tab = createBottomTabNavigator();

function TabIcon({ label }: { label: string }) {
  return <Text style={{ fontSize: 18 }}>{label}</Text>;
}

export default function TabNavigator() {
  const { profile } = useProfile();
  const isCoach = profile?.role === 'coach';

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#111',
          borderTopColor: '#222',
        },
        tabBarActiveTintColor: '#4CAF50',
        tabBarInactiveTintColor: '#666',
      }}
    >
      <Tab.Screen
        name="Accueil"
        component={HomeScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon label="🏠" /> }}
      />
      {isCoach ? (
        <Tab.Screen
          name="Coach"
          component={CoachScreen}
          options={{ tabBarIcon: ({ focused }) => <TabIcon label="🎯" /> }}
        />
      ) : (
        <Tab.Screen
          name="Calendrier"
          component={CalendarScreen}
          options={{ tabBarIcon: ({ focused }) => <TabIcon label="📅" /> }}
        />
      )}
      <Tab.Screen
        name="Stats"
        component={StatsScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon label="📊" /> }}
      />
      <Tab.Screen
        name="Profil"
        component={ProfileTab}
        options={{ tabBarIcon: ({ focused }) => <TabIcon label="👤" /> }}
      />
    </Tab.Navigator>
  );
}
