import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/HomeScreen';
import CompoScreen from '../screens/CompoScreen';
import StatsScreen from '../screens/StatsScreen';
import MVPScreen from '../screens/MVPScreen';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
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
      <Tab.Screen name="Accueil" component={HomeScreen} />
      <Tab.Screen name="Compo" component={CompoScreen} />
      <Tab.Screen name="Stats" component={StatsScreen} />
      <Tab.Screen name="MVP" component={MVPScreen} />
    </Tab.Navigator>
  );
}
