import { Image } from 'expo-image';
import { useMemo, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button } from '@/src/components/Button';
import { getProductImage } from '@/src/constants/product-assets';
import { useAuth } from '@/src/context/auth-context';
import { Product, useShop } from '@/src/context/shop-context';

const categories = ['Todos', 'Doces', 'Salgados', 'Lanches', 'Bebidas'];

function money(value: number) {
  return `R$${value.toFixed(2).replace('.', ',')}`;
}

function MenuItem({ product, canBuy, onAdd }: { product: Product; canBuy: boolean; onAdd: () => void }) {
  return (
    <View style={styles.menuItem}>
      <Image source={getProductImage(product.title, product.imageUrl)} style={styles.menuImage} contentFit="cover" />
      <View style={styles.menuContent}>
        <Text style={styles.sellerName}>{product.seller?.name ?? 'UniEats'}</Text>
        <Text style={styles.menuTitle} numberOfLines={1}>{product.title}</Text>
        <Text style={styles.menuDescription} numberOfLines={2}>{product.description}</Text>
        <View style={styles.menuFooter}>
          <Text style={styles.menuPrice}>{money(product.price)}</Text>
          <Text style={styles.stock}>{product.stock} disp.</Text>
        </View>
      </View>
      {canBuy ? (
        <Pressable style={styles.addButton} onPress={onAdd}>
          <Text style={styles.addButtonText}>+</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export default function LojaScreen() {
  const { user } = useAuth();
  const { products, addToCart, addProduct, storeOpen, toggleStoreOpen } = useShop();
  const [category, setCategory] = useState('Todos');
  const [message, setMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('1');
  const [newCategory, setNewCategory] = useState('Doces');
  const [imageUrl, setImageUrl] = useState('');

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory = category === 'Todos' || product.category === category;
      const matchesSeller = user?.role !== 'vendedor' || product.seller?.id === user.sellerProfileId || product.seller?.userId === user.id;
      return matchesCategory && matchesSeller;
    });
  }, [category, products, user?.id, user?.role, user?.sellerProfileId]);

  async function handleAddToCart(productId: string) {
    try {
      setMessage('');
      await addToCart(productId);
      setMessage('Adicionado ao carrinho.');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Não foi possível adicionar.');
    }
  }

  async function handleCreateProduct() {
    const parsedPrice = Number(price.replace(',', '.'));
    const parsedStock = Number(stock);

    if (!title.trim() || !description.trim() || !parsedPrice || parsedPrice <= 0 || !parsedStock || parsedStock <= 0) {
      setMessage('Preencha nome, descrição, preço e estoque válidos.');
      return;
    }

    try {
      await addProduct({
        title: title.trim(),
        description: description.trim(),
        price: parsedPrice,
        category: newCategory,
        stock: parsedStock,
        imageUrl: imageUrl.trim() || undefined,
      });
      setTitle('');
      setDescription('');
      setPrice('');
      setStock('1');
      setNewCategory('Doces');
      setImageUrl('');
      setMessage('Produto cadastrado na vitrine.');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Não foi possível cadastrar o produto.');
    }
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>UniEats</Text>
            <Text style={styles.title}>{user?.role === 'vendedor' ? 'Minha loja' : 'Escolher produtos'}</Text>
          </View>
          {user?.role === 'vendedor' ? (
            <Pressable style={[styles.statusPill, !storeOpen && styles.statusClosed]} onPress={handleToggleStoreOpen}>
              <Text style={styles.statusText}>{storeOpen ? 'Aberta' : 'Fechada'}</Text>
            </Pressable>
          ) : null}
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

        {message ? <Text style={styles.message}>{message}</Text> : null}

        <View style={styles.menuList}>
          {filteredProducts.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>
                {user?.role === 'vendedor' ? 'Nenhum produto cadastrado.' : 'Nenhum produto disponível agora.'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {user?.role === 'vendedor'
                  ? 'Cadastre um item para ele aparecer na sua loja e na vitrine.'
                  : 'Quando um vendedor ativo cadastrar produtos, eles aparecem aqui.'}
              </Text>
            </View>
          ) : null}
          {filteredProducts.map((product) => (
            <MenuItem
              key={product.id}
              product={product}
              canBuy={user?.role === 'comprador'}
              onAdd={() => handleAddToCart(product.id)}
            />
          ))}
        </View>

        {user?.role === 'vendedor' ? (
        <View style={styles.sellerPanel}>
          <View style={styles.sellerHeader}>
            <View>
              <Text style={styles.panelTitle}>Cadastrar item rápido</Text>
              <Text style={styles.panelSubtitle}>Esse item entra no banco e aparece na vitrine em tempo real.</Text>
            </View>
            <Pressable style={styles.formToggle} onPress={() => setShowForm((current) => !current)}>
              <Text style={styles.formToggleText}>{showForm ? '−' : '+'}</Text>
            </Pressable>
          </View>

          {showForm ? (
            <View style={styles.form}>
              <TextInput value={title} onChangeText={setTitle} placeholder="Nome do produto" placeholderTextColor="#8A6F6F" style={styles.input} />
              <TextInput value={description} onChangeText={setDescription} placeholder="Descrição" placeholderTextColor="#8A6F6F" style={styles.input} />
              <TextInput value={imageUrl} onChangeText={setImageUrl} placeholder="URL da foto (opcional)" placeholderTextColor="#8A6F6F" autoCapitalize="none" style={styles.input} />
              <View style={styles.formRow}>
                <TextInput value={price} onChangeText={setPrice} placeholder="Preço" placeholderTextColor="#8A6F6F" keyboardType="decimal-pad" style={[styles.input, styles.inputHalf]} />
                <TextInput value={stock} onChangeText={setStock} placeholder="Estoque" placeholderTextColor="#8A6F6F" keyboardType="numeric" style={[styles.input, styles.inputHalf]} />
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
                {categories.filter((item) => item !== 'Todos').map((item) => (
                  <Pressable
                    key={item}
                    style={[styles.categoryChip, newCategory === item && styles.categoryChipActive]}
                    onPress={() => setNewCategory(item)}>
                    <Text style={[styles.categoryText, newCategory === item && styles.categoryTextActive]}>{item}</Text>
                  </Pressable>
                ))}
              </ScrollView>
              <Button title="Cadastrar produto" fullWidth onPress={handleCreateProduct} />
            </View>
          ) : null}
        </View>
        ) : null}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '900',
    color: '#D82020',
    textTransform: 'uppercase',
  },
  title: {
    marginTop: 3,
    fontSize: 23,
    fontWeight: '900',
    color: '#050505',
  },
  statusPill: {
    height: 36,
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: '#050505',
  },
  statusClosed: {
    backgroundColor: '#8A6F6F',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#FFFFFF',
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
  message: {
    padding: 10,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    color: '#050505',
    fontWeight: '800',
  },
  menuList: {
    gap: 12,
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
    lineHeight: 18,
    fontWeight: '700',
    color: '#604848',
  },
  menuItem: {
    minHeight: 130,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 10,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
  },
  menuImage: {
    width: 104,
    height: 104,
    borderRadius: 14,
    backgroundColor: '#F1BFC0',
  },
  menuContent: {
    flex: 1,
    minWidth: 0,
  },
  sellerName: {
    fontSize: 11,
    fontWeight: '800',
    color: '#7C4E4E',
  },
  menuTitle: {
    marginTop: 2,
    fontSize: 15,
    fontWeight: '900',
    color: '#050505',
  },
  menuDescription: {
    marginTop: 4,
    minHeight: 34,
    fontSize: 12,
    lineHeight: 17,
    color: '#604848',
  },
  menuFooter: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  menuPrice: {
    fontSize: 15,
    fontWeight: '900',
    color: '#050505',
  },
  stock: {
    fontSize: 11,
    fontWeight: '800',
    color: '#7C4E4E',
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#050505',
  },
  addButtonText: {
    fontSize: 22,
    lineHeight: 24,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  sellerPanel: {
    gap: 12,
    padding: 16,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
  },
  sellerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  panelTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#050505',
  },
  panelSubtitle: {
    marginTop: 3,
    fontSize: 12,
    fontWeight: '700',
    color: '#7C4E4E',
  },
  formToggle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#050505',
  },
  formToggleText: {
    fontSize: 24,
    lineHeight: 25,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  form: {
    gap: 10,
  },
  formRow: {
    flexDirection: 'row',
    gap: 10,
  },
  input: {
    height: 44,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#FAD8D8',
    color: '#050505',
    fontWeight: '700',
  },
  inputHalf: {
    flex: 1,
  },
});
