import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button } from '@/src/components/Button';
import { finishImage, getProductImage } from '@/src/constants/product-assets';
import { Order, useShop } from '@/src/context/shop-context';

function money(value: number) {
  return `R$${value.toFixed(2).replace('.', ',')}`;
}

export default function CarrinhoScreen() {
  const router = useRouter();
  const { cartItems, cartTotal, removeFromCart, updateCartQuantity, submitOrder, submitOrderReview } = useShop();
  const [deliveryPoint, setDeliveryPoint] = useState('Saguão Bloco C');
  const [paymentMethod, setPaymentMethod] = useState('Pix na entrega');
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewMessage, setReviewMessage] = useState('');

  const serviceFee = cartItems.length > 0 ? 0 : 0;
  const total = cartTotal + serviceFee;

  async function handleConfirmOrder() {
    if (!cartItems.length) {
      return;
    }

    try {
      setError('');
      setLoading(true);
      const order = await submitOrder({ deliveryPoint, paymentMethod });
      setCurrentOrder(order);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível fechar o pedido.');
    } finally {
      setLoading(false);
    }
  }

  async function handleReviewOrder() {
    if (!currentOrder) {
      return;
    }

    try {
      setReviewMessage('');
      const updatedOrder = await submitOrderReview(currentOrder.id, { rating, reviewComment });
      setCurrentOrder(updatedOrder);
      setReviewMessage('Avaliação enviada. Obrigada pelo feedback!');
    } catch (err) {
      setReviewMessage(err instanceof Error ? err.message : 'Não foi possível enviar a avaliação.');
    }
  }

  if (currentOrder) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.finishScroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.finishTitle}>Pedido Reservado!</Text>
          <Text style={styles.finishCode}>#{currentOrder.id.slice(-6).toUpperCase()}</Text>
          <Text style={styles.finishSubtitle}>Mostre esse pedido para o vendedor no ponto combinado.</Text>

          <View style={styles.receiptCard}>
            <Text style={styles.receiptTitle}>Itens</Text>
            {currentOrder.items.map((item) => (
              <View key={item.product.id} style={styles.receiptItem}>
                <Image source={getProductImage(item.product.title, item.product.imageUrl)} style={styles.receiptImage} contentFit="cover" />
                <View style={styles.receiptInfo}>
                  <Text style={styles.itemName}>{item.product.title}</Text>
                  <Text style={styles.itemMeta}>Quantidade: {item.quantity}</Text>
                </View>
                <Text style={styles.itemPrice}>{money(item.price * item.quantity)}</Text>
              </View>
            ))}

            <View style={styles.totalLine}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalValue}>{money(currentOrder.total)}</Text>
            </View>
            <View style={styles.totalLine}>
              <Text style={styles.totalLabel}>Retirada</Text>
              <Text style={styles.totalValue}>Gratuito</Text>
            </View>
            <View style={styles.totalLineStrong}>
              <Text style={styles.totalStrong}>Total</Text>
              <Text style={styles.totalStrong}>{money(currentOrder.total)}</Text>
            </View>
          </View>

          <Image source={finishImage} style={styles.finishImage} contentFit="cover" />

          <View style={styles.reviewCard}>
            <Text style={styles.receiptTitle}>Avaliação</Text>
            <View style={styles.ratingRow}>
              {[1, 2, 3, 4, 5].map((value) => (
                <Pressable
                  key={value}
                  style={[styles.ratingButton, rating === value && styles.ratingButtonActive]}
                  onPress={() => setRating(value)}>
                  <Text style={[styles.ratingText, rating === value && styles.ratingTextActive]}>{value}</Text>
                </Pressable>
              ))}
            </View>
            <TextInput
              value={reviewComment}
              onChangeText={setReviewComment}
              placeholder="Comentário opcional"
              placeholderTextColor="#8A6F6F"
              style={styles.input}
            />
            {reviewMessage ? <Text style={styles.reviewMessage}>{reviewMessage}</Text> : null}
            <Button title={currentOrder.rating ? 'Atualizar avaliação' : 'Enviar avaliação'} fullWidth variant="secondary" onPress={handleReviewOrder} />
          </View>

          <Button
            title="Voltar à tela inicial"
            fullWidth
            onPress={() => {
              setCurrentOrder(null);
              router.push('/');
            }}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>‹</Text>
          </Pressable>
          <Text style={styles.title}>Finalizar compra</Text>
          <View style={styles.backButtonPlaceholder} />
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Itens</Text>
          <Text style={styles.summaryValue}>Carrinho</Text>
        </View>

        {cartItems.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>Seu carrinho está vazio.</Text>
            <Text style={styles.emptySubtitle}>Escolha produtos da vitrine para montar seu pedido.</Text>
            <Button title="Ver produtos" fullWidth onPress={() => router.push('/loja')} />
          </View>
        ) : (
          <View style={styles.cartList}>
            {cartItems.map((item) => (
              <View key={item.productId} style={styles.cartItem}>
                <Image source={getProductImage(item.product.title, item.product.imageUrl)} style={styles.cartImage} contentFit="cover" />
                <View style={styles.itemContent}>
                  <Text style={styles.itemSeller}>{item.product.seller?.name ?? 'UniEats'}</Text>
                  <Text style={styles.itemName} numberOfLines={1}>{item.product.title}</Text>
                  <Text style={styles.itemMeta}>Quantidade: {item.quantity}</Text>
                  <View style={styles.quantityRow}>
                    <Pressable style={styles.qtyButton} onPress={() => updateCartQuantity(item.productId, item.quantity - 1)}>
                      <Text style={styles.qtyText}>−</Text>
                    </Pressable>
                    <Text style={styles.qtyValue}>{item.quantity}</Text>
                    <Pressable style={styles.qtyButton} onPress={() => updateCartQuantity(item.productId, item.quantity + 1)}>
                      <Text style={styles.qtyText}>+</Text>
                    </Pressable>
                    <Pressable onPress={() => removeFromCart(item.productId)}>
                      <Text style={styles.removeText}>Remover</Text>
                    </Pressable>
                  </View>
                </View>
                <Text style={styles.itemPrice}>{money(item.product.price * item.quantity)}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.checkoutCard}>
          <Text style={styles.cardTitle}>Pagamento</Text>
          <View style={styles.paymentRow}>
            {['Pix na entrega', 'Dinheiro', 'Cartão'].map((method) => (
              <Pressable
                key={method}
                style={[styles.paymentChip, paymentMethod === method && styles.paymentChipActive]}
                onPress={() => setPaymentMethod(method)}>
                <Text style={[styles.paymentText, paymentMethod === method && styles.paymentTextActive]}>{method}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.cardTitle}>Ponto de encontro</Text>
          <TextInput
            value={deliveryPoint}
            onChangeText={setDeliveryPoint}
            placeholder="Ex: Saguão Bloco C"
            placeholderTextColor="#8A6F6F"
            style={styles.input}
          />

          <View style={styles.totalLine}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>{money(cartTotal)}</Text>
          </View>
          <View style={styles.totalLine}>
            <Text style={styles.totalLabel}>Taxa de retirada</Text>
            <Text style={styles.totalValue}>Gratuito</Text>
          </View>
          <View style={styles.totalLineStrong}>
            <Text style={styles.totalStrong}>Total</Text>
            <Text style={styles.totalStrong}>{money(total)}</Text>
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <Button title="Fazer pedido" fullWidth loading={loading} disabled={cartItems.length === 0} onPress={handleConfirmOrder} />
        </View>
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
  finishScroll: {
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
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  backButtonPlaceholder: {
    width: 36,
  },
  backButtonText: {
    marginTop: -2,
    fontSize: 32,
    fontWeight: '900',
    color: '#050505',
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: '#050505',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '900',
    color: '#7C4E4E',
    textTransform: 'uppercase',
  },
  summaryValue: {
    fontSize: 12,
    fontWeight: '900',
    color: '#050505',
  },
  cartList: {
    gap: 12,
  },
  cartItem: {
    flexDirection: 'row',
    gap: 10,
    padding: 10,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
  },
  cartImage: {
    width: 78,
    height: 78,
    borderRadius: 12,
    backgroundColor: '#F1BFC0',
  },
  itemContent: {
    flex: 1,
    minWidth: 0,
  },
  itemSeller: {
    fontSize: 11,
    fontWeight: '800',
    color: '#7C4E4E',
  },
  itemName: {
    marginTop: 2,
    fontSize: 14,
    fontWeight: '900',
    color: '#050505',
  },
  itemMeta: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '700',
    color: '#604848',
  },
  itemPrice: {
    fontSize: 12,
    fontWeight: '900',
    color: '#050505',
  },
  quantityRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  qtyButton: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#050505',
  },
  qtyText: {
    fontSize: 17,
    lineHeight: 18,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  qtyValue: {
    minWidth: 16,
    textAlign: 'center',
    fontWeight: '900',
  },
  removeText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#D82020',
  },
  checkoutCard: {
    gap: 12,
    padding: 16,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#050505',
    textTransform: 'uppercase',
  },
  paymentRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  paymentChip: {
    height: 34,
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderRadius: 17,
    backgroundColor: '#FAD8D8',
  },
  paymentChipActive: {
    backgroundColor: '#050505',
  },
  paymentText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#050505',
  },
  paymentTextActive: {
    color: '#FFFFFF',
  },
  input: {
    height: 44,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#FAD8D8',
    color: '#050505',
    fontWeight: '700',
  },
  totalLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#604848',
  },
  totalValue: {
    fontSize: 13,
    fontWeight: '900',
    color: '#050505',
  },
  totalLineStrong: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1BFC0',
  },
  totalStrong: {
    fontSize: 16,
    fontWeight: '900',
    color: '#050505',
  },
  errorText: {
    color: '#B91C1C',
    fontWeight: '800',
  },
  emptyBox: {
    gap: 12,
    padding: 18,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#050505',
  },
  emptySubtitle: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '700',
    color: '#604848',
  },
  finishTitle: {
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '900',
    color: '#050505',
  },
  finishCode: {
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '900',
    color: '#D82020',
  },
  finishSubtitle: {
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '800',
    color: '#604848',
  },
  receiptCard: {
    gap: 12,
    padding: 16,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
  },
  receiptTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#050505',
    textTransform: 'uppercase',
  },
  receiptItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  receiptImage: {
    width: 58,
    height: 58,
    borderRadius: 12,
  },
  receiptInfo: {
    flex: 1,
    minWidth: 0,
  },
  finishImage: {
    width: '100%',
    height: 160,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
  },
  reviewCard: {
    gap: 12,
    padding: 16,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
  },
  ratingRow: {
    flexDirection: 'row',
    gap: 8,
  },
  ratingButton: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#FAD8D8',
  },
  ratingButtonActive: {
    backgroundColor: '#050505',
  },
  ratingText: {
    fontWeight: '900',
    color: '#050505',
  },
  ratingTextActive: {
    color: '#FFFFFF',
  },
  reviewMessage: {
    color: '#166534',
    fontWeight: '900',
  },
});
