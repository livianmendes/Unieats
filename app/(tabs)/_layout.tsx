import { Tabs, useRouter } from 'expo-router';
import React, { useEffect } from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/src/constants/theme';
import { useAuth } from '@/src/context/auth-context';

export default function TabLayout() {
  const router = useRouter();
  const { user } = useAuth();
  const colorScheme = useColorScheme();

  useEffect(() => {
    if (!user) {
      router.replace('/login');
    }
  }, [router, user]);

  if (!user) {
    return null;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Feed',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      {user.role === 'vendedor' ? (
        <Tabs.Screen
          name="loja"
          options={{
            title: 'Loja',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="bag.fill" color={color} />,
          }}
        />
      ) : null}
      {user.role === 'comprador' ? (
        <Tabs.Screen
          name="carrinho"
          options={{
            title: 'Carrinho',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="cart.fill" color={color} />,
          }}
        />
      ) : null}
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Conta',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}
