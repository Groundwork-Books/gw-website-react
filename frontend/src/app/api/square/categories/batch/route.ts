import { NextRequest, NextResponse } from 'next/server';

const SQUARE_BASE_URL = process.env.SQUARE_ENVIRONMENT === 'production' 
  ? 'https://connect.squareup.com' 
  : 'https://connect.squareupsandbox.com';

const SQUARE_ACCESS_TOKEN = process.env.SQUARE_ACCESS_TOKEN;
const SQUARE_VERSION = '2025-01-09';

interface BatchRetrieveResponse {
  objects?: SquareCatalogCategory[];
  errors?: Array<{ code?: string; detail?: string; category?: string }>;
}

interface SquareCatalogCategory {
  id: string;
  type: string;
  category_data?: {
    name?: string;
    parent_category?: {
      ordinal?: number;
    };
  };
}

interface Category {
  id: string;
  name: string;
  parentCategoryId?: string;
}

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

// POST /api/square/categories/batch
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { categoryIds } = body;

    if (!categoryIds || !Array.isArray(categoryIds) || categoryIds.length === 0) {
      return NextResponse.json({ error: 'Category IDs array is required' }, { status: 400 });
    }

    if (categoryIds.length > 1000) {
      return NextResponse.json({ error: 'Too many category IDs. Maximum is 1000.' }, { status: 400 });
    }

    console.log(`Batch retrieving ${categoryIds.length} categories from Square API`);

    const data: BatchRetrieveResponse = await fetchSquareAPI('/v2/catalog/batch-retrieve', {
      method: 'POST',
      body: JSON.stringify({
        object_ids: categoryIds,
        include_related_objects: false
      }),
    });

    if (!data || !data.objects) {
      return NextResponse.json({ categories: [], errors: data?.errors || [] });
    }

    // Transform Square catalog categories to our category format
    const categories: Category[] = data.objects
      .filter((item: SquareCatalogCategory) => item.type === 'CATEGORY')
      .map((item: SquareCatalogCategory): Category => ({
        id: item.id,
        name: item.category_data?.name || 'Unnamed Category',
        parentCategoryId: item.category_data?.parent_category?.ordinal ? 
          item.category_data.parent_category.ordinal.toString() : undefined,
      }));

    console.log(`Successfully retrieved ${categories.length} categories out of ${categoryIds.length} requested`);

    // Create a map for quick lookup of which IDs were not found
    const foundIds = new Set(categories.map(category => category.id));
    const notFoundIds = categoryIds.filter((id: string) => !foundIds.has(id));

    if (notFoundIds.length > 0) {
      console.warn(`Categories not found: ${notFoundIds.join(', ')}`);
    }

    return NextResponse.json({
      categories,
      total: categories.length,
      requested: categoryIds.length,
      notFound: notFoundIds,
      errors: data.errors || []
    });

  } catch (error) {
    console.error('Error in batch category retrieval:', error);
    return NextResponse.json({ error: 'Failed to retrieve categories' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Use POST method for batch category retrieval' }, { status: 405 });
}