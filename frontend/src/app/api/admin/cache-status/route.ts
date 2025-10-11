import { NextResponse } from 'next/server';
import { getRedisHealth, CACHE_TTL, CACHE_KEYS } from '@/lib/redis';

// GET /api/admin/cache-status - Get comprehensive cache status including Redis and cache context
export async function GET() {
  try {
    // Get Redis health information
    const redisHealth = await getRedisHealth();

    // Provide cache context (configuration and conventions)
    const cacheContext = {
      ttlSeconds: CACHE_TTL,
      keyNamespaces: CACHE_KEYS,
      conventions: {
        categories: CACHE_KEYS.CATEGORIES,
        booksByCategory: `${CACHE_KEYS.BOOKS_BY_CATEGORY}:{categoryId}`,
        imageUrls: `${CACHE_KEYS.IMAGE_URLS}:{imageId}`,
        instagram: CACHE_KEYS.INSTAGRAM,
        communityEvents: CACHE_KEYS.COMMUNITY_EVENTS,
      },
      limitations: [
        'Upstash REST API does not support SCAN/pattern deletion; keys should be tracked explicitly for bulk operations',
        'Image cache and books-by-category counts are estimated unless keys are tracked in a set',
      ],
      recommendedPractices: [
        'Use explicit, namespaced keys with stable prefixes',
        'Invalidate by exact key when possible; maintain an index of keys per feature if bulk invalidation is needed',
        'Prefer long TTLs for categories and shorter TTLs for items whose URLs can expire (e.g., images)',
      ],
    };
    
    // Application cache feature flags
    const cacheStats = {
      redis: redisHealth,
      application: {
        lastChecked: new Date().toISOString(),
        features: {
          categoriesCache: redisHealth.status === 'connected',
          booksByCategory: redisHealth.status === 'connected',
          bookDataCache: false, // Individual book cache removed; use category caches
          searchResultsCache: false, // Not implemented currently
          imageCaching: redisHealth.status === 'connected',
          instagramCache: redisHealth.status === 'connected',
          communityEventsCache: redisHealth.status === 'connected',
        },
        context: cacheContext,
      }
    };

    return NextResponse.json({
      success: true,
      data: cacheStats
    });
  } catch (error) {
    console.error('Error getting cache status:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: {
        redis: {
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        application: {
          lastChecked: new Date().toISOString(),
          features: {
            categoriesCache: false,
            booksByCategory: false,
            bookDataCache: false,
            searchResultsCache: false,
            imageCaching: false,
            instagramCache: false,
            communityEventsCache: false,
          },
          context: {
            ttlSeconds: CACHE_TTL,
            keyNamespaces: CACHE_KEYS,
          }
        }
      }
    }, { status: 500 });
  }
}