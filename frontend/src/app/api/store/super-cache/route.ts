import { NextRequest, NextResponse } from 'next/server';
import { getRedisClient } from '@/lib/redis';

// Square API response types
interface SquareCategoryData {
  name?: string;
}

interface SquareCatalogObject {
  id: string;
  type: string;
  category_data?: SquareCategoryData;
}

interface SquareCategoriesResponse {
  objects?: SquareCatalogObject[];
}

interface SquareMoneyAmount {
  amount?: number;
  currency?: string;
}

interface SquareItemVariationData {
  price_money?: SquareMoneyAmount;
  item_id?: string;
}

interface SquareItemVariation {
  item_variation_data?: SquareItemVariationData;
}

interface SquareItemData {
  name?: string;
  description?: string;
  variations?: SquareItemVariation[];
  image_ids?: string[];
}

interface SquareCatalogItem {
  id: string;
  item_data?: SquareItemData;
}

interface SquareItemsResponse {
  items?: SquareCatalogItem[];
}

interface SquareImageData {
  url?: string;
}

interface SquareImageObject {
  id: string;
  image_data?: SquareImageData;
}

interface SquareImagesResponse {
  objects?: SquareImageObject[];
}

// Interfaces for the super cache response
interface SuperCacheBook {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  categoryId: string;
  imageId: string | null;
  imageUrl?: string | null;
}

interface Category {
  id: string;
  name: string;
}

interface SuperCacheResponse {
  categories: Category[];
  defaultBooks: Record<string, SuperCacheBook[]>;
  imageUrls: Record<string, string>;
  metadata: {
    totalBooks: number;
    categoriesCount: number;
    imagesCount: number;
    cacheInfo: {
      cached: boolean;
      timestamp: number;
      ttl: number;
    };
  };
}

// Super cache configuration
const SUPER_CACHE_KEY = 'store:super-cache';
const SUPER_CACHE_TTL = 60*60*1; // 1 hour

// Enable Vercel server-side caching for the GET endpoint only
export const revalidate = 900; // 15 minutes for GET responses

// Default categories from environment variables
const DEFAULT_CATEGORY_IDS = (process.env.NEXT_PUBLIC_CATEGORY_IDS || '').split(',').map(s => s.trim()).filter(Boolean);
const DEFAULT_CATEGORY_NAMES = (process.env.NEXT_PUBLIC_CATEGORY_NAMES || '').split(',').map(s => s.trim()).filter(Boolean);

const SQUARE_BASE_URL = process.env.SQUARE_ENVIRONMENT === 'production' 
  ? 'https://connect.squareup.com' 
  : 'https://connect.squareupsandbox.com';

const SQUARE_ACCESS_TOKEN = process.env.SQUARE_ACCESS_TOKEN;
const SQUARE_VERSION = '2025-01-09';

async function fetchSquareAPI(endpoint: string, options: RequestInit = {}) {
  if (!SQUARE_ACCESS_TOKEN) {
    throw new Error('Square access token not configured');
  }

  const MAX_RETRIES = 3;
  const RETRY_DELAY_MS = 500;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(`${SQUARE_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          'Authorization': `Bearer ${SQUARE_ACCESS_TOKEN}`,
          'Square-Version': SQUARE_VERSION,
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (response.status === 429) {
        const delay = RETRY_DELAY_MS * Math.pow(2, attempt);
        console.warn(`Square API rate limited, retrying in ${delay}ms... (attempt ${attempt + 1})`);
        if (attempt < MAX_RETRIES) {
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        return null;
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Square API error: ${response.status} - ${errorText}`);
      }

      return response.json();
    } catch (error) {
      if (attempt === MAX_RETRIES) {
        throw error;
      }
      const delay = RETRY_DELAY_MS * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  return null;
}

