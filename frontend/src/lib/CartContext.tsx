'use client';

import { createContext, useContext, useReducer, useEffect, useState, useMemo, useCallback } from 'react';
import { Book, CartItem, Cart } from './types';
import { useAuth } from './AuthContext';

interface CartContextType {
  cart: Cart;
  addToCart: (book: Book, quantity?: number) => void;
  removeFromCart: (bookId: string) => void;
  updateQuantity: (bookId: string, quantity: number) => void;
  clearCart: () => void;
  itemCount: number;
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: { book: Book; quantity: number } }
  | { type: 'REMOVE_ITEM'; payload: { bookId: string } }
  | { type: 'UPDATE_QUANTITY'; payload: { bookId: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'LOAD_CART'; payload: Cart };

const CartContext = createContext<CartContextType | undefined>(undefined);

function cartReducer(state: Cart, action: CartAction): Cart {
  switch (action.type) {
    case 'ADD_ITEM': {
      const { book, quantity } = action.payload;
      const existingItem = state.items.find(item => item.book.id === book.id);
      
      let newItems: CartItem[];
      if (existingItem) {
        newItems = state.items.map(item =>
          item.book.id === book.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        newItems = [...state.items, { book, quantity }];
      }
      
      const total = newItems.reduce((sum, item) => sum + (item.book.price * item.quantity), 0);
      return { items: newItems, total };
    }
    
    case 'REMOVE_ITEM': {
      const newItems = state.items.filter(item => item.book.id !== action.payload.bookId);
      const total = newItems.reduce((sum, item) => sum + (item.book.price * item.quantity), 0);
      return { items: newItems, total };
    }
    
    case 'UPDATE_QUANTITY': {
      const { bookId, quantity } = action.payload;
      if (quantity <= 0) {
        return cartReducer(state, { type: 'REMOVE_ITEM', payload: { bookId } });
      }
      
      const newItems = state.items.map(item =>
        item.book.id === bookId ? { ...item, quantity } : item
      );
      const total = newItems.reduce((sum, item) => sum + (item.book.price * item.quantity), 0);
      return { items: newItems, total };
    }
    
    case 'CLEAR_CART':
      return { items: [], total: 0 };
    
    case 'LOAD_CART':
      return action.payload;
    
    default:
      return state;
  }
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [cart, dispatch] = useReducer(cartReducer, { items: [], total: 0 });
  const [isInitialized, setIsInitialized] = useState(false);
  const { user } = useAuth();

  // Initialize cart from localStorage on component mount
  useEffect(() => {
    const initializeCart = () => {
      try {
        if (user) {
          // Only load cart for authenticated users
          const savedCart = localStorage.getItem(`cart_${user.uid}`);
          
          if (savedCart) {
            const parsedCart = JSON.parse(savedCart);
            console.log('📦 Loading cart from localStorage:', parsedCart);
            dispatch({ type: 'LOAD_CART', payload: parsedCart });
          } else {
            console.log('📦 No saved cart found in localStorage');
          }
        } else {
          // Clear cart for unauthenticated users
          dispatch({ type: 'CLEAR_CART' });
        }
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
      } finally {
        setIsInitialized(true);
      }
    };

    initializeCart();
  }, [user]);

  // Save cart to localStorage whenever it changes (but only for authenticated users)
  useEffect(() => {
    if (!isInitialized || !user) return; // Only save for authenticated users
    
    try {
      const cartKey = `cart_${user.uid}`;
      console.log('💾 Saving cart to localStorage:', cart);
      localStorage.setItem(cartKey, JSON.stringify(cart));
    } catch (error) {
      console.error('Error saving cart to localStorage:', error);
    }
  }, [cart, user, isInitialized]);

  // Clean up any old guest cart data when user logs in
  useEffect(() => {
    if (!isInitialized || !user) return;

    // Clean up any old guest cart data
    const guestCart = localStorage.getItem('cart_guest');
    if (guestCart) {
      localStorage.removeItem('cart_guest');
    }
  }, [user, isInitialized]);

  const addToCart = useCallback((book: Book, quantity = 1) => {
    dispatch({ type: 'ADD_ITEM', payload: { book, quantity } });
  }, []);

  const removeFromCart = useCallback((bookId: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: { bookId } });
  }, []);

  const updateQuantity = useCallback((bookId: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { bookId, quantity } });
  }, []);

  const clearCart = useCallback(() => {
    console.log('🧹 clearCart called - current cart before clear:', cart);
    dispatch({ type: 'CLEAR_CART' });
    console.log('🧹 clearCart dispatched CLEAR_CART action');
  }, []);

  const itemCount = useMemo(() => 
    cart.items.reduce((count, item) => count + item.quantity, 0), 
    [cart.items]
  );

  const value: CartContextType = useMemo(() => ({
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    itemCount,
  }), [cart, addToCart, removeFromCart, updateQuantity, clearCart, itemCount]);

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};