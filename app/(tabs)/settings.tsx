import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/src/components/Button';
import { vendorAvatars } from '@/src/constants/product-assets';
import { useAuth } from '@/src/context/auth-context';
import { useShop } from '@/src/context/shop-context';

function money(value: number) {
  return `R$${value.toFixed(2).replace('.', ',')}`;
}

export default function SettingsScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { orders, loadOrders, loadSellerOrders, updateOrderStatus, storeOpen, toggleStoreOpen } = useShop();
  const [message, setMessage] = useState('');

  useEffect(() => {
    const loader = user?.role === 'vendedor' ? loadSellerOrders : loadOrders;
    loader().catch((err) => {
      setMessage(err instanceof Error ? err.message : 'Não foi possível carregar pedidos.');
    });
  }, [loadOrders, loadSellerOrders, user?.role]);

  async function advanceOrder(orderId: string, currentStatus: string) {
    const nextStatus =
      currentStatus === 'Aguardando confirmação'
        ? 'Em preparo'
        : currentStatus === 'Em preparo'
          ? 'Saiu para entrega'
          : 'Finalizado';

    try {
      setMessage('');
      await updateOrderStatus(orderId, nextStatus);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Não foi possível atualizar o pedido.');
    }
  }

  async function handleLogout() {
    await logout();
    router.replace('/login');
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.profileCard}>
          <Image source={user?.role === 'vendedor' ? vendorAvatars[1] : vendorAvatars[0]} style={styles.avatar} contentFit="cover" />
          <View style={styles.profileText}>
            <Text style={styles.name}>{user?.name ?? 'UniEats'}</Text>
            <Text style={styles.email}>{user?.email}</Text>
            <Text style={styles.roleBadge}>{user?.role === 'vendedor' ? 'Perfil vendedor' : 'Perfil comprador'}</Text>
          </View>
        </View>

        {user?.role === 'vendedor' ? (
          <View style={styles.storeCard}>
            <View>
              <Text style={styles.cardTitle}>Status da loja</Text>
              <Text style={styles.cardSubtitle}>{storeOpen ? 'Aberta para reservas' : 'Fechada no momento'}</Text>
            </View>
            <Button title={storeOpen ? 'Fechar' : 'Abrir'} variant="secondary" onPress={toggleStoreOpen} />
          </View>
        ) : null}

        <View style={styles.ordersHeader}>
          <Text style={styles.title}>{user?.role === 'vendedor' ? 'Pedidos recebidos' : 'Meus pedidos'}</Text>
          <Text style={styles.count}>{orders.length}</Text>
        </View>

        {message ? <Text style={styles.message}>{message}</Text> : null}

        {orders.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Nenhum pedido por enquanto.</Text>
            <Text style={styles.emptySubtitle}>
              {user?.role === 'vendedor'
                ? 'Quando alguém comprar seus produtos, o pedido aparece aqui.'
                : 'Quando você finalizar uma compra, o acompanhamento aparece aqui.'}
            </Text>
          </View>
        ) : (
          <View style={styles.orderList}>
            {orders.map((order) => (
              <View key={order.id} style={styles.orderCard}>
                <View style={styles.orderTop}>
                  <Text style={styles.orderCode}>Pedido #{order.id.slice(-6).toUpperCase()}</Text>
                  <Text style={styles.status}>{order.status}</Text>
                </View>
                {order.items.map((item) => (
                  <Text key={item.product.id} style={styles.itemLine}>
                    {item.quantity}x {item.product.title}
                  </Text>
                ))}
                <View style={styles.orderFooter}>
                  <Text style={styles.total}>{money(order.total)}</Text>
                  {user?.role === 'vendedor' && order.status !== 'Finalizado' ? (
                    <Pressable style={styles.nextButton} onPress={() => advanceOrder(order.id, order.status)}>
                      <Text style={styles.nextButtonText}>Avançar</Text>
                    </Pressable>
                  ) : null}
                </View>
              </View>
            ))}
          </View>
        )}

        <Button title="Sair da conta" variant="secondary" fullWidth onPress={handleLogout} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAD8D8',
  },
  scroll: {
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
    padding: 18,
    paddingBottom: 105,
    gap: 16,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  profileText: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontSize: 20,
    fontWeight: '900',
    color: '#050505',
  },
  email: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '700',
    color: '#7C4E4E',
  },
  roleBadge: {
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    overflow: 'hidden',
    borderRadius: 14,
    backgroundColor: '#050505',
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },
  storeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    padding: 16,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#050505',
  },
  cardSubtitle: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '700',
    color: '#7C4E4E',
  },
  ordersHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#050505',
  },
  count: {
    minWidth: 32,
    height: 32,
    overflow: 'hidden',
    textAlign: 'center',
    textAlignVertical: 'center',
    borderRadius: 16,
    backgroundColor: '#050505',
    color: '#FFFFFF',
    fontWeight: '900',
  },
  message: {
    padding: 10,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    color: '#050505',
    fontWeight: '800',
  },
  emptyCard: {
    gap: 8,
    padding: 18,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#050505',
  },
  emptySubtitle: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '700',
    color: '#604848',
  },
  orderList: {
    gap: 12,
  },
  orderCard: {
    gap: 10,
    padding: 14,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
  },
  orderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  orderCode: {
    flex: 1,
    fontSize: 14,
    fontWeight: '900',
    color: '#050505',
  },
  status: {
    fontSize: 11,
    fontWeight: '900',
    color: '#D82020',
  },
  itemLine: {
    fontSize: 13,
    fontWeight: '700',
    color: '#604848',
  },
  orderFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  total: {
    fontSize: 16,
    fontWeight: '900',
    color: '#050505',
  },
  nextButton: {
    height: 34,
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderRadius: 17,
    backgroundColor: '#050505',
  },
  nextButtonText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#FFFFFF',
  },
});
