const SQUARE_BASE_URL = process.env.SQUARE_ENVIRONMENT === 'production' 
  ? 'https://connect.squareup.com' 
  : 'https://connect.squareupsandbox.com';

async function getBooks() {
  try {
    const response = await fetch(`${SQUARE_BASE_URL}/v2/catalog/list?types=ITEM`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.SQUARE_ACCESS_TOKEN}`,
        'Square-Version': '2025-01-09',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Square API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    if (!data.objects) return [];

    const books = await Promise.all(
      data.objects
        .filter((obj) => obj.type === 'ITEM' && obj.item_data)
        .map(async (item) => {
          const itemData = item.item_data;
          const variation = itemData.variations?.[0];
          const price = variation?.item_variation_data?.price_money;

          // fetch the actual image URL
          let imageUrl = null;
          if (itemData.image_ids?.[0]) {
            imageUrl = await getImage(itemData.image_ids[0]);
          }

          return {
            id: item.id,
            name: itemData.name || 'Untitled Book',
            description: itemData.description,
            price: price ? Number(price.amount) / 100 : 0,
            currency: price?.currency || 'USD',
            imageUrl,
          };
        })
    );

    return books;
  } catch (error) {
    console.error('Error fetching books from Square:', error);
    throw new Error('Failed to fetch books');
  }
}

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 500; // initial delay for retries

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(url, options = {}, retries = MAX_RETRIES) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, options);
      if (response.status === 429) {
        // Rate limit hit
        const delay = RETRY_DELAY_MS * Math.pow(2, attempt); // exponential backoff
        console.warn(`Rate limited. Retrying in ${delay}ms...`);
        await sleep(delay);
        continue;
      }
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Square API error: ${response.status} - ${errorText}`);
      }
      return await response.json();
    } catch (error) {
      if (attempt === retries) {
        console.error('Max retries reached:', error);
        return null;
      }
      const delay = RETRY_DELAY_MS * Math.pow(2, attempt);
      console.warn(`Fetch failed, retrying in ${delay}ms...`);
      await sleep(delay);
    }
  }
  return null;
}

async function getImage(id) {
  const data = await fetchWithRetry(`${SQUARE_BASE_URL}/v2/catalog/object/${id}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${process.env.SQUARE_ACCESS_TOKEN}`,
      'Square-Version': '2025-01-09',
      'Content-Type': 'application/json',
    },
  });

  return data?.object?.image_data?.url || null;
}

/**
 * Fetch books by category with batched image loading.
 */
async function getBooksByCategory(categoryId) {
  const data = await fetchWithRetry(`${SQUARE_BASE_URL}/v2/catalog/search-catalog-items`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.SQUARE_ACCESS_TOKEN}`,
      'Square-Version': '2025-01-09',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ category_ids: [categoryId] }),
  });

  if (!data?.items) return [];

  // Create base book objects
  const books = data.items.map((item) => {
    const itemData = item.item_data;
    const variation = itemData.variations?.[0];
    const price = variation?.item_variation_data?.price_money;

    return {
      id: item.id,
      name: itemData.name || 'Untitled Book',
      description: itemData.description || 'No description available',
      price: price ? Number(price.amount) / 100 : 0,
      currency: price?.currency || 'USD',
      imageId: itemData.image_ids?.[0] || null,
      imageUrl: null, // to be filled in batches
    };
  });

  // Load images in batches to avoid rate limits
  const BATCH_SIZE = 5;
  for (let i = 0; i < books.length; i += BATCH_SIZE) {
    const batch = books.slice(i, i + BATCH_SIZE);
    await Promise.all(batch.map(async (book) => {
      if (book.imageId) {
        book.imageUrl = await getImage(book.imageId);
      }
    }));
  }

  return books;
}

/**
 * Pick up to `limit` books, prioritizing those with images.
 */
function buildCarouselBooks(books, limit = 20) {
  const withImages = books.filter((b) => b.imageUrl);
  const withoutImages = books.filter((b) => !b.imageUrl);

  if (withImages.length >= limit) return withImages.slice(0, limit);

  return [...withImages, ...withoutImages.slice(0, limit - withImages.length)];
}

/**
 * Main: fetch category books and return the carousel set.
 */
async function getCarouselBooksByCategory(categoryId, limit = 20) {
  const allBooks = await getBooksByCategory(categoryId);
  return buildCarouselBooks(allBooks, limit);
}

module.exports = {
  getBooks,
  getBooksByCategory,
  getCarouselBooksByCategory,
};
