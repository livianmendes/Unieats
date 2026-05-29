import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/src/components/Button';
import { Input } from '@/src/components/Input';
import { Order, useShop } from '@/src/context/shop-context';

export default function CarrinhoScreen() {
  const { cartItems, products, cartTotal, removeFromCart, updateCartQuantity, submitOrder, loadCart } = useShop();
  const [deliveryPoint, setDeliveryPoint] = useState('Saguão Bloco C');
  const [paymentMethod, setPaymentMethod] = useState('Pix na entrega');
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);

  useEffect(() => {
    loadCart();
  }, []);

  const items = cartItems.map((item) => ({
    ...item,
    product: products.find((product) => product.id === item.productId),
  }));

  function handleConfirmOrder() {
    if (!items.length) {
      return;
    }

    const order = submitOrder({ deliveryPoint, paymentMethod });
    if (order) {
      setCurrentOrder(order);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
      <ThemedView style={styles.container}>
        <ThemedText type="title">Carrinho</ThemedText>
        {items.length === 0 ? (
          <ThemedText style={styles.emptyText}>Seu carrinho está vazio. Adicione itens do feed para começar.</ThemedText>
        ) : (
          <ThemedView style={styles.cartList}>
            {items.map((item) => (
              <ThemedView key={item.productId} style={styles.cartItem}>
                <View style={styles.cartItemHeader}>
                  <ThemedText type="defaultSemiBold">{item.product?.title}</ThemedText>
                  <Button
                    title="Remover"
                    variant="secondary"
                    onPress={() => removeFromCart(item.productId)}
                  />
                </View>
                <ThemedText style={styles.cartItemSubtitle}>{item.product?.description}</ThemedText>
                <View style={styles.quantityRow}>
                  <Button
                    title="-"
                    variant="secondary"
                    onPress={() => updateCartQuantity(item.productId, item.quantity - 1)}
                  />
                  <ThemedText>{item.quantity}x</ThemedText>
                  <Button
                    title="+"
                    variant="secondary"
                    onPress={() => updateCartQuantity(item.productId, item.quantity + 1)}
                  />
                </View>
              </ThemedView>
            ))}
          </ThemedView>
        )}

        <ThemedView style={styles.checkoutBox}>
          <ThemedText type="subtitle">Ponto de encontro</ThemedText>
          <Input
            label="Local de entrega"
            value={deliveryPoint}
            onChangeText={setDeliveryPoint}
            placeholder="Ex: Saguão Bloco C"
          />
          <ThemedText type="subtitle">Forma de pagamento</ThemedText>
          <View style={styles.paymentButtons}>
            {['Pix na entrega', 'Dinheiro', 'Cartão ao vendedor'].map((method) => (
              <Button
                key={method}
                title={method}
                variant={paymentMethod === method ? 'primary' : 'secondary'}
                onPress={() => setPaymentMethod(method)}
                style={styles.paymentMethod}
              />
            ))}
          </View>
          <ThemedText style={styles.totalText}>Total: R$ {cartTotal.toFixed(2)}</ThemedText>
          <Button
            title="Fechar pedido"
            fullWidth
            onPress={handleConfirmOrder}
            disabled={items.length === 0}
          />
          {currentOrder ? (
            <ThemedText style={styles.orderSent}>
              Pedido #{currentOrder.id} recebido! Status: {currentOrder.status}.
            </ThemedText>
          ) : null}
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
    gap: 16,
  },
  emptyText: {
    lineHeight: 24,
    color: '#475569',
  },
  cartList: {
    gap: 14,
  },
  cartItem: {
    gap: 10,
    padding: 16,
    borderRadius: 18,
  },
  cartItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  cartItemSubtitle: {
    color: '#475569',
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkoutBox: {
    gap: 12,
    padding: 16,
    borderRadius: 20,
  },
  paymentButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  paymentMethod: {
    flex: 1,
  },
  totalText: {
    marginTop: 8,
    fontSize: 18,
  },
  orderSent: {
    marginTop: 12,
    color: '#16A34A',
  },
});
