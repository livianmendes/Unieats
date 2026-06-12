import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { API_BASE } from '@/src/constants/api';
import { useAuth } from '@/src/context/auth-context';
import { getCachedData, ONE_DAY_MS, ONE_HOUR_MS, removeCachedData, setCachedData, SHOP_CACHE_KEYS } from '@/src/utils/shop-cache';

export type Product = {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  imageUrl?: string | null;
  seller?: { id: string; userId?: string; name: string; email?: string; storeOpen?: boolean; avatarUrl?: string | null };
};

type NewProduct = Pick<Product, 'title' | 'description' | 'price' | 'category' | 'stock' | 'imageUrl'>;

export type SellerProfile = {
  id: string;
  userId: string;
  name: string;
  email?: string;
  phone?: string;
  avatarUrl?: string | null;
  matricula?: string;
  curso?: string;
  universidade?: string;
  storeOpen: boolean;
  productCount: number;
};

export type CartItem = {
  id: string;
  productId: string;
  quantity: number;
  product: Product;
};

type OrderStatus =
  | 'Aguardando confirmação'
  | 'Em preparo'
  | 'Saiu para entrega'
  | 'Finalizado';

export type Order = {
  id: string;
  items: { product: Product; quantity: number; price: number }[];
  total: number;
  deliveryPoint: string;
  paymentMethod: string;
  status: OrderStatus;
  rating?: number | null;
  reviewComment?: string | null;
  createdAt: string;
};

type ShopContextData = {
  products: Product[];
  sellers: SellerProfile[];
  cartItems: CartItem[];
  orders: Order[];
  storeOpen: boolean;
  isLoading: boolean;
  error: string;
  addProduct: (product: NewProduct) => Promise<void>;
  toggleStoreOpen: () => Promise<void>;
  addToCart: (productId: string) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  updateCartQuantity: (productId: string, quantity: number) => Promise<void>;
  clearCart: () => void;
  submitOrder: (details: { deliveryPoint: string; paymentMethod: string }) => Promise<Order>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  submitOrderReview: (orderId: string, details: { rating: number; reviewComment: string }) => Promise<Order>;
  cartTotal: number;
  cartCount: number;
  loadProducts: () => Promise<void>;
  loadSellers: () => Promise<void>;
  loadCart: () => Promise<void>;
  loadOrders: () => Promise<void>;
  loadSellerOrders: () => Promise<void>;
};

const ShopContext = createContext<ShopContextData | undefined>(undefined);

async function readApiResponse<T>(response: Response): Promise<T> {
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Não foi possível concluir a operação.');
  }

  return data;
}

function isConnectionError(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : '';
  return message.includes('network') || message.includes('fetch') || message.includes('conexão');
}

function createOfflineError(error: unknown, message: string) {
  if (isConnectionError(error)) {
    return new Error(`Sem conexão. ${message}`);
  }

  return error;
}

