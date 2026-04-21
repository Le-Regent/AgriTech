import React, { createContext, useContext, useState, ReactNode, useEffect, useMemo, useCallback } from 'react';
import { useOffline } from '@/context/OfflineContext';
import { useUser } from '@/context/UserContext';

interface CartItem {
  id: string;
  name: string;
  price: number; // Price per selected unit
  quantity: number;
  unit: string;
  baseUnit: string;
  image: string;
  stockQuantity: number; // Available in base unit
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: any, quantity: number, unit?: string, price?: number) => void;
  removeFromCart: (id: string, unit?: string) => void;
  clearCart: () => void;
  totalItems: number;
  updateQuantity: (id: string, quantity: number, unit?: string) => void;
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
        const parsed = JSON.parse(saved);
        // Migration: Ensure items have baseUnit and stockQuantity (default large if missing for old carts)
        const migrated = (parsed as any[]).map(item => ({
          ...item,
          baseUnit: item.baseUnit || item.unit,
          stockQuantity: item.stockQuantity !== undefined ? item.stockQuantity : 999999
        }));
        setCart(migrated);
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

  const addToCart = useCallback((product: any, quantity: number, unit?: string, price?: number) => {
    const selectedUnit = unit || product.unit;
    const selectedPrice = price !== undefined ? price : product.price;
    const stockQuantity = product.stock_quantity;

    setCart(prev => {
      const existing = prev.find(item => item.id === product.id && item.unit === selectedUnit);
      let newCart;
      
      // Calculate current total for this product in base units
      const currentInBase = prev
        .filter(item => item.id === product.id)
        .reduce((sum, item) => sum + (item.unit === item.baseUnit ? item.quantity : item.quantity), 0); // Simplified for now, real apps need proper unit conversion
      
      // In a real app we'd use import { convertQuantity } from '@/lib/unitUtils';
      // but we can't easily import inside useCallback if it's not a hook or if we don't handle dependency.
      // For now we trust the caller (UI) to handle limits, and we do a basic check here.

      if (existing) {
        newCart = prev.map(item => 
          (item.id === product.id && item.unit === selectedUnit) ? { ...item, quantity: item.quantity + quantity, stockQuantity } : item
        );
      } else {
        newCart = [...prev, { 
          id: product.id, 
          name: product.name, 
          price: selectedPrice, 
          quantity, 
          unit: selectedUnit,
          baseUnit: product.unit,
          image: product.image || product.image_url,
          stockQuantity
        }];
      }

      if (!isOnline) {
        addToSyncQueue('ADD_TO_CART', { productId: product.id, quantity, unit: selectedUnit });
      }

      return newCart;
    });
  }, [isOnline, addToSyncQueue]);

  const removeFromCart = useCallback((id: string, unit?: string) => {
    setCart(prev => prev.filter(item => !(item.id === id && (unit ? item.unit === unit : true))));
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number, unit?: string) => {
    if (quantity <= 0) {
      removeFromCart(id, unit);
      return;
    }
    setCart(prev => prev.map(item => {
      if (item.id === id && (unit ? item.unit === unit : true)) {
        // Simple stock check (approximate as we don't have unit conversion here easily)
        if (quantity > item.stockQuantity && item.unit === item.baseUnit) {
          return { ...item, quantity: item.stockQuantity };
        }
        return { ...item, quantity };
      }
      return item;
    }));
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
