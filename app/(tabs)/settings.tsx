import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/src/components/Button';
import { Input } from '@/src/components/Input';
import { ProductPhotoModal } from '@/src/components/ProductPhotoModal';
import { getProfileImage } from '@/src/constants/product-assets';
import { useAuth } from '@/src/context/auth-context';
import { useShop } from '@/src/context/shop-context';

function money(value: number) {
  return `R$${value.toFixed(2).replace('.', ',')}`;
}

export default function SettingsScreen() {
  const router = useRouter();
  const { user, logout, updateProfile, deleteAccount } = useAuth();
  const { orders, loadOrders, loadSellerOrders, updateOrderStatus, storeOpen, toggleStoreOpen } = useShop();
  const [message, setMessage] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [matricula, setMatricula] = useState('');
  const [curso, setCurso] = useState('');
  const [universidade, setUniversidade] = useState('');
  const [photoOpen, setPhotoOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      return;
    }

    setName(user.name ?? '');
    setPhone(user.phone ?? '');
    setAvatarUrl(user.avatarUrl ?? '');
    setMatricula(user.matricula ?? '');
    setCurso(user.curso ?? '');
    setUniversidade(user.universidade ?? 'UFGD');
  }, [user]);

  useEffect(() => {
    const loader = user?.role === 'vendedor' ? loadSellerOrders : loadOrders;
    loader().catch((err) => {
      setMessage(err instanceof Error ? err.message : 'Não foi possível carregar pedidos.');
    });
  }, [loadOrders, loadSellerOrders, user?.role]);

  async function saveProfile() {
    setMessage('');

    if (!name.trim() || !phone.trim()) {
      setMessage('Informe nome e telefone para salvar o perfil.');
      return;
    }

    if (user?.role === 'vendedor' && (!matricula.trim() || !curso.trim() || !universidade.trim())) {
      setMessage('Vendedores precisam manter matrícula, curso e universidade preenchidos.');
      return;
    }

    try {
      setSavingProfile(true);
      await updateProfile({
        name: name.trim(),
        phone: phone.trim(),
        avatarUrl: avatarUrl.trim() || null,
        matricula: matricula.trim() || undefined,
        curso: curso.trim() || undefined,
        universidade: universidade.trim() || undefined,
      });
      setMessage('Perfil atualizado com sucesso.');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Não foi possível atualizar o perfil.');
    } finally {
      setSavingProfile(false);
    }
  }

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

  function getOrderActionLabel(currentStatus: string) {
    if (currentStatus === 'Aguardando confirmação') return 'Aceitar pedido';
    if (currentStatus === 'Em preparo') return 'Saiu para entrega';
    return 'Finalizar pedido';
  }

  async function handleToggleStoreOpen() {
    try {
      setMessage('');
      await toggleStoreOpen();
      setMessage(storeOpen ? 'Loja fechada. Seus produtos saíram da vitrine geral.' : 'Loja aberta. Seus produtos voltaram para a vitrine.');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Não foi possível alterar o status da loja.');
    }
  }

  async function handleLogout() {
    await logout();
    router.replace('/login');
  }

  async function handleDeleteAccount() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      setMessage('Toque novamente em "Excluir minha conta" para confirmar.');
      return;
    }

    try {
      await deleteAccount();
      router.replace('/login');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Não foi possível excluir a conta.');
    }
  }

  const profileImage = getProfileImage(avatarUrl || user?.avatarUrl, user?.role === 'vendedor' ? 1 : 0);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.profileCard}>
          <Pressable style={styles.avatarButton} onPress={() => setPhotoOpen(true)}>
            <Image source={profileImage} style={styles.avatar} contentFit="cover" />
          </Pressable>
          <View style={styles.profileText}>
            <Text style={styles.name}>{user?.name ?? 'UniEats'}</Text>
            <Text style={styles.email}>{user?.email}</Text>
            <Text style={styles.roleBadge}>{user?.role === 'vendedor' ? 'Perfil vendedor' : 'Perfil comprador'}</Text>
          </View>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>Dados do perfil</Text>
          <Input label="Nome" value={name} onChangeText={setName} placeholder="Seu nome" />
          <Input label="Telefone" value={phone} onChangeText={setPhone} placeholder="67999990000" keyboardType="phone-pad" />
          <Input
            label="Foto do perfil"
            value={avatarUrl}
            onChangeText={setAvatarUrl}
            placeholder="URL da foto"
            keyboardType="url"
            autoCapitalize="none"
          />
          {user?.role === 'vendedor' ? (
            <>
              <Input label="Matrícula" value={matricula} onChangeText={setMatricula} placeholder="20260001" />
              <Input label="Curso" value={curso} onChangeText={setCurso} placeholder="Seu curso" />
              <Input label="Universidade" value={universidade} onChangeText={setUniversidade} placeholder="UFGD" />
            </>
          ) : null}
          <Button title="Salvar perfil" fullWidth loading={savingProfile} onPress={saveProfile} />
        </View>

        {user?.role === 'vendedor' ? (
          <View style={styles.storeCard}>
            <View>
              <Text style={styles.cardTitle}>Status da loja</Text>
              <Text style={styles.cardSubtitle}>{storeOpen ? 'Aberta para reservas' : 'Fechada no momento'}</Text>
            </View>
            <Button title={storeOpen ? 'Fechar' : 'Abrir'} variant="secondary" onPress={handleToggleStoreOpen} />
          </View>
        ) : null}

        {message ? <Text style={styles.message}>{message}</Text> : null}

        <View style={styles.ordersHeader}>
          <Text style={styles.title}>{user?.role === 'vendedor' ? 'Pedidos recebidos' : 'Meus pedidos'}</Text>
          <Text style={styles.count}>{orders.length}</Text>
        </View>

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
                <Text style={styles.itemLine}>Entrega: {order.deliveryPoint}</Text>
                <Text style={styles.itemLine}>Pagamento: {order.paymentMethod}</Text>
                <View style={styles.orderFooter}>
                  <Text style={styles.total}>{money(order.total)}</Text>
                  {user?.role === 'vendedor' && order.status !== 'Finalizado' ? (
                    <Pressable style={styles.nextButton} onPress={() => advanceOrder(order.id, order.status)}>
                      <Text style={styles.nextButtonText}>{getOrderActionLabel(order.status)}</Text>
                    </Pressable>
                  ) : null}
                </View>
              </View>
            ))}
          </View>
        )}

        <Button title="Sair da conta" variant="secondary" fullWidth onPress={handleLogout} />
        <Button title="Excluir minha conta" variant="ghost" fullWidth onPress={handleDeleteAccount} />
      </ScrollView>
      <ProductPhotoModal
        visible={photoOpen}
        source={profileImage}
        title={name || user?.name || 'Perfil UniEats'}
        subtitle={user?.role === 'vendedor' ? 'Perfil vendedor' : 'Perfil comprador'}
        onClose={() => setPhotoOpen(false)}
      />
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
    gap: 14,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
  },
  avatarButton: {
    borderRadius: 29,
  },
  profileText: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontSize: 19,
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
    paddingHorizontal: 9,
    paddingVertical: 4,
    overflow: 'hidden',
    borderRadius: 12,
    backgroundColor: '#050505',
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },
  formCard: {
    gap: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#050505',
  },
  storeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    padding: 14,
    borderRadius: 16,
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
    fontSize: 21,
    fontWeight: '900',
    color: '#050505',
  },
  count: {
    minWidth: 30,
    height: 30,
    overflow: 'hidden',
    textAlign: 'center',
    textAlignVertical: 'center',
    borderRadius: 15,
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
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
  },
  emptyTitle: {
    fontSize: 16,
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
    borderRadius: 16,
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
