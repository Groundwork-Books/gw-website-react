import { Redis } from '@upstash/redis';

// Cache TTL configuration (in seconds)
export const CACHE_TTL = {
  CATEGORIES: 60 * 60 * 24 * 20, // 20 days
  BOOKS_BY_CATEGORY: 60 * 60 * 24 * 10, // 10 days
  BOOK_DATA: 60 * 60 * 24 * 10, // 10 days
  SEARCH_RESULTS: 60 * 60 * 24 * 10, // 10 days
  IMAGE_URLS: 60 * 60 * 24 * 7, // 7 days - URLs may expire
} as const;

// Cache key prefixes for organization
export const CACHE_KEYS = {
  CATEGORIES: 'categories',
  BOOKS_BY_CATEGORY: 'books:category',
  BOOK_DATA: 'book',
  SEARCH_RESULTS: 'search',
  IMAGE_URLS: 'image_urls',
} as const;

// Upstash Redis configuration from environment variables
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Utility function to handle Redis errors gracefully
async function safeRedisOperation<T>(operation: () => Promise<T>): Promise<T | null> {
  try {
    return await operation();
  } catch (error) {
    console.error('Redis operation failed:', error);
    return null;
  }
}

// Get Redis client (simplified for Upstash)
export async function getRedisClient() {
  return redis;
}

// Test Redis connection
export async function testRedisConnection(): Promise<boolean> {
  try {
    const pong = await redis.ping();
    console.log('Redis connection test:', pong);
    return true;
  } catch (error) {
    console.error('Redis connection failed:', error);
    return false;
  }
}

// Generic cache get function
export async function getCachedData<T>(key: string): Promise<T | null> {
  return safeRedisOperation(async () => {
    const data = await redis.get(key);
    if (data === null) return null;
    return data as T;
  });
}

// Generic cache set function with TTL
export async function setCachedData<T>(key: string, data: T, ttl: number = CACHE_TTL.BOOK_DATA): Promise<boolean> {
  const success = await safeRedisOperation(async () => {
    // Upstash Redis automatically handles JSON serialization, so we don't need to stringify
    await redis.setex(key, ttl, data);
    return true;
  });
  return success ?? false;
}

// Check if key exists in cache
export async function isCached(key: string): Promise<boolean> {
  const exists = await safeRedisOperation(async () => {
    const result = await redis.exists(key);
    return result === 1;
  });
  return exists ?? false;
}

// Delete a specific cache key
export async function deleteCachedData(key: string): Promise<boolean> {
  const success = await safeRedisOperation(async () => {
    const result = await redis.del(key);
    return result > 0;
  });
  return success ?? false;
}

// Delete multiple keys matching a pattern
export async function deletePattern(): Promise<number> {
  const deleted = await safeRedisOperation(async () => {
    // Note: Upstash doesn't support SCAN, so we need to track keys manually
    // For now, we'll return 0 and log a warning
    console.warn('Pattern deletion not supported with Upstash REST API. Consider tracking keys manually.');
    return 0;
  });
  return deleted ?? 0;
}

// Get cache status and health information
export async function getCacheStatus() {
  try {
    const isConnected = await testRedisConnection();
    return {
      connected: isConnected,
      provider: 'Upstash Redis',
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      connected: false,
      provider: 'Upstash Redis',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    };
  }
}

// Get Redis health information (alias for getCacheStatus for backward compatibility)
export async function getRedisHealth() {
  const status = await getCacheStatus();
  
  // Get additional cache metrics
  const imageCacheStats = await getImageCacheStats();
  
  return {
    status: status.connected ? 'connected' : 'disconnected',
    provider: status.provider,
    timestamp: status.timestamp,
    error: status.error || null,
    imageCacheStats,
  };
}

