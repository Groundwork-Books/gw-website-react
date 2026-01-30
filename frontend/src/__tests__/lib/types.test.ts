/**
 * Unit tests for types.ts
 * Tests type definitions and interfaces
 */

import { Book, CartItem, Cart } from '@/lib/types';

describe('types.ts', () => {
  describe('Book interface', () => {
    it('should allow creating a book with required fields', () => {
      const book: Book = {
        id: 'book-123',
        name: 'Test Book',
        price: 19.99,
        currency: 'USD',
      };

      expect(book.id).toBe('book-123');
      expect(book.name).toBe('Test Book');
      expect(book.price).toBe(19.99);
      expect(book.currency).toBe('USD');
    });

    it('should allow creating a book with all optional fields', () => {
      const book: Book = {
        id: 'book-123',
        name: 'Test Book',
        price: 19.99,
        currency: 'USD',
        description: 'A test description',
        imageUrl: 'https://example.com/image.jpg',
        imageId: 'img-456',
        categoryId: 'cat-789',
        squareItemId: 'sq-item-1',
        squareVariationId: 'sq-var-1',
        inventoryTracked: true,
        available: true,
      };

      expect(book.description).toBe('A test description');
      expect(book.imageUrl).toBe('https://example.com/image.jpg');
      expect(book.imageId).toBe('img-456');
      expect(book.categoryId).toBe('cat-789');
      expect(book.squareItemId).toBe('sq-item-1');
      expect(book.squareVariationId).toBe('sq-var-1');
      expect(book.inventoryTracked).toBe(true);
      expect(book.available).toBe(true);
    });

    it('should allow undefined optional fields', () => {
      const book: Book = {
        id: 'book-123',
        name: 'Test Book',
        price: 19.99,
        currency: 'USD',
      };

      expect(book.description).toBeUndefined();
      expect(book.imageUrl).toBeUndefined();
      expect(book.imageId).toBeUndefined();
      expect(book.categoryId).toBeUndefined();
      expect(book.squareItemId).toBeUndefined();
      expect(book.squareVariationId).toBeUndefined();
      expect(book.inventoryTracked).toBeUndefined();
      expect(book.available).toBeUndefined();
    });

    it('should handle zero price', () => {
      const book: Book = {
        id: 'free-book',
        name: 'Free Book',
        price: 0,
        currency: 'USD',
      };

      expect(book.price).toBe(0);
    });

    it('should handle different currencies', () => {
      const books: Book[] = [
        { id: 'b1', name: 'USD Book', price: 19.99, currency: 'USD' },
        { id: 'b2', name: 'EUR Book', price: 17.99, currency: 'EUR' },
        { id: 'b3', name: 'GBP Book', price: 15.99, currency: 'GBP' },
      ];

      expect(books[0].currency).toBe('USD');
      expect(books[1].currency).toBe('EUR');
      expect(books[2].currency).toBe('GBP');
    });
  });

  describe('CartItem interface', () => {
    it('should allow creating a cart item', () => {
      const book: Book = {
        id: 'book-123',
        name: 'Test Book',
        price: 19.99,
        currency: 'USD',
      };

      const cartItem: CartItem = {
        book,
        quantity: 2,
      };

      expect(cartItem.book).toBe(book);
      expect(cartItem.quantity).toBe(2);
    });

    it('should handle quantity of 1', () => {
      const cartItem: CartItem = {
        book: { id: 'b1', name: 'Book', price: 10, currency: 'USD' },
        quantity: 1,
      };

      expect(cartItem.quantity).toBe(1);
    });

    it('should handle large quantities', () => {
      const cartItem: CartItem = {
        book: { id: 'b1', name: 'Book', price: 10, currency: 'USD' },
        quantity: 1000,
      };

      expect(cartItem.quantity).toBe(1000);
    });
  });

  describe('Cart interface', () => {
    it('should allow creating an empty cart', () => {
      const cart: Cart = {
        items: [],
        total: 0,
      };

      expect(cart.items).toHaveLength(0);
      expect(cart.total).toBe(0);
    });

    it('should allow creating a cart with items', () => {
      const book1: Book = { id: 'b1', name: 'Book 1', price: 10.00, currency: 'USD' };
      const book2: Book = { id: 'b2', name: 'Book 2', price: 20.00, currency: 'USD' };

      const cart: Cart = {
        items: [
          { book: book1, quantity: 2 },
          { book: book2, quantity: 1 },
        ],
        total: 40.00,
      };

      expect(cart.items).toHaveLength(2);
      expect(cart.total).toBe(40.00);
    });

    it('should calculate correct total', () => {
      const items: CartItem[] = [
        { book: { id: 'b1', name: 'Book 1', price: 9.99, currency: 'USD' }, quantity: 2 },
        { book: { id: 'b2', name: 'Book 2', price: 14.99, currency: 'USD' }, quantity: 1 },
      ];

      const calculatedTotal = items.reduce(
        (sum, item) => sum + item.book.price * item.quantity,
        0
      );

      const cart: Cart = {
        items,
        total: calculatedTotal,
      };

      // 2 * 9.99 + 1 * 14.99 = 19.98 + 14.99 = 34.97
      expect(cart.total).toBeCloseTo(34.97);
    });
  });

  describe('Type coercion scenarios', () => {
    it('should handle book serialization to JSON', () => {
      const book: Book = {
        id: 'book-123',
        name: 'Test Book',
        price: 19.99,
        currency: 'USD',
        description: 'Description',
      };

      const json = JSON.stringify(book);
      const parsed = JSON.parse(json) as Book;

      expect(parsed.id).toBe(book.id);
      expect(parsed.name).toBe(book.name);
      expect(parsed.price).toBe(book.price);
    });

    it('should handle cart serialization to JSON', () => {
      const cart: Cart = {
        items: [
          {
            book: { id: 'b1', name: 'Book', price: 10, currency: 'USD' },
            quantity: 2,
          },
        ],
        total: 20,
      };

      const json = JSON.stringify(cart);
      const parsed = JSON.parse(json) as Cart;

      expect(parsed.items).toHaveLength(1);
      expect(parsed.items[0].quantity).toBe(2);
      expect(parsed.total).toBe(20);
    });
  });

  describe('Type safety', () => {
    it('should enforce required Book fields', () => {
      // This test verifies the type system works
      // In TypeScript, missing required fields would cause a compile error
      const createBook = (params: Book): Book => params;

      const book = createBook({
        id: 'test',
        name: 'Test',
        price: 10,
        currency: 'USD',
      });

      expect(book).toBeDefined();
    });

    it('should enforce CartItem structure', () => {
      const createCartItem = (params: CartItem): CartItem => params;

      const item = createCartItem({
        book: { id: 'b1', name: 'Book', price: 10, currency: 'USD' },
        quantity: 1,
      });

      expect(item).toBeDefined();
    });

    it('should enforce Cart structure', () => {
      const createCart = (params: Cart): Cart => params;

      const cart = createCart({
        items: [],
        total: 0,
      });

      expect(cart).toBeDefined();
    });
  });
});
