import { NextResponse } from 'next/server';
import { getRedisHealth } from '@/lib/redis';

// GET /api/admin/cache-status - Get comprehensive cache status including Redis
export async function GET() {
  try {
    // Get Redis health information
    const redisHealth = await getRedisHealth();
    
    // Get basic application cache statistics (if needed)
    const cacheStats = {
      redis: redisHealth,
      application: {
        // Add any additional app-level cache stats here
        lastChecked: new Date().toISOString(),
        features: {
          categoriesCache: redisHealth.status === 'connected',
          booksByCategory: redisHealth.status === 'connected',
          bookDataCache: redisHealth.status === 'connected',
          searchResultsCache: redisHealth.status === 'connected',
          imageCaching: redisHealth.status === 'connected',
        }
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
          }
        }
      }
    }, { status: 500 });
  }
}