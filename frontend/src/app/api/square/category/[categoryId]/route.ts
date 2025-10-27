import { NextRequest, NextResponse } from 'next/server';
import { getCachedCategoryBooks, setCachedCategoryBooks } from '@/lib/redis';

// Square item types for this route
interface SquareMoneyAmount {
  amount?: number;
  currency?: string;
}

interface SquareItemVariationData {
  price_money?: SquareMoneyAmount;
  item_id?: string;
  track_inventory?: boolean;
}

interface SquareItemVariation {
  id: string;
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

interface ProcessedBook {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  categoryId: string;
  imageId: string | null;
  imageUrl?: string | null;
  squareItemId?: string;
  squareVariationId?: string;
  inventoryTracked?: boolean;
}

interface SearchCatalogItemsRequest {
  category_ids: string[];
  limit?: number;
}

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
        // Rate limited - wait and retry with exponential backoff (match backend pattern)
        const delay = RETRY_DELAY_MS * Math.pow(2, attempt);
        console.warn(`Square API rate limited, retrying in ${delay}ms... (attempt ${attempt + 1})`);
        if (attempt < MAX_RETRIES) {
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        // If we've exhausted retries, return null instead of throwing
        console.error(`Square API rate limit exceeded after ${MAX_RETRIES + 1} attempts`);
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
      console.warn(`Square API error, retrying in ${delay}ms... (attempt ${attempt + 1}):`, error);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  return null;
}

// GET /api/square/category/[categoryId]?limit=20
// Note: This route no longer loads images by default. Images should be loaded separately via batch API.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  try {
    const { categoryId } = await params;
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
    
    if (!categoryId) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 });
    }

    // Try to get books from Redis cache first
    const cachedBooks = await getCachedCategoryBooks(categoryId);
    if (cachedBooks) {
      console.log(`Returning cached books for category ${categoryId} (limit: ${limit || 'none'})`);
      
      // Apply limit filtering if requested and not already applied in cache
      if (limit && cachedBooks.books.length > limit) {
        const limitedBooks = cachedBooks.books.slice(0, limit);
        return NextResponse.json({
          books: limitedBooks,
          metadata: {
            ...cachedBooks.metadata,
            totalBooks: limitedBooks.length
          }
        });
      }
      
      return NextResponse.json(cachedBooks);
    }

    console.log(`Cache miss - fetching books for category ${categoryId} from Square API`);
    const requestBody: SearchCatalogItemsRequest = { category_ids: [categoryId] };
    
    // Note: We don't apply limit in the API request - we cache all books and apply limit on retrieval
    // This allows us to serve different limits from the same cache

    const data = await fetchSquareAPI('/v2/catalog/search-catalog-items', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    if (!data?.items) {
      const emptyResult = { 
        books: [], 
        metadata: { totalBooks: 0, imagesLoaded: 0, booksWithImageIds: 0 } 
      };
      // Cache empty results for a shorter time
      await setCachedCategoryBooks(categoryId, emptyResult);
      return NextResponse.json(emptyResult);
    }

    const books: ProcessedBook[] = data.items.map((item: SquareCatalogItem): ProcessedBook => {
      const itemData = item.item_data;
      const variation = itemData?.variations?.[0];
      const price = variation?.item_variation_data?.price_money;
      const vdata = variation?.item_variation_data;

      return {
        id: item.id,
        name: itemData?.name || 'Unnamed Book',
        description: itemData?.description || 'No description available',
        price: price ? Number(price.amount) / 100 : 0,
        currency: price?.currency || 'USD',
        categoryId: categoryId,
        imageId: itemData?.image_ids?.[0] || null, // Use correct image ID from image_ids array
        imageUrl: null, // Will be loaded in priority batches if needed
        squareItemId: item.id,
        squareVariationId: variation?.id,
        inventoryTracked: vdata?.track_inventory ?? false,
      };
    });

    // Sort books to put those with imageIds first (for better UX even without images loaded)
    const booksWithImages = books.filter((book: ProcessedBook) => book.imageId);
    const booksWithoutImages = books.filter((book: ProcessedBook) => !book.imageId);
    const sortedBooks = [...booksWithImages, ...booksWithoutImages];

    const result = { 
      books: sortedBooks, 
      metadata: { 
        totalBooks: sortedBooks.length, 
        imagesLoaded: 0,
        booksWithImageIds: booksWithImages.length 
      } 
    };

    // Cache the result (all books for this category)
    await setCachedCategoryBooks(categoryId, result);
    console.log(`Cached ${sortedBooks.length} books for category ${categoryId}`);

    // Apply limit filtering if requested
    if (limit && sortedBooks.length > limit) {
      const limitedBooks = sortedBooks.slice(0, limit);
      return NextResponse.json({
        books: limitedBooks,
        metadata: {
          ...result.metadata,
          totalBooks: limitedBooks.length
        }
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error(`Error fetching books for category:`, error);
    return NextResponse.json({ error: 'Failed to fetch books' }, { status: 500 });
  }
}