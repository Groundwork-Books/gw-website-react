/**
 * Unit tests for api.ts
 * Tests the client-side API functions
 */

import { searchBooks, getInstagramPosts, getEvents, SearchResult, InstagramPost, Event } from '@/lib/api';

// Mock fetch globally (already set up in jest.setup.ts)
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

describe('api.ts', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe('searchBooks', () => {
    const mockPineconeResponse = {
      success: true,
      results: [
        { id: 'book-1', name: 'Test Book 1', searchScore: 0.95, searchSnippet: 'A test snippet' },
        { id: 'book-2', name: 'Test Book 2', searchScore: 0.85, searchSnippet: 'Another snippet' },
      ],
    };

    const mockBatchBooksResponse = {
      books: [
        { id: 'book-1', name: 'Test Book 1', price: 19.99, currency: 'USD', description: 'Description 1' },
        { id: 'book-2', name: 'Test Book 2', price: 24.99, currency: 'USD', description: 'Description 2' },
      ],
    };

    it('should search books and return enriched results', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockPineconeResponse,
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockBatchBooksResponse,
        } as Response);

      const result = await searchBooks('test query');

      expect(mockFetch).toHaveBeenCalledWith('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: 'test query', limit: 10 }),
      });
      expect(result.success).toBe(true);
      expect(result.query).toBe('test query');
      expect(result.results).toHaveLength(2);
      expect(result.results[0].id).toBe('book-1');
      expect(result.results[0].searchScore).toBe(0.95);
    });

    it('should use custom limit when provided', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, results: [] }),
        } as Response);

      await searchBooks('test', 20);

      expect(mockFetch).toHaveBeenCalledWith('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: 'test', limit: 20 }),
      });
    });

    it('should return empty results when search API fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      } as Response);

      const result = await searchBooks('test query');

      expect(result.success).toBe(false);
      expect(result.results).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('should handle invalid search response structure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: false }),
      } as Response);

      const result = await searchBooks('test query');

      expect(result.success).toBe(false);
      expect(result.results).toHaveLength(0);
    });

    it('should fallback to Pinecone data when batch fetch fails', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockPineconeResponse,
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
        } as Response);

      const result = await searchBooks('test query');

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(2);
      // Fallback results should have price 0
      expect(result.results[0].price).toBe(0);
    });

    it('should handle network errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await searchBooks('test query');

      expect(result.success).toBe(false);
      expect(result.results).toHaveLength(0);
    });

    it('should return empty results when no book IDs found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, results: [] }),
      } as Response);

      const result = await searchBooks('nonexistent');

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe('getInstagramPosts', () => {
    const mockInstagramPosts: InstagramPost[] = [
      { postUrl: 'https://instagram.com/p/1', altText: 'Post 1', order: 1, active: true },
      { postUrl: 'https://instagram.com/p/2', altText: 'Post 2', order: 2, active: true },
    ];

    it('should fetch Instagram posts successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockInstagramPosts,
      } as Response);

      const result = await getInstagramPosts();

      expect(mockFetch).toHaveBeenCalledWith('/api/instagram');
      expect(result).toHaveLength(2);
      expect(result[0].postUrl).toBe('https://instagram.com/p/1');
    });

    it('should return fallback data when API fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      } as Response);

      const result = await getInstagramPosts();

      // Should return fallback data
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('postUrl');
      expect(result[0]).toHaveProperty('altText');
      expect(result[0]).toHaveProperty('order');
      expect(result[0]).toHaveProperty('active');
    });

    it('should return fallback data when network error occurs', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await getInstagramPosts();

      // Should return fallback data
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('getEvents', () => {
    const mockEvents: Event[] = [
      {
        eventName: 'Book Reading',
        date: '2025-03-15',
        description: 'A community book reading event',
        imageUrl: '/images/event1.jpg',
        location: 'Main Hall',
        link: 'https://example.com/event1',
        active: true,
      },
      {
        eventName: 'Author Talk',
        date: '2025-03-20',
        description: 'Meet the author session',
        imageUrl: '/images/event2.jpg',
        location: 'Conference Room',
        link: 'https://example.com/event2',
        active: true,
      },
    ];

    it('should fetch events successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockEvents,
      } as Response);

      const result = await getEvents();

      expect(mockFetch).toHaveBeenCalledWith('/api/events');
      expect(result).toHaveLength(2);
      expect(result[0].eventName).toBe('Book Reading');
    });

    it('should return fallback data when API fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      } as Response);

      const result = await getEvents();

      // Should return fallback data
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('eventName');
      expect(result[0]).toHaveProperty('date');
      expect(result[0]).toHaveProperty('description');
      expect(result[0]).toHaveProperty('location');
    });

    it('should return fallback data when network error occurs', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await getEvents();

      // Should return fallback data
      expect(result.length).toBeGreaterThan(0);
    });

    it('should return events with all required fields', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockEvents,
      } as Response);

      const result = await getEvents();

      result.forEach(event => {
        expect(event).toHaveProperty('eventName');
        expect(event).toHaveProperty('date');
        expect(event).toHaveProperty('description');
        expect(event).toHaveProperty('imageUrl');
        expect(event).toHaveProperty('location');
        expect(event).toHaveProperty('link');
        expect(event).toHaveProperty('active');
      });
    });
  });
});