// Get image cache statistics
export async function getImageCacheStats() {
  try {
    // Since Upstash doesn't support SCAN, we'll use a different approach
    // We could maintain a set of image cache keys, but for simplicity,
    // we'll return placeholder stats and log a warning
    console.warn('Image cache statistics are limited with Upstash REST API');
    
    return {
      imageCount: 0, // Would need to track manually
      estimatedSizeKB: '0',
      note: 'Detailed stats require key tracking with Upstash REST API'
    };
  } catch (error) {
    return {
      imageCount: 0,
      estimatedSizeKB: '0',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Specific cache functions for categories and books
export async function getCachedCategories(): Promise<Array<{id: string, name: string}> | null> {
  return await getCachedData<Array<{id: string, name: string}>>(CACHE_KEYS.CATEGORIES);
}

export async function setCachedCategories(data: Array<{id: string, name: string}>): Promise<boolean> {
  return await setCachedData(CACHE_KEYS.CATEGORIES, data, CACHE_TTL.CATEGORIES);
}

export async function getCachedBooksByCategory(cacheKey: string): Promise<{books: unknown[], metadata?: {totalBooks: number, booksWithImageIds: number}} | null> {
  return await getCachedData<{books: unknown[], metadata?: {totalBooks: number, booksWithImageIds: number}}>(`${CACHE_KEYS.BOOKS_BY_CATEGORY}:${cacheKey}`);
}

export async function setCachedBooksByCategory(cacheKey: string, data: {books: unknown[], metadata?: {totalBooks: number, booksWithImageIds: number}}): Promise<boolean> {
  return await setCachedData(`${CACHE_KEYS.BOOKS_BY_CATEGORY}:${cacheKey}`, data, CACHE_TTL.BOOKS_BY_CATEGORY);
}

export async function getCachedSearchResults(searchKey: string): Promise<{books: unknown[], totalCount: number} | null> {
  return await getCachedData<{books: unknown[], totalCount: number}>(`${CACHE_KEYS.SEARCH_RESULTS}:${searchKey}`);
}

export async function setCachedSearchResults(searchKey: string, data: {books: unknown[], totalCount: number}): Promise<boolean> {
  return await setCachedData(`${CACHE_KEYS.SEARCH_RESULTS}:${searchKey}`, data, CACHE_TTL.SEARCH_RESULTS);
}

export async function getCachedBooksData(cacheKey: string): Promise<unknown | null> {
  return await getCachedData<unknown>(`${CACHE_KEYS.BOOK_DATA}:${cacheKey}`);
}

export async function setCachedBooksData(cacheKey: string, data: unknown): Promise<boolean> {
  return await setCachedData(`${CACHE_KEYS.BOOK_DATA}:${cacheKey}`, data, CACHE_TTL.BOOK_DATA);
}

// Cache invalidation functions
export async function invalidateCategories(): Promise<boolean> {
  return await deleteCachedData(CACHE_KEYS.CATEGORIES);
}

export async function invalidateBooksByCategory(categoryId?: string): Promise<boolean | number> {
  if (categoryId) {
    return await deleteCachedData(`${CACHE_KEYS.BOOKS_BY_CATEGORY}:${categoryId}`);
  } else {
    // For Upstash, we need to manually track and delete keys
    // This is a limitation of the REST API - pattern deletion isn't supported
    console.warn('Pattern deletion not fully supported with Upstash REST API');
    return 0;
  }
}

export async function invalidateBookData(bookId?: string): Promise<boolean | number> {
  if (bookId) {
    return await deleteCachedData(`${CACHE_KEYS.BOOK_DATA}:${bookId}`);
  } else {
    // For Upstash, we need to manually track and delete keys
    console.warn('Pattern deletion not fully supported with Upstash REST API');
    return 0;
  }
}

export async function invalidateAllCache(): Promise<number> {
  // Since pattern deletion isn't supported, we'll delete known cache keys
  let deletedCount = 0;
  
  // Delete main category cache
  if (await deleteCachedData(CACHE_KEYS.CATEGORIES)) {
    deletedCount++;
  }
  
  // Note: For a more complete implementation with Upstash, you would need to:
  // 1. Maintain a set of all cache keys
  // 2. Delete each key individually
  // 3. Use a background job to clean up expired keys
  
  console.warn('Full cache invalidation limited with Upstash REST API. Only main categories cleared.');
  console.info('To fully clear all cache, use individual scope invalidation for: books-by-category, book-data, image-urls');
  return deletedCount;
}

// Image URL caching functions
export async function getCachedImageUrl(imageId: string): Promise<string | null> {
  return await getCachedData<string>(`${CACHE_KEYS.IMAGE_URLS}:${imageId}`);
}

export async function setCachedImageUrl(imageId: string, imageUrl: string): Promise<boolean> {
  return await setCachedData(`${CACHE_KEYS.IMAGE_URLS}:${imageId}`, imageUrl, CACHE_TTL.IMAGE_URLS);
}

export async function invalidateImageUrls(imageId?: string): Promise<boolean | number> {
  if (imageId) {
    return await deleteCachedData(`${CACHE_KEYS.IMAGE_URLS}:${imageId}`);
  } else {
    console.warn('Pattern deletion not fully supported with Upstash REST API');
    return 0;
  }
}

// Cache multiple image URLs at once for efficiency
export async function setCachedImageUrls(imageUrlMap: Record<string, string>): Promise<boolean[]> {
  const promises = Object.entries(imageUrlMap).map(([imageId, imageUrl]) =>
    setCachedImageUrl(imageId, imageUrl)
  );
  return await Promise.all(promises);
}

// Graceful shutdown (not needed for Upstash REST API, but kept for compatibility)
export async function closeRedisConnection() {
  console.log('Upstash Redis uses REST API - no persistent connection to close');
}