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

async function getImage(id) {
  try {
    const response = await fetch(`${SQUARE_BASE_URL}/v2/catalog/object/${id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.SQUARE_ACCESS_TOKEN}`,
        'Square-Version': '2025-01-09',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return null;
    }

    const imageData = await response.json();
    return imageData.object?.image_data?.url || null;

  } catch (error) {
    console.error('Error fetching image from Square:', error);
    return null;
  }
}


async function getBooksByCategory(categoryId) {
  try {
    const response = await fetch(`${SQUARE_BASE_URL}/v2/catalog/search-catalog-items`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SQUARE_ACCESS_TOKEN}`,
        'Square-Version': '2025-01-09',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        category_ids: [categoryId],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Square API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    if (!data.items) return [];

    const books = await Promise.all(
      data.items.map(async (item) => {
        const itemData = item.item_data;
        const variation = itemData.variations?.[0];
        const price = variation?.item_variation_data?.price_money;

        // 🔥 fetch the actual image URL
        let imageUrl = null;
        if (itemData.image_ids?.[0]) {
          imageUrl = await getImage(itemData.image_ids[0]);
        }

        return {
          id: item.id,
          name: itemData.name || 'Untitled Book',
          description: itemData.description || 'No description available',
          price: price ? Number(price.amount) / 100 : 0,
          currency: price?.currency || 'USD',
          imageUrl,
        };
      })
    );

    return books;
  } catch (error) {
    console.error('Error fetching books by Category ID from Square:', error);
    return null;
  }
}

/**
 * Pick up to `limit` books, prioritizing those with images.
 */
function buildCarouselBooks(books, limit = 20) {
  const withImages = books.filter((b) => b.imageUrl);
  const withoutImages = books.filter((b) => !b.imageUrl);

  if (withImages.length >= limit) {
    return withImages.slice(0, limit);
  }

  return [
    ...withImages,
    ...withoutImages.slice(0, limit - withImages.length),
  ];
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

