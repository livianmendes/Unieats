import { useRouter } from 'expo-router';
import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/src/components/Button';
import { useAuth } from '@/src/context/auth-context';

export default function SettingsScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Conta</ThemedText>
      <ThemedText type="subtitle">Email</ThemedText>
      <ThemedText>{user?.email ?? '—'}</ThemedText>
      <ThemedText type="subtitle">Perfil</ThemedText>
      <ThemedText>{user?.role === 'vendedor' ? 'Vendedor' : 'Comprador'}</ThemedText>
      <ThemedText type="subtitle">Status</ThemedText>
      <ThemedText>{user?.status === 'pending' ? 'Pendente de validação' : 'Ativo'}</ThemedText>
      <Button
        title="Sair"
        variant="secondary"
        fullWidth
        onPress={() => {
          logout();
          router.replace('/login');
        }}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 12,
  },
});