// GET /api/store/super-cache - Instantly return pre-cached data
export async function GET() {
  try {
    const redis = await getRedisClient();
    const cachedData = await redis.get(SUPER_CACHE_KEY);
    
    if (cachedData) {
      console.log('Super cache: Serving pre-cached data instantly');
      const response = typeof cachedData === 'string' ? JSON.parse(cachedData) : cachedData;
      
      return NextResponse.json(response, {
        headers: {
          'Cache-Control': 's-maxage=300, stale-while-revalidate=600', // 5min cache, 10min stale
          'X-Cache-Status': 'HIT',
          'X-Cache-Timestamp': response.metadata?.cacheInfo?.timestamp?.toString() || Date.now().toString()
        }
      });
    }

    console.log('Super cache: No cached data found, returning fallback');
    
    // Return minimal fallback data and trigger cache population
    const fallbackResponse: SuperCacheResponse = {
      categories: DEFAULT_CATEGORY_IDS.map((id, i) => ({
        id,
        name: DEFAULT_CATEGORY_NAMES[i] || `Category ${i + 1}`
      })),
      defaultBooks: {},
      imageUrls: {},
      metadata: {
        totalBooks: 0,
        categoriesCount: DEFAULT_CATEGORY_IDS.length,
        imagesCount: 0,
        cacheInfo: {
          cached: false,
          timestamp: Date.now(),
          ttl: 0
        }
      }
    };

    return NextResponse.json(fallbackResponse, {
      headers: {
        'Cache-Control': 'no-cache', // Don't cache fallback responses
        'X-Cache-Status': 'MISS'
      }
    });

  } catch (error) {
    console.error('Super cache GET error:', error);
    
    const errorResponse: SuperCacheResponse = {
      categories: DEFAULT_CATEGORY_IDS.map((id, i) => ({
        id,
        name: DEFAULT_CATEGORY_NAMES[i] || `Category ${i + 1}`
      })),
      defaultBooks: {},
      imageUrls: {},
      metadata: {
        totalBooks: 0,
        categoriesCount: DEFAULT_CATEGORY_IDS.length,
        imagesCount: 0,
        cacheInfo: {
          cached: false,
          timestamp: Date.now(),
          ttl: 0
        }
      }
    };

    return NextResponse.json(errorResponse, { 
      status: 500,
      headers: {
        'Cache-Control': 'no-cache',
        'X-Cache-Status': 'ERROR'
      }
    });
  }
}

