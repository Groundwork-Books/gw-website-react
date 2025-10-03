import { NextRequest, NextResponse } from 'next/server';

const SQUARE_BASE_URL = process.env.SQUARE_ENVIRONMENT === 'production' 
  ? 'https://connect.squareup.com' 
  : 'https://connect.squareupsandbox.com';

const SQUARE_ACCESS_TOKEN = process.env.SQUARE_ACCESS_TOKEN;
const SQUARE_VERSION = '2025-01-09';

interface BatchRetrieveResponse {
  objects?: SquareCatalogItem[];
  errors?: Array<{ code?: string; detail?: string; category?: string }>;
}

interface SquareCatalogItem {
  id: string;
  type: string;
  item_data?: {
    name?: string;
    description?: string;
    variations?: Array<{
      item_variation_data?: {
        price_money?: {
          amount?: number;
          currency?: string;
        };
      };
    }>;
    image_ids?: string[];
  };
}

interface Book {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  imageId?: string;
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

// POST /api/square/books/batch
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookIds } = body;

    if (!bookIds || !Array.isArray(bookIds) || bookIds.length === 0) {
      return NextResponse.json({ error: 'Book IDs array is required' }, { status: 400 });
    }

    if (bookIds.length > 1000) {
      return NextResponse.json({ error: 'Too many book IDs. Maximum is 1000.' }, { status: 400 });
    }

    console.log(`Batch retrieving ${bookIds.length} books from Square API`);

    const data: BatchRetrieveResponse = await fetchSquareAPI('/v2/catalog/batch-retrieve', {
      method: 'POST',
      body: JSON.stringify({
        object_ids: bookIds,
        include_related_objects: false
      }),
    });

    if (!data || !data.objects) {
      return NextResponse.json({ books: [], errors: data?.errors || [] });
    }

    // Transform Square catalog items to our book format
    const books: Book[] = data.objects
      .filter((item: SquareCatalogItem) => item.type === 'ITEM')
      .map((item: SquareCatalogItem): Book => {
        const itemData = item.item_data;
        const variation = itemData?.variations?.[0];
        const price = variation?.item_variation_data?.price_money;

        return {
          id: item.id,
          name: itemData?.name || 'Untitled Book',
          description: itemData?.description || 'No description available',
          price: price ? Number(price.amount) / 100 : 0,
          currency: price?.currency || 'USD',
          imageId: itemData?.image_ids?.[0] || undefined,
        };
      });

    console.log(`Successfully retrieved ${books.length} books out of ${bookIds.length} requested`);

    // Create a map for quick lookup of which IDs were not found
    const foundIds = new Set(books.map(book => book.id));
    const notFoundIds = bookIds.filter((id: string) => !foundIds.has(id));

    if (notFoundIds.length > 0) {
      console.warn(`Books not found: ${notFoundIds.join(', ')}`);
    }

    return NextResponse.json({
      books,
      total: books.length,
      requested: bookIds.length,
      notFound: notFoundIds,
      errors: data.errors || []
    });

  } catch (error) {
    console.error('Error in batch book retrieval:', error);
    return NextResponse.json({ error: 'Failed to retrieve books' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Use POST method for batch book retrieval' }, { status: 405 });
}