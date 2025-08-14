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
    
    if (!data.objects) {
      return [];
    }

    const books = data.objects
      .filter((obj) => obj.type === 'ITEM' && obj.item_data)
      .map((item) => {
        const itemData = item.item_data;
        const variation = itemData.variations?.[0];
        const price = variation?.item_variation_data?.price_money;
        
        return {
          id: item.id,
          name: itemData.name || 'Untitled Book',
          description: itemData.description,
          price: price ? Number(price.amount) / 100 : 0,
          currency: price?.currency || 'USD',
          imageUrl: itemData.image_ids?.[0],
        };
      });

    return books;
  } catch (error) {
    console.error('Error fetching books from Square:', error);
    throw new Error('Failed to fetch books');
  }
}

async function getBookById(id) {
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

    const data = await response.json();
    
    if (!data.object || data.object.type !== 'ITEM') {
      return null;
    }

    const item = data.object;
    const itemData = item.item_data;
    const variation = itemData.variations?.[0];
    const price = variation?.item_variation_data?.price_money;
    
    return {
      id: item.id,
      name: itemData.name || 'Untitled Book',
      description: itemData.description,
      price: price ? Number(price.amount) / 100 : 0,
      currency: price?.currency || 'USD',
      imageUrl: itemData.image_ids?.[0],
    };
  } catch (error) {
    console.error('Error fetching book by ID from Square:', error);
    return null;
  }
}

module.exports = {
  getBooks,
  getBookById
};