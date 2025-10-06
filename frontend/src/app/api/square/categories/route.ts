import { NextResponse } from 'next/server';
import { getCachedCategories, setCachedCategories } from '@/lib/redis';

// Square catalog types
interface SquareCategoryData {
  name?: string;
}

interface SquareCatalogObject {
  id: string;
  type: string;
  category_data?: SquareCategoryData;
}

interface ProcessedCategory {
  id: string;
  name: string;
}

const SQUARE_BASE_URL = process.env.SQUARE_ENVIRONMENT === 'production' 
  ? 'https://connect.squareup.com' 
  : 'https://connect.squareupsandbox.com';

const SQUARE_ACCESS_TOKEN = process.env.SQUARE_ACCESS_TOKEN; // Private server-side token
const SQUARE_VERSION = '2025-01-09';

async function fetchSquareAPI(endpoint: string, options: RequestInit = {}) {
  if (!SQUARE_ACCESS_TOKEN) {
    throw new Error('Square access token not configured');
  }

  const MAX_RETRIES = 3;
  const RETRY_DELAY_MS = 500; // Match backend delay

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

// GET /api/square/categories
export async function GET() {
  try {
    // Try to get categories from Redis cache first
    const cachedCategories = await getCachedCategories();
    if (cachedCategories) {
      console.log('Returning cached categories');
      return NextResponse.json({ categories: cachedCategories });
    }

    console.log('Cache miss - fetching categories from Square API');
    const data = await fetchSquareAPI('/v2/catalog/list?types=CATEGORY');
    
    if (!data?.objects) {
      return NextResponse.json({ categories: [] });
    }

    const categories = data.objects
      .map((obj: SquareCatalogObject): ProcessedCategory => ({
        id: obj.id,
        name: obj.category_data?.name || 'Unnamed Category'
      }))
      .sort((a: ProcessedCategory, b: ProcessedCategory) => a.name.localeCompare(b.name));

    // Cache the categories
    await setCachedCategories(categories);
    console.log(`Cached ${categories.length} categories`);

    return NextResponse.json({ categories });
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch categories',
      categories: []
    }, { status: 500 });
  }
}