export function ShopProvider({ children }: { children: React.ReactNode }) {
  const { token, user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [sellers, setSellers] = useState<SellerProfile[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [storeOpen, setStoreOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.role === 'vendedor') {
      setStoreOpen(user.storeOpen ?? true);
    }
  }, [user?.role, user?.storeOpen]);

  const getAuthHeaders = useCallback(() => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }), [token]);

  const loadProducts = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/products`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const data = await readApiResponse<Product[]>(response);
      setProducts(data);
      await setCachedData(SHOP_CACHE_KEYS.products, data);
    } catch (err) {
      const cachedProducts = await getCachedData<Product[]>(SHOP_CACHE_KEYS.products, ONE_DAY_MS);

      if (cachedProducts) {
        setProducts(cachedProducts);
        setError('Sem conexão. Exibindo cardápio salvo.');
        return;
      }

      throw createOfflineError(err, 'Não foi possível carregar o cardápio.');
    }
  }, [token]);

  const loadSellers = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/sellers`);
      const data = await readApiResponse<SellerProfile[]>(response);
      setSellers(data);
      await setCachedData(SHOP_CACHE_KEYS.sellers, data);
    } catch (err) {
      const cachedSellers = await getCachedData<SellerProfile[]>(SHOP_CACHE_KEYS.sellers, ONE_DAY_MS);

      if (cachedSellers) {
        setSellers(cachedSellers);
        setError('Sem conexão. Exibindo vendedores salvos.');
        return;
      }

      throw createOfflineError(err, 'Não foi possível carregar vendedores.');
    }
  }, []);

  const loadCart = useCallback(async () => {
    if (!token || user?.role !== 'comprador') {
      setCartItems([]);
      return;
    }

    const cacheKey = SHOP_CACHE_KEYS.cart(user.id);

    try {
      const response = await fetch(`${API_BASE}/cart`, { headers: getAuthHeaders() });
      const data = await readApiResponse<CartItem[]>(response);
      setCartItems(data);
      await setCachedData(cacheKey, data);
    } catch (err) {
      const cachedCart = await getCachedData<CartItem[]>(cacheKey, ONE_HOUR_MS);

      if (cachedCart) {
        setCartItems(cachedCart);
        setError('Sem conexão. Exibindo carrinho salvo por até 1 hora.');
        return;
      }

      throw createOfflineError(err, 'Não foi possível carregar o carrinho.');
    }
  }, [getAuthHeaders, token, user?.id, user?.role]);

  const loadOrders = useCallback(async () => {
    if (!token || !user) {
      setOrders([]);
      return;
    }

    const cacheKey = SHOP_CACHE_KEYS.orders(user.id, 'buyer');

    try {
      const response = await fetch(`${API_BASE}/orders`, { headers: getAuthHeaders() });
      const data = await readApiResponse<Order[]>(response);
      setOrders(data);
      await setCachedData(cacheKey, data);
    } catch (err) {
      const cachedOrders = await getCachedData<Order[]>(cacheKey, ONE_DAY_MS);

      if (cachedOrders) {
        setOrders(cachedOrders);
        setError('Sem conexão. Exibindo histórico de pedidos salvo.');
        return;
      }

      throw createOfflineError(err, 'Não foi possível carregar os pedidos.');
    }
  }, [getAuthHeaders, token, user]);

  const loadSellerOrders = useCallback(async () => {
    if (!token || user?.role !== 'vendedor') {
      setOrders([]);
      return;
    }

    const cacheKey = SHOP_CACHE_KEYS.orders(user.id, 'seller');

    try {
      const response = await fetch(`${API_BASE}/orders?seller=true`, { headers: getAuthHeaders() });
      const data = await readApiResponse<Order[]>(response);
      setOrders(data);
      await setCachedData(cacheKey, data);
    } catch (err) {
      const cachedOrders = await getCachedData<Order[]>(cacheKey, ONE_DAY_MS);

      if (cachedOrders) {
        setOrders(cachedOrders);
        setError('Sem conexão. Exibindo pedidos recebidos salvos.');
        return;
      }

      throw createOfflineError(err, 'Não foi possível carregar os pedidos recebidos.');
    }
  }, [getAuthHeaders, token, user?.id, user?.role]);

  useEffect(() => {
    async function loadInitialData() {
      try {
        setError('');
        await Promise.all([loadProducts(), loadSellers()]);

        if (user?.role === 'comprador') {
          await Promise.all([loadCart(), loadOrders()]);
        } else if (user?.role === 'vendedor') {
          await loadSellerOrders();
        } else {
          setCartItems([]);
          setOrders([]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Não foi possível carregar os dados.');
      } finally {
        setIsLoading(false);
      }
    }

    loadInitialData();
  }, [loadCart, loadOrders, loadProducts, loadSellerOrders, loadSellers, user?.role]);

  async function addProduct(product: NewProduct) {
    if (!token || user?.role !== 'vendedor') {
      throw new Error('Entre como vendedor para cadastrar produtos.');
    }

    try {
      const response = await fetch(`${API_BASE}/products`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(product),
      });
      const data = await readApiResponse<Product>(response);
      setProducts((current) => [data, ...current]);
      await loadSellers();
    } catch (err) {
      throw createOfflineError(err, 'Não foi possível cadastrar produto agora.');
    }
  }

  async function toggleStoreOpen() {
    if (!token || user?.role !== 'vendedor') {
      throw new Error('Entre como vendedor para alterar o status da loja.');
    }

    const nextStoreOpen = !storeOpen;
    try {
      const response = await fetch(`${API_BASE}/store/status`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ storeOpen: nextStoreOpen }),
      });
      await readApiResponse<{ user: unknown }>(response);
      setStoreOpen(nextStoreOpen);
      await Promise.all([loadProducts(), loadSellers()]);
    } catch (err) {
      throw createOfflineError(err, 'Não foi possível atualizar o status da loja.');
    }
  }

  function persistCart(items: CartItem[]) {
    if (user?.id) {
      void setCachedData(SHOP_CACHE_KEYS.cart(user.id), items);
    }
  }

  function replaceCartItem(cartItem: CartItem) {
    setCartItems((current) => {
      const exists = current.some((item) => item.productId === cartItem.productId);

      if (!exists) {
        const nextItems = [...current, cartItem];
        persistCart(nextItems);
        return nextItems;
      }

      const nextItems = current.map((item) => (item.productId === cartItem.productId ? cartItem : item));
      persistCart(nextItems);
      return nextItems;
    });
  }

  async function addToCart(productId: string) {
    if (!token || user?.role !== 'comprador') {
      throw new Error('Entre como comprador para adicionar itens ao carrinho.');
    }

    const currentItem = cartItems.find((item) => item.productId === productId);
    const quantity = (currentItem?.quantity ?? 0) + 1;
    try {
      const response = await fetch(`${API_BASE}/cart`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ productId, quantity }),
      });
      const data = await readApiResponse<CartItem>(response);
      replaceCartItem(data);
    } catch (err) {
      throw createOfflineError(err, 'Não foi possível adicionar o item ao carrinho.');
    }
  }

  async function removeFromCart(productId: string) {
    if (!token) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/cart/${productId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      await readApiResponse<{ message: string }>(response);
      setCartItems((current) => {
        const nextItems = current.filter((item) => item.productId !== productId);
        persistCart(nextItems);
        return nextItems;
      });
    } catch (err) {
      throw createOfflineError(err, 'Não foi possível remover o item do carrinho.');
    }
  }

  async function updateCartQuantity(productId: string, quantity: number) {
    if (quantity <= 0) {
      await removeFromCart(productId);
      return;
    }

    if (!token || user?.role !== 'comprador') {
      throw new Error('Entre como comprador para atualizar o carrinho.');
    }

    try {
      const response = await fetch(`${API_BASE}/cart`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ productId, quantity }),
      });
      const data = await readApiResponse<CartItem>(response);
      replaceCartItem(data);
    } catch (err) {
      throw createOfflineError(err, 'Não foi possível atualizar o carrinho.');
    }
  }

  function clearCart() {
    setCartItems([]);
    if (user?.id) {
      void removeCachedData(SHOP_CACHE_KEYS.cart(user.id));
    }
  }

  async function submitOrder(details: { deliveryPoint: string; paymentMethod: string }) {
    if (!token || user?.role !== 'comprador') {
      throw new Error('Entre como comprador para fechar o pedido.');
    }

    try {
      const response = await fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(details),
      });
      const data = await readApiResponse<Order>(response);
      setCartItems([]);
      if (user?.id) {
        void removeCachedData(SHOP_CACHE_KEYS.cart(user.id));
      }
      setOrders((current) => [data, ...current]);
      await loadProducts();
      return data;
    } catch (err) {
      throw createOfflineError(err, 'Não foi possível finalizar o pedido agora.');
    }
  }

  async function updateOrderStatus(orderId: string, status: OrderStatus) {
    if (!token || user?.role !== 'vendedor') {
      throw new Error('Entre como vendedor para atualizar pedidos.');
    }

    try {
      const response = await fetch(`${API_BASE}/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status }),
      });
      const data = await readApiResponse<Order>(response);
      setOrders((current) =>
        current.map((order) => (order.id === orderId ? data : order))
      );
    } catch (err) {
      throw createOfflineError(err, 'Não foi possível atualizar o pedido.');
    }
  }

  async function submitOrderReview(orderId: string, details: { rating: number; reviewComment: string }) {
    if (!token || user?.role !== 'comprador') {
      throw new Error('Entre como comprador para avaliar pedidos.');
    }

    try {
      const response = await fetch(`${API_BASE}/orders/${orderId}/review`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(details),
      });
      const data = await readApiResponse<Order>(response);
      setOrders((current) =>
        current.map((order) => (order.id === orderId ? data : order))
      );
      return data;
    } catch (err) {
      throw createOfflineError(err, 'Não foi possível enviar a avaliação.');
    }
  }

  const cartTotal = useMemo(() => {
    return cartItems.reduce((total, item) => total + item.product.price * item.quantity, 0);
  }, [cartItems]);

  const cartCount = useMemo(() => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  }, [cartItems]);

  return (
    <ShopContext.Provider
      value={{
        products,
        sellers,
        cartItems,
        orders,
        storeOpen,
        isLoading,
        error,
        addProduct,
        toggleStoreOpen,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        submitOrder,
        updateOrderStatus,
        submitOrderReview,
        cartTotal,
        cartCount,
        loadProducts,
        loadSellers,
        loadCart,
        loadOrders,
        loadSellerOrders,
      }}
    >
      {children}
    </ShopContext.Provider>
  );
}

export function useShop() {
  const context = useContext(ShopContext);
  if (!context) {
    throw new Error('useShop must be used within a ShopProvider');
  }

  return context;
}
