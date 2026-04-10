import React, { createContext, useContext, useState, ReactNode, useEffect, useMemo, useCallback } from 'react';
import { useOffline } from '@/context/OfflineContext';
import { useUser } from '@/context/UserContext';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: any, quantity: number) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  totalItems: number;
  updateQuantity: (id: string, quantity: number) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const { isOnline, addToSyncQueue } = useOffline();
  const { user } = useUser();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load cart when user changes
  useEffect(() => {
    const cartKey = user ? `agritech_cart_${user.id}` : 'agritech_cart_guest';
    const saved = localStorage.getItem(cartKey);
    if (saved) {
      try {
        setCart(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse cart from localStorage:', e);
        setCart([]);
      }
    } else {
      setCart([]);
    }
    setIsLoaded(true);
  }, [user]);

  // Save cart when it changes
  useEffect(() => {
    if (!isLoaded) return;
    const cartKey = user ? `agritech_cart_${user.id}` : 'agritech_cart_guest';
    localStorage.setItem(cartKey, JSON.stringify(cart));
  }, [cart, user, isLoaded]);

  const addToCart = useCallback((product: any, quantity: number) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      let newCart;
      if (existing) {
        newCart = prev.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
        );
      } else {
        newCart = [...prev, { 
          id: product.id, 
          name: product.name, 
          price: product.price, 
          quantity, 
          image: product.image 
        }];
      }

      if (!isOnline) {
        addToSyncQueue('ADD_TO_CART', { productId: product.id, quantity });
      }

      return newCart;
    });
  }, [isOnline, addToSyncQueue]);

  const removeFromCart = useCallback((id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    setCart(prev => prev.map(item => item.id === id ? { ...item, quantity } : item));
  }, [removeFromCart]);

  const clearCart = useCallback(() => setCart([]), []);

  const totalItems = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);

  const value = useMemo(() => ({
    cart,
    addToCart,
    removeFromCart,
    clearCart,
    totalItems,
    updateQuantity
  }), [cart, addToCart, removeFromCart, clearCart, totalItems, updateQuantity]);

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
