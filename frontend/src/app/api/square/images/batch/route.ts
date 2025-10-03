import { NextRequest, NextResponse } from 'next/server';

const SQUARE_BASE_URL = process.env.SQUARE_ENVIRONMENT === 'production' 
  ? 'https://connect.squareup.com' 
  : 'https://connect.squareupsandbox.com';

const SQUARE_ACCESS_TOKEN = process.env.SQUARE_ACCESS_TOKEN;
const SQUARE_VERSION = '2025-01-09';

interface BatchRetrieveResponse {
  objects?: SquareCatalogImage[];
  errors?: Array<{ code?: string; detail?: string; category?: string }>;
}

interface SquareCatalogImage {
  id: string;
  type: string;
  image_data?: {
    name?: string;
    url?: string;
    caption?: string;
  };
}

interface ImageResult {
  id: string;
  imageUrl: string | null;
  name?: string;
  caption?: string;
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

// POST /api/square/images/batch
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageIds } = body;

    if (!imageIds || !Array.isArray(imageIds) || imageIds.length === 0) {
      return NextResponse.json({ error: 'Image IDs array is required' }, { status: 400 });
    }

    if (imageIds.length > 1000) {
      return NextResponse.json({ error: 'Too many image IDs. Maximum is 1000.' }, { status: 400 });
    }

    console.log(`Batch retrieving ${imageIds.length} images from Square API`);

    const data: BatchRetrieveResponse = await fetchSquareAPI('/v2/catalog/batch-retrieve', {
      method: 'POST',
      body: JSON.stringify({
        object_ids: imageIds,
        include_related_objects: false
      }),
    });

    if (!data || !data.objects) {
      return NextResponse.json({ images: [], errors: data?.errors || [] });
    }

    // Transform Square catalog images to our image format
    const images: ImageResult[] = data.objects
      .filter((item: SquareCatalogImage) => item.type === 'IMAGE')
      .map((item: SquareCatalogImage): ImageResult => ({
        id: item.id,
        imageUrl: item.image_data?.url || null,
        name: item.image_data?.name,
        caption: item.image_data?.caption,
      }));

    console.log(`Successfully retrieved ${images.length} images out of ${imageIds.length} requested`);

    // Create a map for quick lookup of which IDs were not found
    const foundIds = new Set(images.map(image => image.id));
    const notFoundIds = imageIds.filter((id: string) => !foundIds.has(id));

    if (notFoundIds.length > 0) {
      console.warn(`Images not found: ${notFoundIds.join(', ')}`);
    }

    return NextResponse.json({
      images,
      total: images.length,
      requested: imageIds.length,
      notFound: notFoundIds,
      errors: data.errors || []
    });

  } catch (error) {
    console.error('Error in batch image retrieval:', error);
    return NextResponse.json({ error: 'Failed to retrieve images' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Use POST method for batch image retrieval' }, { status: 405 });
}