import { NextRequest, NextResponse } from 'next/server';
import { 
  invalidateCategories, 
  invalidateBooksByCategory, 
  invalidateBookData, 
  invalidateAllCache,
  invalidateImageUrls,
  getRedisHealth,
  deletePattern 
} from '@/lib/redis';

// Authentication helper (using basic auth for admin endpoints)
function isAuthenticated(request: NextRequest): boolean {
  const auth = request.headers.get('authorization');
  if (!auth) return false;

  const encoded = auth.split(' ')[1];
  if (!encoded) return false;

  try {
    const decoded = Buffer.from(encoded, 'base64').toString();
    const [username, password] = decoded.split(':');
    
    // You should replace these with secure credentials from environment variables
    const adminUsername = process.env.CACHE_ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.CACHE_ADMIN_PASSWORD || 'change_me_in_production';
    
    return username === adminUsername && password === adminPassword;
  } catch {
    return false;
  }
}

// GET /api/cache/health - Get Redis cluster health status
export async function GET() {
  try {
    const health = await getRedisHealth();
    return NextResponse.json(health);
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST /api/cache/invalidate - Clear cache with optional scope
export async function POST(request: NextRequest) {
  try {
    // Check authentication for cache invalidation
    if (!isAuthenticated(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { scope, categoryId, imageId } = body;

    let deletedCount = 0;
    let message = '';

    switch (scope) {
      case 'categories':
        const categoriesSuccess = await invalidateCategories();
        deletedCount = categoriesSuccess ? 1 : 0;
        message = 'Categories cache invalidated';
        break;
        
      case 'books-by-category':
        if (categoryId) {
          const success = await invalidateBooksByCategory(categoryId);
          message = `Books cache invalidated for category: ${categoryId}`;
          deletedCount = typeof success === 'boolean' ? (success ? 1 : 0) : success;
        } else {
          const result = await invalidateBooksByCategory();
          deletedCount = typeof result === 'boolean' ? (result ? 1 : 0) : result;
          message = `Books cache invalidated for all categories (${deletedCount} entries)`;
        }
        break;
        
      case 'image-urls':
        if (imageId) {
          const success = await invalidateImageUrls(imageId);
          message = `Image URL cache invalidated for image: ${imageId}`;
          deletedCount = typeof success === 'boolean' ? (success ? 1 : 0) : success;
        } else {
          const result = await invalidateImageUrls();
          deletedCount = typeof result === 'boolean' ? (result ? 1 : 0) : result;
          message = `Image URL cache invalidated for all images (${deletedCount} entries)`;
        }
        break;
        
      case 'all':
      default:
        deletedCount = await invalidateAllCache();
        message = `All cache entries invalidated (${deletedCount} entries)`;
        break;
    }

    return NextResponse.json({
      success: true,
      message,
      deletedCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Cache invalidation error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// PUT /api/cache/invalidate - Alternative endpoint for cache clearing (no body required)
export async function PUT(request: NextRequest) {
  try {
    if (!isAuthenticated(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const scope = searchParams.get('scope') || 'all';
    const categoryId = searchParams.get('categoryId') || undefined;
    const imageId = searchParams.get('imageId') || undefined;

    // Reuse POST logic
    const mockBody = { scope, categoryId, imageId };
    const mockRequest = {
      ...request,
      json: async () => mockBody
    } as NextRequest;

    return POST(mockRequest);
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}