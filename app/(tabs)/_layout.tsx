import { Tabs, useRouter } from 'expo-router';
import React, { useEffect } from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/src/constants/theme';
import { useAuth } from '@/src/context/auth-context';

export default function TabLayout() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login');
    }
  }, [isLoading, router, user]);

  if (isLoading || !user) {
    return null;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.light.tint,
        tabBarInactiveTintColor: '#111111',
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: '#FAD8D8',
          borderTopWidth: 0,
          height: 72,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        },
        headerShown: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Início',
          tabBarIcon: ({ color }) => <IconSymbol size={25} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="loja"
        options={{
          title: user.role === 'vendedor' ? 'Minha loja' : 'Produtos',
          tabBarIcon: ({ color }) => <IconSymbol size={25} name="bag.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="carrinho"
        options={{
          title: 'Carrinho',
          href: user.role === 'comprador' ? '/carrinho' : null,
          tabBarIcon: ({ color }) => <IconSymbol size={25} name="cart.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Social',
          tabBarIcon: ({ color }) => <IconSymbol size={25} name="paperplane.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color }) => <IconSymbol size={25} name="person.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}
