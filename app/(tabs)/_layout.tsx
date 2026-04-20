import { Tabs } from 'expo-router';
import { useContext } from 'react';
import { AppContext } from '../_layout';

export default function TabLayout() {
  const context = useContext(AppContext);
  const theme = context?.theme;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme?.primary || '#2980B9',
        tabBarInactiveTintColor: theme?.textMuted || '#999',
        tabBarLabelStyle: {
          fontSize: 16,
          fontWeight: '600',
          marginTop: 0,
          marginBottom: 0,
        },
        tabBarStyle: {
          backgroundColor: theme?.tabBar || '#fff',
          borderTopWidth: 1,
          borderTopColor: theme?.tabBarBorder || '#eee',
          paddingBottom: 0,
          paddingTop: 5,
          height: 50,
          justifyContent: 'center',
        },
        tabBarIconStyle: {
          display: 'none',
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
          tabBarIcon: () => null,
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Map',
          tabBarIcon: () => null,
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          title: 'Insights',
          tabBarIcon: () => null,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: () => null,
        }}
      />
    </Tabs>
  );
}