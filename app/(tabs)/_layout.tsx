import { Tabs } from 'expo-router';
import { useContext } from 'react';
import { Text } from 'react-native';
import { AppContext } from '../_layout';

export default function TabLayout() {
  const context = useContext(AppContext);
  const theme = context?.theme;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme?.primary || '#2980B9',
        tabBarInactiveTintColor: theme?.textMuted || '#999',
        tabBarStyle: {
          backgroundColor: theme?.tabBar || '#fff',
          borderTopWidth: 1,
          borderTopColor: theme?.tabBarBorder || '#eee',
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        headerStyle: {
          backgroundColor: theme?.headerBackground || '#2980B9',
        },
        headerTintColor: theme?.headerText || '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 20,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'My Trips',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 24, color }}></Text>,
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Map',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 24, color }}></Text>,
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          title: 'Insights',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 24, color }}></Text>,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 24, color }}></Text>,
        }}
      />
    </Tabs>
  );
}