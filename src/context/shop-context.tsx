import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { API_BASE } from '@/src/constants/api';
import { useAuth } from '@/src/context/auth-context';

export type Product = {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  seller?: { id: string; name: string; email?: string };
};

type NewProduct = Pick<Product, 'title' | 'description' | 'price' | 'category' | 'stock'>;

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
  createdAt: string;
};

type ShopContextData = {
  products: Product[];
  cartItems: CartItem[];
  orders: Order[];
  storeOpen: boolean;
  isLoading: boolean;
  error: string;
  addProduct: (product: NewProduct) => Promise<void>;
  toggleStoreOpen: () => void;
  addToCart: (productId: string) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  updateCartQuantity: (productId: string, quantity: number) => Promise<void>;
  clearCart: () => void;
  submitOrder: (details: { deliveryPoint: string; paymentMethod: string }) => Promise<Order>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  cartTotal: number;
  cartCount: number;
  loadProducts: () => Promise<void>;
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

export function ShopProvider({ children }: { children: React.ReactNode }) {
  const { token, user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [storeOpen, setStoreOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const getAuthHeaders = useCallback(() => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }), [token]);

  const loadProducts = useCallback(async () => {
    const response = await fetch(`${API_BASE}/products`);
    const data = await readApiResponse<Product[]>(response);
    setProducts(data);
  }, []);

  const loadCart = useCallback(async () => {
    if (!token || user?.role !== 'comprador') {
      setCartItems([]);
      return;
    }

    const response = await fetch(`${API_BASE}/cart`, { headers: getAuthHeaders() });
    const data = await readApiResponse<CartItem[]>(response);
    setCartItems(data);
  }, [getAuthHeaders, token, user?.role]);

  const loadOrders = useCallback(async () => {
    if (!token) {
      setOrders([]);
      return;
    }

    const response = await fetch(`${API_BASE}/orders`, { headers: getAuthHeaders() });
    const data = await readApiResponse<Order[]>(response);
    setOrders(data);
  }, [getAuthHeaders, token]);

  const loadSellerOrders = useCallback(async () => {
    if (!token || user?.role !== 'vendedor') {
      setOrders([]);
      return;
    }

    const response = await fetch(`${API_BASE}/orders?seller=true`, { headers: getAuthHeaders() });
    const data = await readApiResponse<Order[]>(response);
    setOrders(data);
  }, [getAuthHeaders, token, user?.role]);

  useEffect(() => {
    async function loadInitialData() {
      try {
        setError('');
        await loadProducts();

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
  }, [loadCart, loadOrders, loadProducts, loadSellerOrders, user?.role]);

  async function addProduct(product: NewProduct) {
    if (!token || user?.role !== 'vendedor') {
      throw new Error('Entre como vendedor para cadastrar produtos.');
    }

    const response = await fetch(`${API_BASE}/products`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(product),
    });
    const data = await readApiResponse<Product>(response);
    setProducts((current) => [data, ...current]);
  }

  function toggleStoreOpen() {
    setStoreOpen((current) => !current);
  }

  function replaceCartItem(cartItem: CartItem) {
    setCartItems((current) => {
      const exists = current.some((item) => item.productId === cartItem.productId);

      if (!exists) {
        return [...current, cartItem];
      }

      return current.map((item) => (item.productId === cartItem.productId ? cartItem : item));
    });
  }

  async function addToCart(productId: string) {
    if (!token || user?.role !== 'comprador') {
      throw new Error('Entre como comprador para adicionar itens ao carrinho.');
    }

    const currentItem = cartItems.find((item) => item.productId === productId);
    const quantity = (currentItem?.quantity ?? 0) + 1;
    const response = await fetch(`${API_BASE}/cart`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ productId, quantity }),
    });
    const data = await readApiResponse<CartItem>(response);
    replaceCartItem(data);
  }

  async function removeFromCart(productId: string) {
    if (!token) {
      return;
    }

    const response = await fetch(`${API_BASE}/cart/${productId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    await readApiResponse<{ message: string }>(response);
    setCartItems((current) => current.filter((item) => item.productId !== productId));
  }

  async function updateCartQuantity(productId: string, quantity: number) {
    if (quantity <= 0) {
      await removeFromCart(productId);
      return;
    }

    if (!token || user?.role !== 'comprador') {
      throw new Error('Entre como comprador para atualizar o carrinho.');
    }

    const response = await fetch(`${API_BASE}/cart`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ productId, quantity }),
    });
    const data = await readApiResponse<CartItem>(response);
    replaceCartItem(data);
  }

  function clearCart() {
    setCartItems([]);
  }

  async function submitOrder(details: { deliveryPoint: string; paymentMethod: string }) {
    if (!token || user?.role !== 'comprador') {
      throw new Error('Entre como comprador para fechar o pedido.');
    }

    const response = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(details),
    });
    const data = await readApiResponse<Order>(response);
    setCartItems([]);
    setOrders((current) => [data, ...current]);
    await loadProducts();
    return data;
  }

  async function updateOrderStatus(orderId: string, status: OrderStatus) {
    if (!token || user?.role !== 'vendedor') {
      throw new Error('Entre como vendedor para atualizar pedidos.');
    }

    const response = await fetch(`${API_BASE}/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status }),
    });
    const data = await readApiResponse<Order>(response);
    setOrders((current) =>
      current.map((order) => (order.id === orderId ? data : order))
    );
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
        cartTotal,
        cartCount,
        loadProducts,
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
