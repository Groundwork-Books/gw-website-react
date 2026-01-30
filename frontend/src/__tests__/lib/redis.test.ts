/**
 * Unit tests for redis.ts
 * Tests the Redis cache utility functions
 */

// Mock the @upstash/redis module before importing
jest.mock('@upstash/redis', () => {
  const mockRedis = {
    ping: jest.fn(),
    get: jest.fn(),
    setex: jest.fn(),
    exists: jest.fn(),
    del: jest.fn(),
  };
  return {
    Redis: jest.fn(() => mockRedis),
    __mockRedis: mockRedis,
  };
});

// Import after mocking
import {
  CACHE_TTL,
  CACHE_KEYS,
  getCachedData,
  setCachedData,
  isCached,
  deleteCachedData,
  getCacheStatus,
  testRedisConnection,
  getCachedCategories,
  setCachedCategories,
  invalidateCategories,
  getCachedImageUrl,
  setCachedImageUrl,
  setCachedImageUrls,
} from '@/lib/redis';

// Get the mock redis instance
const { __mockRedis: mockRedis } = jest.requireMock('@upstash/redis');

describe('redis.ts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('CACHE_TTL constants', () => {
    it('should have correct TTL values', () => {
      expect(CACHE_TTL.CATEGORIES).toBe(60 * 60 * 24 * 20); // 20 days
      expect(CACHE_TTL.BOOKS_BY_CATEGORY).toBe(60 * 60 * 24 * 10); // 10 days
      expect(CACHE_TTL.IMAGE_URLS).toBe(60 * 60 * 24 * 7); // 7 days
      expect(CACHE_TTL.INSTAGRAM).toBe(60 * 60 * 24 * 20); // 20 days
      expect(CACHE_TTL.COMMUNITY_EVENTS).toBe(60 * 60 * 24 * 7); // 7 days
    });
  });

  describe('CACHE_KEYS constants', () => {
    it('should have correct key prefixes', () => {
      expect(CACHE_KEYS.CATEGORIES).toBe('categories');
      expect(CACHE_KEYS.BOOKS_BY_CATEGORY).toBe('books:category');
      expect(CACHE_KEYS.IMAGE_URLS).toBe('image_urls');
      expect(CACHE_KEYS.INSTAGRAM).toBe('instagram');
      expect(CACHE_KEYS.COMMUNITY_EVENTS).toBe('community_events');
    });
  });

  describe('testRedisConnection', () => {
    it('should return true when Redis connection succeeds', async () => {
      mockRedis.ping.mockResolvedValueOnce('PONG');

      const result = await testRedisConnection();

      expect(result).toBe(true);
      expect(mockRedis.ping).toHaveBeenCalled();
    });

    it('should return false when Redis connection fails', async () => {
      mockRedis.ping.mockRejectedValueOnce(new Error('Connection failed'));

      const result = await testRedisConnection();

      expect(result).toBe(false);
    });
  });

  describe('getCachedData', () => {
    it('should return cached data when it exists', async () => {
      const cachedData = { name: 'Test', value: 123 };
      mockRedis.get.mockResolvedValueOnce(cachedData);

      const result = await getCachedData<typeof cachedData>('test-key');

      expect(result).toEqual(cachedData);
      expect(mockRedis.get).toHaveBeenCalledWith('test-key');
    });

    it('should return null when key does not exist', async () => {
      mockRedis.get.mockResolvedValueOnce(null);

      const result = await getCachedData('nonexistent-key');

      expect(result).toBeNull();
    });

    it('should return null when Redis operation fails', async () => {
      mockRedis.get.mockRejectedValueOnce(new Error('Redis error'));

      const result = await getCachedData('test-key');

      expect(result).toBeNull();
    });
  });

  describe('setCachedData', () => {
    it('should set cached data with default TTL', async () => {
      mockRedis.setex.mockResolvedValueOnce('OK');

      const data = { test: 'data' };
      const result = await setCachedData('test-key', data);

      expect(result).toBe(true);
      expect(mockRedis.setex).toHaveBeenCalledWith(
        'test-key',
        CACHE_TTL.BOOKS_BY_CATEGORY,
        data
      );
    });

    it('should set cached data with custom TTL', async () => {
      mockRedis.setex.mockResolvedValueOnce('OK');

      const data = { test: 'data' };
      const customTTL = 3600;
      const result = await setCachedData('test-key', data, customTTL);

      expect(result).toBe(true);
      expect(mockRedis.setex).toHaveBeenCalledWith('test-key', customTTL, data);
    });

    it('should return false when Redis operation fails', async () => {
      mockRedis.setex.mockRejectedValueOnce(new Error('Redis error'));

      const result = await setCachedData('test-key', { test: 'data' });

      expect(result).toBe(false);
    });
  });

  describe('isCached', () => {
    it('should return true when key exists', async () => {
      mockRedis.exists.mockResolvedValueOnce(1);

      const result = await isCached('existing-key');

      expect(result).toBe(true);
      expect(mockRedis.exists).toHaveBeenCalledWith('existing-key');
    });

    it('should return false when key does not exist', async () => {
      mockRedis.exists.mockResolvedValueOnce(0);

      const result = await isCached('nonexistent-key');

      expect(result).toBe(false);
    });

    it('should return false when Redis operation fails', async () => {
      mockRedis.exists.mockRejectedValueOnce(new Error('Redis error'));

      const result = await isCached('test-key');

      expect(result).toBe(false);
    });
  });

  describe('deleteCachedData', () => {
    it('should return true when key is deleted successfully', async () => {
      mockRedis.del.mockResolvedValueOnce(1);

      const result = await deleteCachedData('test-key');

      expect(result).toBe(true);
      expect(mockRedis.del).toHaveBeenCalledWith('test-key');
    });

    it('should return false when key does not exist', async () => {
      mockRedis.del.mockResolvedValueOnce(0);

      const result = await deleteCachedData('nonexistent-key');

      expect(result).toBe(false);
    });

    it('should return false when Redis operation fails', async () => {
      mockRedis.del.mockRejectedValueOnce(new Error('Redis error'));

      const result = await deleteCachedData('test-key');

      expect(result).toBe(false);
    });
  });

  describe('getCacheStatus', () => {
    it('should return connected status when Redis is working', async () => {
      mockRedis.ping.mockResolvedValueOnce('PONG');

      const result = await getCacheStatus();

      expect(result.connected).toBe(true);
      expect(result.provider).toBe('Upstash Redis');
      expect(result.timestamp).toBeDefined();
    });

    it('should return disconnected status when Redis fails', async () => {
      mockRedis.ping.mockRejectedValueOnce(new Error('Connection failed'));

      const result = await getCacheStatus();

      expect(result.connected).toBe(false);
      expect(result.provider).toBe('Upstash Redis');
    });
  });

  describe('Category-specific cache functions', () => {
    describe('getCachedCategories', () => {
      it('should fetch categories from cache', async () => {
        const categories = [
          { id: 'cat-1', name: 'Fiction' },
          { id: 'cat-2', name: 'Non-Fiction' },
        ];
        mockRedis.get.mockResolvedValueOnce(categories);

        const result = await getCachedCategories();

        expect(result).toEqual(categories);
        expect(mockRedis.get).toHaveBeenCalledWith(CACHE_KEYS.CATEGORIES);
      });
    });

    describe('setCachedCategories', () => {
      it('should cache categories with correct TTL', async () => {
        mockRedis.setex.mockResolvedValueOnce('OK');
        const categories = [{ id: 'cat-1', name: 'Fiction' }];

        const result = await setCachedCategories(categories);

        expect(result).toBe(true);
        expect(mockRedis.setex).toHaveBeenCalledWith(
          CACHE_KEYS.CATEGORIES,
          CACHE_TTL.CATEGORIES,
          categories
        );
      });
    });

    describe('invalidateCategories', () => {
      it('should delete categories cache', async () => {
        mockRedis.del.mockResolvedValueOnce(1);

        const result = await invalidateCategories();

        expect(result).toBe(true);
        expect(mockRedis.del).toHaveBeenCalledWith(CACHE_KEYS.CATEGORIES);
      });
    });
  });

  describe('Image URL cache functions', () => {
    describe('getCachedImageUrl', () => {
      it('should fetch image URL from cache', async () => {
        mockRedis.get.mockResolvedValueOnce('https://example.com/image.jpg');

        const result = await getCachedImageUrl('img-123');

        expect(result).toBe('https://example.com/image.jpg');
        expect(mockRedis.get).toHaveBeenCalledWith(`${CACHE_KEYS.IMAGE_URLS}:img-123`);
      });
    });

    describe('setCachedImageUrl', () => {
      it('should cache image URL with correct TTL', async () => {
        mockRedis.setex.mockResolvedValueOnce('OK');

        const result = await setCachedImageUrl('img-123', 'https://example.com/image.jpg');

        expect(result).toBe(true);
        expect(mockRedis.setex).toHaveBeenCalledWith(
          `${CACHE_KEYS.IMAGE_URLS}:img-123`,
          CACHE_TTL.IMAGE_URLS,
          'https://example.com/image.jpg'
        );
      });
    });

    describe('setCachedImageUrls', () => {
      it('should cache multiple image URLs', async () => {
        mockRedis.setex.mockResolvedValue('OK');

        const imageUrlMap = {
          'img-1': 'https://example.com/1.jpg',
          'img-2': 'https://example.com/2.jpg',
          'img-3': 'https://example.com/3.jpg',
        };

        const results = await setCachedImageUrls(imageUrlMap);

        expect(results).toEqual([true, true, true]);
        expect(mockRedis.setex).toHaveBeenCalledTimes(3);
      });

      it('should handle partial failures', async () => {
        mockRedis.setex
          .mockResolvedValueOnce('OK')
          .mockRejectedValueOnce(new Error('Error'))
          .mockResolvedValueOnce('OK');

        const imageUrlMap = {
          'img-1': 'https://example.com/1.jpg',
          'img-2': 'https://example.com/2.jpg',
          'img-3': 'https://example.com/3.jpg',
        };

        const results = await setCachedImageUrls(imageUrlMap);

        expect(results).toEqual([true, false, true]);
      });
    });
  });
});
