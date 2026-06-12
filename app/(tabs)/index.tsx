import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { LogoUniEats } from '@/src/components/LogoUniEats';
import { ProductPhotoModal } from '@/src/components/ProductPhotoModal';
import { getProductImage, heroImage, vendorAvatars } from '@/src/constants/product-assets';
import { useAuth } from '@/src/context/auth-context';
import { Product, useShop } from '@/src/context/shop-context';

const categories = ['Todos', 'Doces', 'Salgados', 'Lanches', 'Bebidas'];

function money(value: number) {
  return `R$${value.toFixed(2).replace('.', ',')}`;
}

function ProductCard({ item, canBuy, onAdd, onPhotoPress }: { item: Product; canBuy: boolean; onAdd: () => void; onPhotoPress: () => void }) {
  return (
    <View style={styles.productCard}>
      <Pressable style={styles.imageButton} onPress={onPhotoPress}>
        <Image source={getProductImage(item.title, item.imageUrl)} style={styles.productImage} contentFit="cover" />
      </Pressable>
      <Text style={styles.sellerName}>{item.seller?.name ?? 'UniEats'}</Text>
      <Text style={styles.productTitle} numberOfLines={1}>{item.title}</Text>
      <Text style={styles.productPrice}>{money(item.price)}</Text>
      {canBuy ? (
        <Pressable style={styles.addSmallButton} onPress={onAdd}>
          <Text style={styles.addSmallText}>Adicionar</Text>
        </Pressable>
      ) : (
        <View style={styles.stockPill}>
          <Text style={styles.stockPillText}>{item.stock} em estoque</Text>
        </View>
      )}
    </View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { products, sellers, cartCount, addToCart, isLoading, error } = useShop();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('Todos');
  const [message, setMessage] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState<Product | null>(null);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory = category === 'Todos' || product.category === category;
      const matchesQuery = `${product.title} ${product.description} ${product.seller?.name ?? ''}`
        .toLowerCase()
        .includes(query.toLowerCase());

      return matchesCategory && matchesQuery;
    });
  }, [category, products, query]);

  const featuredProducts = filteredProducts.slice(0, 4);

  async function handleAddToCart(productId: string) {
    try {
      setMessage('');
      await addToCart(productId);
      setMessage('Produto adicionado ao carrinho.');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Não foi possível adicionar ao carrinho.');
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <LogoUniEats size="sm" />
            <View>
              <Text style={styles.brand}>UNIEATS</Text>
              <Text style={styles.subtitle}>comida universitária pertinho de você</Text>
            </View>
          </View>
          {user?.role === 'comprador' ? (
            <Pressable style={styles.cartPill} onPress={() => router.push('/carrinho')}>
              <Text style={styles.cartPillText}>{cartCount}</Text>
            </Pressable>
          ) : (
            <Pressable style={styles.cartPill} onPress={() => router.push('/loja')}>
              <Text style={styles.cartPillText}>Loja</Text>
            </Pressable>
          )}
        </View>

        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>⌕</Text>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Buscar doces, salgados, bebidas..."
            placeholderTextColor="#8A6F6F"
            style={styles.searchInput}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
          {categories.map((item) => (
            <Pressable
              key={item}
              style={[styles.categoryChip, category === item && styles.categoryChipActive]}
              onPress={() => setCategory(item)}>
              <Text style={[styles.categoryText, category === item && styles.categoryTextActive]}>{item}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.hero}>
          <Image source={heroImage} style={styles.heroImage} contentFit="cover" />
          <View style={styles.heroOverlay}>
            <Text style={styles.heroText}>Encontre sua comida favorita no campus!</Text>
            <Text style={styles.heroSubtext}>Produtos prontos para reservar e retirar.</Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Vendedores</Text>
          <Text style={styles.arrow}>›</Text>
        </View>
        {sellers.length === 0 ? (
          <Text style={styles.mutedText}>Nenhum vendedor ativo ainda.</Text>
        ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.vendorRow}>
          {sellers.map((seller, index) => (
            <View key={seller.id} style={styles.vendorItem}>
              <Image source={vendorAvatars[index % vendorAvatars.length]} style={styles.avatar} contentFit="cover" />
              <Text style={styles.vendorName} numberOfLines={1}>{seller.name}</Text>
              <Text style={styles.vendorMeta}>{seller.productCount} itens</Text>
            </View>
          ))}
        </ScrollView>
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Produtos</Text>
          <Pressable onPress={() => router.push('/loja')}>
            <Text style={styles.viewAll}>Ver todos</Text>
          </Pressable>
        </View>

        {isLoading ? <Text style={styles.mutedText}>Carregando produtos...</Text> : null}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {message ? <Text style={styles.successText}>{message}</Text> : null}

        <View style={styles.grid}>
          {featuredProducts.map((item) => (
            <ProductCard
              key={item.id}
              item={item}
              canBuy={user?.role === 'comprador'}
              onAdd={() => handleAddToCart(item.id)}
              onPhotoPress={() => setSelectedPhoto(item)}
            />
          ))}
        </View>
      </ScrollView>
      <ProductPhotoModal
        visible={Boolean(selectedPhoto)}
        source={selectedPhoto ? getProductImage(selectedPhoto.title, selectedPhoto.imageUrl) : null}
        title={selectedPhoto?.title ?? ''}
        subtitle={selectedPhoto?.seller?.name}
        onClose={() => setSelectedPhoto(null)}
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
    paddingBottom: 100,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brand: {
    fontSize: 22,
    fontWeight: '900',
    color: '#D82020',
  },
  subtitle: {
    maxWidth: 230,
    fontSize: 12,
    fontWeight: '700',
    color: '#1A1111',
  },
  cartPill: {
    minWidth: 42,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#050505',
    paddingHorizontal: 10,
  },
  cartPillText: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  searchBox: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  searchIcon: {
    fontSize: 20,
    fontWeight: '900',
    color: '#050505',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#050505',
  },
  categoryRow: {
    gap: 8,
  },
  categoryChip: {
    height: 34,
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
  },
  categoryChipActive: {
    backgroundColor: '#050505',
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#050505',
  },
  categoryTextActive: {
    color: '#FFFFFF',
  },
  hero: {
    height: 132,
    overflow: 'hidden',
    borderRadius: 18,
    backgroundColor: '#F5BFC0',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    padding: 18,
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  heroText: {
    maxWidth: 230,
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  heroSubtext: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#050505',
  },
  arrow: {
    fontSize: 26,
    fontWeight: '900',
  },
  viewAll: {
    fontSize: 13,
    fontWeight: '900',
    color: '#050505',
  },
  vendorRow: {
    flexDirection: 'row',
    gap: 12,
  },
  vendorItem: {
    width: 70,
    alignItems: 'center',
    gap: 6,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  vendorName: {
    maxWidth: 70,
    fontSize: 12,
    fontWeight: '800',
    color: '#050505',
  },
  vendorMeta: {
    fontSize: 10,
    fontWeight: '700',
    color: '#7C4E4E',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  productCard: {
    width: '48%',
    minHeight: 226,
    padding: 8,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
  },
  productImage: {
    width: '100%',
    aspectRatio: 1.2,
    borderRadius: 12,
    backgroundColor: '#F4BFC0',
  },
  imageButton: {
    borderRadius: 12,
  },
  sellerName: {
    marginTop: 8,
    fontSize: 11,
    fontWeight: '700',
    color: '#7C4E4E',
  },
  productTitle: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: '900',
    color: '#050505',
  },
  productPrice: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: '900',
    color: '#050505',
  },
  addSmallButton: {
    marginTop: 8,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: '#050505',
  },
  addSmallText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  stockPill: {
    marginTop: 8,
    minHeight: 32,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: '#FAD8D8',
  },
  stockPillText: {
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '900',
    color: '#050505',
  },
  mutedText: {
    color: '#6B4C4C',
    fontWeight: '700',
  },
  errorText: {
    color: '#B91C1C',
    fontWeight: '800',
  },
  successText: {
    color: '#166534',
    fontWeight: '900',
  },
});
