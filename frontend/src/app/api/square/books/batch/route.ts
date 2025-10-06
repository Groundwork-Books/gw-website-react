import { NextRequest, NextResponse } from 'next/server';
import { getCachedBooksData, setCachedBooksData } from '@/lib/redis';

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

    console.log(`Batch retrieving ${bookIds.length} books - checking cache first`);

    // Check cache for each book individually
    const cachedBooks: Record<string, Book> = {};
    const uncachedBookIds: string[] = [];
    
    await Promise.all(
      bookIds.map(async (bookId: string) => {
        try {
          const cachedBook = await getCachedBooksData(bookId);
          if (cachedBook) {
            cachedBooks[bookId] = cachedBook as Book;
          } else {
            uncachedBookIds.push(bookId);
          }
        } catch (error) {
          console.warn(`Cache check failed for book ${bookId}:`, error);
          uncachedBookIds.push(bookId);
        }
      })
    );
    
    console.log(`Cache hits: ${Object.keys(cachedBooks).length}, Cache misses: ${uncachedBookIds.length}`);

    let freshBooks: Book[] = [];
    const errors: Array<{ code?: string; detail?: string; category?: string }> = [];

    // Only fetch uncached books from Square API
    if (uncachedBookIds.length > 0) {
      console.log(`Fetching ${uncachedBookIds.length} uncached books from Square API`);
      
      const data: BatchRetrieveResponse = await fetchSquareAPI('/v2/catalog/batch-retrieve', {
        method: 'POST',
        body: JSON.stringify({
          object_ids: uncachedBookIds,
          include_related_objects: false
        }),
      });

      if (data?.errors) {
        errors.push(...data.errors);
      }

      if (data?.objects) {
        // Transform Square catalog items to our book format
        freshBooks = data.objects
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

        // Cache the freshly fetched books individually
        await Promise.all(
          freshBooks.map(async (book) => {
            try {
              await setCachedBooksData(book.id, book);
            } catch (error) {
              console.warn(`Failed to cache book ${book.id}:`, error);
            }
          })
        );
        console.log(`Cached ${freshBooks.length} newly fetched books`);
      }
    }

    // Combine cached and fresh books
    const allBooks: Book[] = [
      ...Object.values(cachedBooks),
      ...freshBooks
    ];

    console.log(`Successfully retrieved ${allBooks.length} books out of ${bookIds.length} requested (${Object.keys(cachedBooks).length} from cache, ${freshBooks.length} from API)`);

    // Create a map for quick lookup of which IDs were not found
    const foundIds = new Set(allBooks.map(book => book.id));
    const notFoundIds = bookIds.filter((id: string) => !foundIds.has(id));

    if (notFoundIds.length > 0) {
      console.warn(`Books not found: ${notFoundIds.join(', ')}`);
    }

    return NextResponse.json({
      books: allBooks,
      total: allBooks.length,
      requested: bookIds.length,
      cached: Object.keys(cachedBooks).length,
      fetched: freshBooks.length,
      notFound: notFoundIds,
      errors: errors
    });

  } catch (error) {
    console.error('Error in batch book retrieval:', error);
    return NextResponse.json({ error: 'Failed to retrieve books' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Use POST method for batch book retrieval' }, { status: 405 });
}