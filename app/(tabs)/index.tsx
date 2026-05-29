import { useEffect } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/src/components/Button';
import { useShop } from '@/src/context/shop-context';

export default function HomeScreen() {
  const { products, storeOpen, addToCart, loadProducts } = useShop();

  useEffect(() => {
    loadProducts();
  }, []);

  const featured = products.slice(0, 3);

  return (
    <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
      <ThemedView style={styles.container}>
        <ThemedText type="title">UniEats</ThemedText>
        <ThemedText style={styles.subtitle}>
          Compre alimentos universitários caseiros em poucos passos.
        </ThemedText>

        <ThemedView style={styles.statusCard}>
          <View>
            <ThemedText type="subtitle">Status da loja</ThemedText>
            <ThemedText style={styles.statusValue}>{storeOpen ? 'Aberta' : 'Fechada'}</ThemedText>
          </View>
          <ThemedText style={styles.statusHint}>
            {storeOpen
              ? 'Pedidos podem ser realizados normalmente.'
              : 'A loja está fechada, novos pedidos não serão aceitos.'}
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText type="subtitle">Produtos em destaque</ThemedText>
          {featured.map((item) => (
            <ThemedView key={item.id} style={styles.productCard}>
              <View style={styles.productInfo}>
                <ThemedText type="defaultSemiBold">{item.title}</ThemedText>
                <ThemedText style={styles.productSubtitle}>{item.description}</ThemedText>
                <ThemedText style={styles.productAvailability}>{item.stock} disponíveis</ThemedText>
              </View>
              <Button
                title="Adicionar"
                variant={storeOpen ? 'primary' : 'secondary'}
                onPress={() => storeOpen && addToCart(item.id)}
              />
            </ThemedView>
          ))}
        </ThemedView>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: 20,
  },
  container: {
    gap: 18,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 22,
  },
  statusCard: {
    gap: 10,
    padding: 18,
    borderRadius: 20,
  },
  statusValue: {
    fontSize: 18,
    marginTop: 4,
  },
  statusHint: {
    color: '#475569',
  },
  section: {
    gap: 12,
  },
  productCard: {
    gap: 10,
    padding: 16,
    borderRadius: 18,
  },
  productInfo: {
    gap: 8,
  },
  productSubtitle: {
    color: '#475569',
  },
  productAvailability: {
    color: '#16A34A',
  },
});
