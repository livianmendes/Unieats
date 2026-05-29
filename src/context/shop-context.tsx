import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const API_BASE = 'http://localhost:3000/api';

type Product = {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  seller: { name: string };
};

type CartItem = {
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
  addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  toggleStoreOpen: () => void;
  addToCart: (productId: string) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  updateCartQuantity: (productId: string, quantity: number) => Promise<void>;
  clearCart: () => void;
  submitOrder: (details: { deliveryPoint: string; paymentMethod: string }) => Promise<Order>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  cartTotal: number;
  loadProducts: () => Promise<void>;
  loadCart: () => Promise<void>;
  loadOrders: () => Promise<void>;
  loadSellerOrders: () => Promise<void>;
};

const ShopContext = createContext<ShopContextData | undefined>(undefined);

export function ShopProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [storeOpen, setStoreOpen] = useState(true);

  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  });

  async function loadProducts() {
    const response = await fetch(`${API_BASE}/products`);
    const data = await response.json();
    setProducts(data);
  }

  async function loadCart() {
    const response = await fetch(`${API_BASE}/cart`, { headers: getAuthHeaders() });
    const data = await response.json();
    setCartItems(data);
  }

  async function loadOrders() {
    const response = await fetch(`${API_BASE}/orders`, { headers: getAuthHeaders() });
    const data = await response.json();
    setOrders(data);
  }

  async function loadSellerOrders() {
    const response = await fetch(`${API_BASE}/orders?seller=true`, { headers: getAuthHeaders() });
    const data = await response.json();
    setOrders(data);
  }

  useEffect(() => {
    loadProducts();
  }, []);

  async function addProduct(product: Omit<Product, 'id'>) {
    const response = await fetch(`${API_BASE}/products`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(product),
    });
    const data = await response.json();
    setProducts((current) => [...current, data]);
  }

  function toggleStoreOpen() {
    setStoreOpen((current) => !current);
  }

  async function addToCart(productId: string) {
    const response = await fetch(`${API_BASE}/cart`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ productId, quantity: 1 }),
    });
    const data = await response.json();
    setCartItems((current) => [...current, data]);
  }

  async function removeFromCart(productId: string) {
    await fetch(`${API_BASE}/cart/${productId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    setCartItems((current) => current.filter((item) => item.productId !== productId));
  }

  async function updateCartQuantity(productId: string, quantity: number) {
    if (quantity === 0) {
      await removeFromCart(productId);
      return;
    }
    const response = await fetch(`${API_BASE}/cart`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ productId, quantity }),
    });
    const data = await response.json();
    setCartItems((current) =>
      current.map((item) => (item.productId === productId ? data : item))
    );
  }

  function clearCart() {
    setCartItems([]);
  }

  async function submitOrder(details: { deliveryPoint: string; paymentMethod: string }) {
    const response = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(details),
    });
    const data = await response.json();
    setCartItems([]);
    setOrders((current) => [...current, data]);
    return data;
  }

  async function updateOrderStatus(orderId: string, status: OrderStatus) {
    const response = await fetch(`${API_BASE}/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status }),
    });
    const data = await response.json();
    setOrders((current) =>
      current.map((order) => (order.id === orderId ? data : order))
    );
  }

  const cartTotal = useMemo(() => {
    return cartItems.reduce((total, item) => total + item.product.price * item.quantity, 0);
  }, [cartItems]);

  return (
    <ShopContext.Provider
      value={{
        products,
        cartItems,
        orders,
        storeOpen,
        addProduct,
        toggleStoreOpen,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        submitOrder,
        updateOrderStatus,
        cartTotal,
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