// POST /api/store/super-cache - Populate the super cache with provided store data
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  console.log('Super cache: Starting cache population...');

  try {
    // Optional: Add authentication for cache population
    const authHeader = request.headers.get('authorization');
    const adminKey = process.env.CACHE_ADMIN_KEY;
    
    if (adminKey && authHeader !== `Bearer ${adminKey}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Check if data is being provided (from store page) or if we should fetch fresh data
    if (body.storeData) {
      console.log('Super cache: Populating with provided store data...');
      
      const { categories, defaultBooks, imageUrls } = body.storeData;
      
      // Validate the provided data structure
      if (!categories || !defaultBooks) {
        return NextResponse.json({ 
          error: 'Invalid store data: categories and defaultBooks are required' 
        }, { status: 400 });
      }

      // Calculate metadata
      const totalBooks = Object.values(defaultBooks).flat().length;
      const imagesCount = Object.keys(imageUrls || {}).length;

      const cacheData: SuperCacheResponse = {
        categories,
        defaultBooks,
        imageUrls: imageUrls || {},
        metadata: {
          totalBooks,
          categoriesCount: categories.length,
          imagesCount,
          cacheInfo: {
            cached: true,
            timestamp: Date.now(),
            ttl: SUPER_CACHE_TTL
          }
        }
      };

      // Store in Redis
      const redis = await getRedisClient();
      await redis.setex(SUPER_CACHE_KEY, SUPER_CACHE_TTL, JSON.stringify(cacheData));

      const totalTime = Date.now() - startTime;
      console.log(`Super cache: Population complete with provided data! ${totalBooks} books in ${totalTime}ms`);

      return NextResponse.json({
        success: true,
        message: 'Super cache populated with provided data',
        metadata: cacheData.metadata,
        populationTime: totalTime
      });
    }

    // If no data provided, fetch fresh data from Square API (original behavior)
    console.log('Super cache: No data provided, fetching fresh from Square API...');
    
    // Step 1: Fetch categories from Square API
    console.log('Super cache: Fetching categories...');
    const categoriesData = await fetchSquareAPI('/v2/catalog/list?types=CATEGORY') as SquareCategoriesResponse | null;
    
    let categories: Category[];
    if (!categoriesData?.objects) {
      console.log('Super cache: Using fallback categories');
      categories = DEFAULT_CATEGORY_IDS.map((id, i) => ({
        id,
        name: DEFAULT_CATEGORY_NAMES[i] || `Category ${i + 1}`
      }));
    } else {
      categories = categoriesData.objects
        .map((obj: SquareCatalogObject): Category => ({
          id: obj.id,
          name: obj.category_data?.name || 'Unnamed Category'
        }))
        .sort((a: Category, b: Category) => a.name.localeCompare(b.name));
    }

    // Step 2: Fetch books for default categories
    const targetCategoryIds = DEFAULT_CATEGORY_IDS.length > 0 
      ? DEFAULT_CATEGORY_IDS 
      : categories.slice(0, 6).map((cat: Category) => cat.id);

    console.log(`Super cache: Fetching books for ${targetCategoryIds.length} categories...`);
    
    const allBooks: Record<string, SuperCacheBook[]> = {};
    const categoryPromises = targetCategoryIds.map(async (categoryId: string) => {
      try {
        const data = await fetchSquareAPI('/v2/catalog/search-catalog-items', {
          method: 'POST',
          body: JSON.stringify({
            category_ids: [categoryId],
            limit: 20
          }),
        }) as SquareItemsResponse | null;

        if (!data?.items) {
          return { categoryId, books: [] };
        }

        const books: SuperCacheBook[] = data.items.map((item: SquareCatalogItem): SuperCacheBook => {
          const itemData = item.item_data;
          const variation = itemData?.variations?.[0];
          const price = variation?.item_variation_data?.price_money;

          return {
            id: item.id,
            name: itemData?.name || 'Unnamed Book',
            description: itemData?.description || 'No description available',
            price: price ? Number(price.amount) / 100 : 0,
            currency: price?.currency || 'USD',
            categoryId: categoryId,
            imageId: itemData?.image_ids?.[0] || null,
            imageUrl: null
          };
        });

        return { categoryId, books };
      } catch (error) {
        console.error(`Super cache: Error fetching books for category ${categoryId}:`, error);
        return { categoryId, books: [] };
      }
    });

    const results = await Promise.all(categoryPromises);
    results.forEach(({ categoryId, books }) => {
      allBooks[categoryId] = books;
    });

    // Step 3: Fetch image URLs for all books
    const allImageIds = new Set<string>();
    Object.values(allBooks).flat().forEach(book => {
      if (book.imageId) {
        allImageIds.add(book.imageId);
      }
    });

    const imageUrls: Record<string, string> = {};
    if (allImageIds.size > 0) {
      console.log(`Super cache: Fetching ${allImageIds.size} image URLs...`);
      
      try {
        const imageData = await fetchSquareAPI('/v2/catalog/images/batch-retrieve', {
          method: 'POST',
          body: JSON.stringify({
            object_ids: Array.from(allImageIds)
          }),
        }) as SquareImagesResponse | null;

        if (imageData?.objects) {
          imageData.objects.forEach((obj: SquareImageObject) => {
            if (obj.image_data?.url) {
              imageUrls[obj.id] = obj.image_data.url;
            }
          });
        }
      } catch (imageError) {
        console.warn('Super cache: Failed to fetch images, proceeding without them');
      }
    }

    // Step 4: Update books with image URLs
    Object.keys(allBooks).forEach(categoryId => {
      allBooks[categoryId] = allBooks[categoryId].map(book => ({
        ...book,
        imageUrl: book.imageId ? (imageUrls[book.imageId] || null) : null
      }));
    });

    // Step 5: Create final response and cache it
    const totalBooks = Object.values(allBooks).flat().length;
    const imagesCount = Object.keys(imageUrls).length;
    const totalTime = Date.now() - startTime;

    const cacheData: SuperCacheResponse = {
      categories,
      defaultBooks: allBooks,
      imageUrls,
      metadata: {
        totalBooks,
        categoriesCount: categories.length,
        imagesCount,
        cacheInfo: {
          cached: true,
          timestamp: Date.now(),
          ttl: SUPER_CACHE_TTL
        }
      }
    };

    // Store in Redis
    const redis = await getRedisClient();
    await redis.setex(SUPER_CACHE_KEY, SUPER_CACHE_TTL, JSON.stringify(cacheData));

    console.log(`Super cache: Population complete! ${totalBooks} books, ${imagesCount} images in ${totalTime}ms`);

    return NextResponse.json({
      success: true,
      message: 'Super cache populated successfully',
      metadata: cacheData.metadata,
      populationTime: totalTime
    });

  } catch (error) {
    console.error('Super cache: Population failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      populationTime: Date.now() - startTime
    }, { status: 500 });
  }
}