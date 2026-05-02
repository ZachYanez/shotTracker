import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import { View } from 'react-native';

import { palette } from '@/lib/theme';

type IoniconsName = ComponentProps<typeof Ionicons>['name'];

function TabIcon({
  name,
  color,
  size,
  focused,
}: {
  name: IoniconsName;
  color: string;
  size: number;
  focused: boolean;
}) {
  return (
    <View style={{ alignItems: 'center', gap: 4 }}>
      <Ionicons name={name} size={size} color={color} />
      {/* Neon indicator dot under the active tab icon */}
      {focused ? (
        <View
          style={{
            backgroundColor: palette.accent,
            borderRadius: 2,
            height: 3,
            shadowColor: palette.accent,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.9,
            shadowRadius: 6,
            width: 18,
          }}
        />
      ) : (
        <View style={{ height: 3, width: 18 }} />
      )}
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: palette.background },
        tabBarActiveTintColor: palette.accent,
        tabBarInactiveTintColor: palette.textSubtle,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          letterSpacing: 0.4,
          marginTop: -2,
        },
        tabBarStyle: {
          backgroundColor: 'rgba(7, 7, 14, 0.97)',
          borderTopColor: palette.glassBorder,
          borderTopWidth: 1,
          height: 84,
          paddingBottom: 28,
          paddingTop: 8,
        },
        tabBarLabelPosition: 'below-icon',
        tabBarAllowFontScaling: false,
        tabBarShowLabel: true,
      }}>
      <Tabs.Screen
        name="today"
        options={{
          title: 'Today',
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon focused={focused} name="flash" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="sessions"
        options={{
          title: 'Sessions',
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon focused={focused} name="basketball" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon focused={focused} name="bar-chart" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon focused={focused} name="person" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
