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

interface ProcessedBook {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  categoryId: string;
  imageId: string | null;
  imageUrl?: string | null;
}

interface BatchCategoryRequest {
  categoryIds: string[];
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

// POST /api/square/categories/books - Ultra-fast batch load books for multiple categories
export async function POST(request: NextRequest) {
  try {
    const body: BatchCategoryRequest = await request.json();
    const { categoryIds, limit = 20 } = body;

    if (!categoryIds || !Array.isArray(categoryIds) || categoryIds.length === 0) {
      return NextResponse.json({ error: 'Category IDs array is required' }, { status: 400 });
    }

    if (categoryIds.length > 50) {
      return NextResponse.json({ error: 'Too many category IDs. Maximum is 50.' }, { status: 400 });
    }

    console.log(`Ultra-fast batch loading books for ${categoryIds.length} categories with limit ${limit}`);
    const startTime = Date.now();

    // Check cache for each category first
    const cachedResults: Record<string, { books: ProcessedBook[], metadata?: { totalBooks: number; booksWithImageIds: number } }> = {};
    const uncachedCategoryIds: string[] = [];
    
    for (const categoryId of categoryIds) {
      const cached = await getCachedCategoryBooks(categoryId);
      if (cached) {
        // Apply limit filtering to cached results
        const allBooks = cached.books as ProcessedBook[];
        const limitedBooks = limit ? allBooks.slice(0, limit) : allBooks;
        
        cachedResults[categoryId] = {
          books: limitedBooks,
          metadata: {
            totalBooks: limitedBooks.length,
            booksWithImageIds: limitedBooks.filter(book => book.imageId).length
          }
        };
      } else {
        uncachedCategoryIds.push(categoryId);
      }
    }

    console.log(`Cache hits: ${Object.keys(cachedResults).length}, Cache misses: ${uncachedCategoryIds.length}`);

    // Make API requests only for uncached categories
    const categoryPromises = uncachedCategoryIds.map(async (categoryId: string) => {
      try {
        const data = await fetchSquareAPI('/v2/catalog/search-catalog-items', {
          method: 'POST',
          body: JSON.stringify({
            category_ids: [categoryId]
            // Note: No limit in API request - we cache all books and apply limit on retrieval
          }),
        });

        if (!data?.items) {
          const emptyResult = { 
            categoryId, 
            books: [],
            metadata: {
              totalBooks: 0,
              booksWithImageIds: 0
            }
          };
          // Cache empty results
          await setCachedCategoryBooks(categoryId, { 
            books: [], 
            metadata: { totalBooks: 0, booksWithImageIds: 0 } 
          });
          return emptyResult;
        }

        const books: ProcessedBook[] = data.items.map((item: SquareCatalogItem): ProcessedBook => {
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
            imageUrl: null // Will be loaded separately
          };
        });

        // Sort books to put those with imageIds first (even without images loaded)
        const booksWithImages = books.filter((book: ProcessedBook) => book.imageId);
        const booksWithoutImages = books.filter((book: ProcessedBook) => !book.imageId);
        const sortedBooks = [...booksWithImages, ...booksWithoutImages];

        // Cache all books for this category (no limit applied to cache)
        const cacheData = { 
          books: sortedBooks, 
          metadata: { 
            totalBooks: sortedBooks.length, 
            booksWithImageIds: booksWithImages.length 
          } 
        };
        await setCachedCategoryBooks(categoryId, cacheData);

        // Apply limit for response
        const limitedBooks = limit ? sortedBooks.slice(0, limit) : sortedBooks;
        
        const result = { 
          categoryId, 
          books: limitedBooks,
          metadata: {
            totalBooks: limitedBooks.length,
            booksWithImageIds: limitedBooks.filter(book => book.imageId).length
          }
        };

        return result;
      } catch (error) {
        console.error(`Error fetching books for category ${categoryId}:`, error);
        return { 
          categoryId, 
          books: [],
          metadata: {
            totalBooks: 0,
            booksWithImageIds: 0
          }
        };
      }
    });

    // Wait for uncached categories to complete
    const apiResults = await Promise.all(categoryPromises);

    // Combine cached and API results
    const allResults = [
      ...Object.entries(cachedResults).map(([categoryId, cached]) => ({
        categoryId,
        books: cached.books || [],
        metadata: {
          totalBooks: cached.metadata?.totalBooks || 0,
          booksWithImageIds: cached.metadata?.booksWithImageIds || 0
        }
      })),
      ...apiResults
    ];

    // Transform to expected format
    const categoriesData: Record<string, { books: ProcessedBook[]; metadata: { totalBooks: number; booksWithImageIds: number } }> = {};
    allResults.forEach(({ categoryId, books, metadata }) => {
      categoriesData[categoryId] = {
        books,
        metadata: metadata || { totalBooks: 0, booksWithImageIds: 0 }
      };
    });

    const totalTime = Date.now() - startTime;
    const totalBooks = allResults.reduce((sum, result) => sum + result.books.length, 0);
    const totalBooksWithImages = allResults.reduce((sum, result) => sum + (result.metadata?.booksWithImageIds || 0), 0);
    
    console.log(`Ultra-fast batch loading complete: ${totalBooks} books (${totalBooksWithImages} with images) across ${categoryIds.length} categories in ${totalTime}ms (${Object.keys(cachedResults).length} from cache)`);

    return NextResponse.json({
      categories: categoriesData,
      summary: {
        categoriesLoaded: allResults.length,
        totalBooks,
        totalBooksWithImages,
        loadTime: totalTime
      }
    });

  } catch (error) {
    console.error('Error in ultra-fast batch category loading:', error);
    return NextResponse.json({ error: 'Failed to load categories' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Use POST method for ultra-fast batch category loading' }, { status: 405 });
}