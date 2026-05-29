import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/src/components/Button';
import { Input } from '@/src/components/Input';
import { LogoUniEats } from '@/src/components/LogoUniEats';
import { useShop } from '@/src/context/shop-context';

export default function LojaScreen() {
  const { products, storeOpen, toggleStoreOpen, addProduct, orders, updateOrderStatus, loadSellerOrders } = useShop();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('Salgados');
  const [stock, setStock] = useState('1');

  useEffect(() => {
    loadSellerOrders();
  }, []);

  function handleAddProduct() {
    const parsedPrice = Number(price.replace(',', '.'));
    const parsedStock = Number(stock);

    if (!title || !description || !parsedPrice || parsedPrice <= 0 || !parsedStock || parsedStock <= 0) {
      return;
    }

    addProduct({
      title,
      description,
      price: parsedPrice,
      category,
      stock: parsedStock,
    });

    setTitle('');
    setDescription('');
    setPrice('');
    setCategory('Salgados');
    setStock('1');
  }

  return (
    <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
      <ThemedView style={styles.container}>
        <LogoUniEats size="md" />
        <ThemedText type="title" style={styles.title}>
          Painel do Vendedor
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          Controle sua loja, atualize o cardápio e gerencie pedidos em tempo real.
        </ThemedText>

        <View style={styles.statusRow}>
          <View>
            <ThemedText type="subtitle">Status da loja</ThemedText>
            <ThemedText style={styles.statusValue}>
              {storeOpen ? 'Aberta' : 'Fechada'}
            </ThemedText>
          </View>
          <Button
            title={storeOpen ? 'Fechar loja' : 'Abrir loja'}
            variant={storeOpen ? 'secondary' : 'primary'}
            onPress={toggleStoreOpen}
            style={styles.statusButton}
          />
        </View>

        <ThemedView style={styles.productForm}>
          <ThemedText type="subtitle">Cadastrar produto</ThemedText>
          <Input
            label="Título"
            value={title}
            onChangeText={setTitle}
            placeholder="Nome do alimento"
          />
          <Input
            label="Descrição"
            value={description}
            onChangeText={setDescription}
            placeholder="Ex: porção com 5 unidades"
          />
          <Input
            label="Preço"
            value={price}
            onChangeText={setPrice}
            placeholder="12,50"
            keyboardType="decimal-pad"
          />
          <Input
            label="Categoria"
            value={category}
            onChangeText={setCategory}
            placeholder="Salgados, Doces, Bebidas"
          />
          <Input
            label="Estoque"
            value={stock}
            onChangeText={setStock}
            placeholder="Quantidade disponível"
            keyboardType="numeric"
          />
          <Button title="Adicionar produto" fullWidth onPress={handleAddProduct} />
        </ThemedView>

        <ThemedView style={styles.ordersSection}>
          <ThemedText type="subtitle">Pedidos recebidos</ThemedText>
          {orders.length === 0 ? (
            <ThemedText style={styles.emptyOrders}>Nenhum pedido por enquanto.</ThemedText>
          ) : (
            orders.map((order) => (
              <ThemedView key={order.id} style={styles.orderCard}>
                <View style={styles.orderHeader}>
                  <ThemedText type="defaultSemiBold">Pedido #{order.id}</ThemedText>
                  <ThemedText>{order.status}</ThemedText>
                </View>
                <ThemedText style={styles.orderDetail}>Entrega: {order.deliveryPoint}</ThemedText>
                <ThemedText style={styles.orderDetail}>Pagamento: {order.paymentMethod}</ThemedText>
                <ThemedText style={styles.orderDetail}>Total: R$ {order.total.toFixed(2)}</ThemedText>
                <View style={styles.orderActions}>
                  {order.status === 'Aguardando confirmação' ? (
                    <Button
                      title="Aceitar pedido"
                      onPress={() => updateOrderStatus(order.id, 'Em preparo')}
                    />
                  ) : order.status === 'Em preparo' ? (
                    <Button
                      title="Saiu para entrega"
                      onPress={() => updateOrderStatus(order.id, 'Saiu para entrega')}
                    />
                  ) : order.status === 'Saiu para entrega' ? (
                    <Button
                      title="Finalizar pedido"
                      onPress={() => updateOrderStatus(order.id, 'Finalizado')}
                    />
                  ) : null}
                </View>
              </ThemedView>
            ))
          )}
        </ThemedView>

        <ThemedView style={styles.storeList}>
          <ThemedText type="subtitle">Produtos cadastrados</ThemedText>
          {products.map((product) => (
            <ThemedView key={product.id} style={styles.productCard}>
              <View style={styles.productHeader}>
                <ThemedText type="defaultSemiBold">{product.title}</ThemedText>
                <ThemedText style={styles.productPrice}>R$ {product.price.toFixed(2)}</ThemedText>
              </View>
              <ThemedText style={styles.productDescription}>{product.description}</ThemedText>
              <View style={styles.productMetaRow}>
                <ThemedText>{product.category}</ThemedText>
                <ThemedText>{product.stock} disponíveis</ThemedText>
              </View>
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
  title: {
    marginTop: 8,
  },
  subtitle: {
    marginBottom: 12,
    fontSize: 16,
    lineHeight: 22,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  statusValue: {
    marginTop: 4,
    fontSize: 18,
  },
  statusButton: {
    minWidth: 140,
  },
  productForm: {
    gap: 12,
    padding: 16,
    borderRadius: 20,
  },
  storeList: {
    gap: 12,
  },
  productCard: {
    gap: 8,
    padding: 14,
    borderRadius: 16,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  productPrice: {
    fontSize: 16,
  },
  productDescription: {
    color: '#475569',
  },
  productMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
