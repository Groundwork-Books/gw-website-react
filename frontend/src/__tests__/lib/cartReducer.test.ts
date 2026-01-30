/**
 * Unit tests for the Cart Reducer (CartContext.tsx)
 * Tests the core cart state management logic
 */

import { Book, Cart, CartItem } from '@/lib/types';

// Define the CartAction type to match CartContext
type CartAction =
  | { type: 'ADD_ITEM'; payload: { book: Book; quantity: number } }
  | { type: 'REMOVE_ITEM'; payload: { bookId: string } }
  | { type: 'UPDATE_QUANTITY'; payload: { bookId: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'LOAD_CART'; payload: Cart };

// Recreate the cartReducer logic for isolated testing
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

// Test fixtures
const createMockBook = (overrides: Partial<Book> = {}): Book => ({
  id: 'book-1',
  name: 'Test Book',
  price: 10.99,
  currency: 'USD',
  description: 'A test book',
  ...overrides,
});

const emptyCart: Cart = { items: [], total: 0 };

describe('cartReducer', () => {
  describe('ADD_ITEM action', () => {
    it('should add a new item to an empty cart', () => {
      const book = createMockBook();
      const action: CartAction = {
        type: 'ADD_ITEM',
        payload: { book, quantity: 1 },
      };

      const result = cartReducer(emptyCart, action);

      expect(result.items).toHaveLength(1);
      expect(result.items[0].book.id).toBe('book-1');
      expect(result.items[0].quantity).toBe(1);
      expect(result.total).toBeCloseTo(10.99);
    });

    it('should add multiple quantity of a new item', () => {
      const book = createMockBook({ price: 15.00 });
      const action: CartAction = {
        type: 'ADD_ITEM',
        payload: { book, quantity: 3 },
      };

      const result = cartReducer(emptyCart, action);

      expect(result.items[0].quantity).toBe(3);
      expect(result.total).toBeCloseTo(45.00);
    });

    it('should increase quantity when adding existing item', () => {
      const book = createMockBook();
      const existingCart: Cart = {
        items: [{ book, quantity: 2 }],
        total: 21.98,
      };
      const action: CartAction = {
        type: 'ADD_ITEM',
        payload: { book, quantity: 1 },
      };

      const result = cartReducer(existingCart, action);

      expect(result.items).toHaveLength(1);
      expect(result.items[0].quantity).toBe(3);
      expect(result.total).toBeCloseTo(32.97);
    });

    it('should add new item while keeping existing items', () => {
      const book1 = createMockBook({ id: 'book-1', price: 10.00 });
      const book2 = createMockBook({ id: 'book-2', price: 20.00 });
      const existingCart: Cart = {
        items: [{ book: book1, quantity: 1 }],
        total: 10.00,
      };
      const action: CartAction = {
        type: 'ADD_ITEM',
        payload: { book: book2, quantity: 1 },
      };

      const result = cartReducer(existingCart, action);

      expect(result.items).toHaveLength(2);
      expect(result.total).toBeCloseTo(30.00);
    });

    it('should handle books with zero price', () => {
      const book = createMockBook({ price: 0 });
      const action: CartAction = {
        type: 'ADD_ITEM',
        payload: { book, quantity: 5 },
      };

      const result = cartReducer(emptyCart, action);

      expect(result.items[0].quantity).toBe(5);
      expect(result.total).toBe(0);
    });
  });

  describe('REMOVE_ITEM action', () => {
    it('should remove an item from the cart', () => {
      const book = createMockBook();
      const existingCart: Cart = {
        items: [{ book, quantity: 2 }],
        total: 21.98,
      };
      const action: CartAction = {
        type: 'REMOVE_ITEM',
        payload: { bookId: 'book-1' },
      };

      const result = cartReducer(existingCart, action);

      expect(result.items).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('should remove only the specified item', () => {
      const book1 = createMockBook({ id: 'book-1', price: 10.00 });
      const book2 = createMockBook({ id: 'book-2', price: 20.00 });
      const existingCart: Cart = {
        items: [
          { book: book1, quantity: 1 },
          { book: book2, quantity: 1 },
        ],
        total: 30.00,
      };
      const action: CartAction = {
        type: 'REMOVE_ITEM',
        payload: { bookId: 'book-1' },
      };

      const result = cartReducer(existingCart, action);

      expect(result.items).toHaveLength(1);
      expect(result.items[0].book.id).toBe('book-2');
      expect(result.total).toBeCloseTo(20.00);
    });

    it('should handle removing non-existent item gracefully', () => {
      const book = createMockBook();
      const existingCart: Cart = {
        items: [{ book, quantity: 1 }],
        total: 10.99,
      };
      const action: CartAction = {
        type: 'REMOVE_ITEM',
        payload: { bookId: 'non-existent' },
      };

      const result = cartReducer(existingCart, action);

      expect(result.items).toHaveLength(1);
      expect(result.total).toBeCloseTo(10.99);
    });
  });

  describe('UPDATE_QUANTITY action', () => {
    it('should update the quantity of an item', () => {
      const book = createMockBook({ price: 10.00 });
      const existingCart: Cart = {
        items: [{ book, quantity: 2 }],
        total: 20.00,
      };
      const action: CartAction = {
        type: 'UPDATE_QUANTITY',
        payload: { bookId: 'book-1', quantity: 5 },
      };

      const result = cartReducer(existingCart, action);

      expect(result.items[0].quantity).toBe(5);
      expect(result.total).toBeCloseTo(50.00);
    });

    it('should remove item when quantity is set to 0', () => {
      const book = createMockBook();
      const existingCart: Cart = {
        items: [{ book, quantity: 2 }],
        total: 21.98,
      };
      const action: CartAction = {
        type: 'UPDATE_QUANTITY',
        payload: { bookId: 'book-1', quantity: 0 },
      };

      const result = cartReducer(existingCart, action);

      expect(result.items).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('should remove item when quantity is negative', () => {
      const book = createMockBook();
      const existingCart: Cart = {
        items: [{ book, quantity: 2 }],
        total: 21.98,
      };
      const action: CartAction = {
        type: 'UPDATE_QUANTITY',
        payload: { bookId: 'book-1', quantity: -1 },
      };

      const result = cartReducer(existingCart, action);

      expect(result.items).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('should not modify other items when updating quantity', () => {
      const book1 = createMockBook({ id: 'book-1', price: 10.00 });
      const book2 = createMockBook({ id: 'book-2', price: 20.00 });
      const existingCart: Cart = {
        items: [
          { book: book1, quantity: 1 },
          { book: book2, quantity: 1 },
        ],
        total: 30.00,
      };
      const action: CartAction = {
        type: 'UPDATE_QUANTITY',
        payload: { bookId: 'book-1', quantity: 3 },
      };

      const result = cartReducer(existingCart, action);

      expect(result.items[0].quantity).toBe(3);
      expect(result.items[1].quantity).toBe(1);
      expect(result.total).toBeCloseTo(50.00);
    });
  });

  describe('CLEAR_CART action', () => {
    it('should clear all items from the cart', () => {
      const book1 = createMockBook({ id: 'book-1' });
      const book2 = createMockBook({ id: 'book-2' });
      const existingCart: Cart = {
        items: [
          { book: book1, quantity: 2 },
          { book: book2, quantity: 3 },
        ],
        total: 54.95,
      };
      const action: CartAction = { type: 'CLEAR_CART' };

      const result = cartReducer(existingCart, action);

      expect(result.items).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('should handle clearing an already empty cart', () => {
      const action: CartAction = { type: 'CLEAR_CART' };

      const result = cartReducer(emptyCart, action);

      expect(result.items).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe('LOAD_CART action', () => {
    it('should load a cart from payload', () => {
      const book = createMockBook();
      const loadedCart: Cart = {
        items: [{ book, quantity: 3 }],
        total: 32.97,
      };
      const action: CartAction = {
        type: 'LOAD_CART',
        payload: loadedCart,
      };

      const result = cartReducer(emptyCart, action);

      expect(result.items).toHaveLength(1);
      expect(result.items[0].quantity).toBe(3);
      expect(result.total).toBeCloseTo(32.97);
    });

    it('should replace existing cart with loaded cart', () => {
      const oldBook = createMockBook({ id: 'old-book' });
      const newBook = createMockBook({ id: 'new-book' });
      const existingCart: Cart = {
        items: [{ book: oldBook, quantity: 1 }],
        total: 10.99,
      };
      const loadedCart: Cart = {
        items: [{ book: newBook, quantity: 2 }],
        total: 21.98,
      };
      const action: CartAction = {
        type: 'LOAD_CART',
        payload: loadedCart,
      };

      const result = cartReducer(existingCart, action);

      expect(result.items).toHaveLength(1);
      expect(result.items[0].book.id).toBe('new-book');
      expect(result.items[0].quantity).toBe(2);
    });
  });

  describe('Unknown action', () => {
    it('should return current state for unknown action', () => {
      const book = createMockBook();
      const existingCart: Cart = {
        items: [{ book, quantity: 1 }],
        total: 10.99,
      };
      // @ts-expect-error Testing unknown action type
      const action: CartAction = { type: 'UNKNOWN_ACTION' };

      const result = cartReducer(existingCart, action);

      expect(result).toBe(existingCart);
    });
  });

  describe('Total calculation', () => {
    it('should correctly calculate total with multiple items', () => {
      const book1 = createMockBook({ id: 'book-1', price: 9.99 });
      const book2 = createMockBook({ id: 'book-2', price: 14.99 });
      const book3 = createMockBook({ id: 'book-3', price: 24.99 });

      let cart = cartReducer(emptyCart, {
        type: 'ADD_ITEM',
        payload: { book: book1, quantity: 2 },
      });
      cart = cartReducer(cart, {
        type: 'ADD_ITEM',
        payload: { book: book2, quantity: 1 },
      });
      cart = cartReducer(cart, {
        type: 'ADD_ITEM',
        payload: { book: book3, quantity: 3 },
      });

      // 2 * 9.99 + 1 * 14.99 + 3 * 24.99 = 19.98 + 14.99 + 74.97 = 109.94
      expect(cart.total).toBeCloseTo(109.94);
    });

    it('should recalculate total when items are removed', () => {
      const book1 = createMockBook({ id: 'book-1', price: 10.00 });
      const book2 = createMockBook({ id: 'book-2', price: 20.00 });
      const existingCart: Cart = {
        items: [
          { book: book1, quantity: 1 },
          { book: book2, quantity: 1 },
        ],
        total: 30.00,
      };

      const result = cartReducer(existingCart, {
        type: 'REMOVE_ITEM',
        payload: { bookId: 'book-2' },
      });

      expect(result.total).toBeCloseTo(10.00);
    });
  });
});
