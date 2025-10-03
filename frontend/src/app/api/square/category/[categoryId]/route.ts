import { NextRequest, NextResponse } from 'next/server';

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

// GET /api/square/category/[categoryId]?includeImages=false&limit=20&priorityCount=10
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  try {
    const { categoryId } = await params;
    const { searchParams } = new URL(request.url);
    const includeImages = searchParams.get('includeImages') === 'true';
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
    const priorityCount = searchParams.get('priorityCount') ? parseInt(searchParams.get('priorityCount')!) : 10;
    
    if (!categoryId) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 });
    }

    const requestBody: SearchCatalogItemsRequest = { category_ids: [categoryId] };
    
    if (limit && limit > 0) {
      requestBody.limit = limit;
    }

    const data = await fetchSquareAPI('/v2/catalog/search-catalog-items', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    if (!data?.items) {
      return NextResponse.json([]);
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
        imageId: itemData?.image_ids?.[0] || null, // Use correct image ID from image_ids array
        imageUrl: null // Will be loaded in priority batches if needed
      };
    });

    // If images are requested, load them using batch API
    if (includeImages && books.length > 0) {
      const booksWithImageIds = books.filter((book: ProcessedBook) => book.imageId);
      
      // Load images for the requested number of books
      const booksToLoad = booksWithImageIds.slice(0, Math.min(priorityCount, booksWithImageIds.length));
      
      // Load images using batch image API
      if (booksToLoad.length > 0) {
        
        try {
          const imageIds = booksToLoad.map(book => book.imageId).filter(Boolean) as string[];
          
          // Use our batch image API route
          const imageResponse = await fetch(`${request.nextUrl.origin}/api/square/images/batch`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ imageIds }),
          });

          if (imageResponse.ok) {
            const imageData = await imageResponse.json();
            const imageMap: Record<string, string> = {};
            
            imageData.images.forEach((image: { id: string; imageUrl?: string }) => {
              if (image.imageUrl) {
                imageMap[image.id] = image.imageUrl;
              }
            });

            // Apply the image URLs to books
            booksToLoad.forEach(book => {
              if (book.imageId && imageMap[book.imageId]) {
                book.imageUrl = imageMap[book.imageId];
              }
            });
          } else {
            console.error(`Batch image API failed with status ${imageResponse.status}`);
          }
        } catch (error) {
          console.error('Batch image loading failed:', error);
        }
      }
      
      // Return books with loaded images
      const totalImagesLoaded = books.filter((book: ProcessedBook) => book.imageUrl).length;
      
      const response = {
        books,
        metadata: {
          totalBooks: books.length,
          imagesLoaded: totalImagesLoaded
        }
      };
      
      return NextResponse.json(response);
    }

    return NextResponse.json({ books, metadata: { totalBooks: books.length, imagesLoaded: 0 } });
  } catch (error) {
    console.error(`Error fetching books for category:`, error);
    return NextResponse.json({ error: 'Failed to fetch books' }, { status: 500 });
  }
}