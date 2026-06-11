import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

function tabIcon(name: IoniconsName, focusedName: IoniconsName) {
  return ({ color, size, focused }: { color: string; size: number; focused: boolean }) => (
    <Ionicons name={focused ? focusedName : name} size={size} color={color} />
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#FF6F0F',
        tabBarInactiveTintColor: '#888888',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: '#E0E0E0',
          paddingBottom: insets.bottom,
          height: 54 + insets.bottom,
        },
        tabBarLabelStyle: styles.tabLabel,
      }}>
      <Tabs.Screen name="index"     options={{ title: '홈',      tabBarIcon: tabIcon('home-outline',      'home')      }} />
      <Tabs.Screen name="community" options={{ title: '동네생활', tabBarIcon: tabIcon('newspaper-outline',  'newspaper')  }} />
      <Tabs.Screen name="nearby"    options={{ title: '내 근처', tabBarIcon: tabIcon('location-outline',   'location')   }} />
      <Tabs.Screen name="profile"   options={{ title: '나의 당근', tabBarIcon: tabIcon('person-outline',   'person')     }} />
      <Tabs.Screen name="explore"   options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabLabel: { fontSize: 11, fontWeight: '500' },
});
