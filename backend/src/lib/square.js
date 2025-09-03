const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch'); // if not already imported

const SQUARE_BASE_URL = process.env.SQUARE_ENVIRONMENT === 'production' 
  ? 'https://connect.squareup.com' 
  : 'https://connect.squareupsandbox.com';

const CACHE_DIR = path.resolve(__dirname, 'cache');
if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR);

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 500; // initial retry delay in ms
const BATCH_SIZE = 5; // number of images to fetch at once
const CACHE_EXPIRATION_DAYS = 5; // how long cache is valid in days


// ---------------- Cache Utilities ----------------

function getCacheFile(categoryId) {
  return path.join(CACHE_DIR, `${categoryId}.json`);
}

function readCache(categoryId, maxAgeDays = CACHE_EXPIRATION_DAYS) {
  const file = getCacheFile(categoryId);
  if (!fs.existsSync(file)) return null;

  const stats = fs.statSync(file);
  const ageDays = (Date.now() - stats.mtimeMs) / 1000 / 60 / 60 / 24;
  if (ageDays > maxAgeDays) return null;

  try {
    return JSON.parse(fs.readFileSync(file, 'utf-8'));
  } catch {
    return null;
  }
}

function writeCache(categoryId, data) {
  const file = getCacheFile(categoryId);
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// ---------------- Fetch Utilities ----------------

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(url, options = {}, retries = MAX_RETRIES) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, options);
      if (response.status === 429) {
        const delay = RETRY_DELAY_MS * Math.pow(2, attempt);
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

// ---------------- Image Caching ----------------

const IMAGE_CACHE_FILE = path.join(CACHE_DIR, 'images.json');
let imageCache = fs.existsSync(IMAGE_CACHE_FILE)
  ? JSON.parse(fs.readFileSync(IMAGE_CACHE_FILE))
  : {};

async function getImageCached(id) {
  if (!id) return null;
  if (imageCache[id]) return imageCache[id];

  const data = await fetchWithRetry(`${SQUARE_BASE_URL}/v2/catalog/object/${id}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${process.env.SQUARE_ACCESS_TOKEN}`,
      'Square-Version': '2025-01-09',
      'Content-Type': 'application/json',
    },
  });

  const url = data?.object?.image_data?.url || null;
  if (url) {
    imageCache[id] = url;
    fs.writeFileSync(IMAGE_CACHE_FILE, JSON.stringify(imageCache, null, 2));
  }

  return url;
}

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
            imageUrl = await getImageCached(itemData.image_ids[0]);
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

async function fetchCategoryBooksFromSquare(categoryId) {
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
      imageUrl: null,
    };
  });

  // Batch fetch images to avoid rate limits
  for (let i = 0; i < books.length; i += BATCH_SIZE) {
    const batch = books.slice(i, i + BATCH_SIZE);
    await Promise.all(batch.map(async (book) => {
      if (book.imageId) {
        book.imageUrl = await getImageCached(book.imageId);
      }
    }));
  }

  return books;
}

async function getBooksByCategory(categoryId, useCache = true) {
  if (useCache) {
    const cached = readCache(categoryId);
    if (cached) {
      console.log(`Loaded category ${categoryId} from cache`);
      return cached;
    }
  }

  const books = await fetchCategoryBooksFromSquare(categoryId);
  writeCache(categoryId, books);

  return books;
}

// ---------------- Carousel Builder ----------------

function buildCarouselBooks(books, limit = 20) {
  const withImages = books.filter((b) => b.imageUrl);
  const withoutImages = books.filter((b) => !b.imageUrl);

  if (withImages.length >= limit) return withImages.slice(0, limit);

  return [...withImages, ...withoutImages.slice(0, limit - withImages.length)];
}

async function getCarouselBooksByCategory(categoryId, limit = 20) {
  const allBooks = await getBooksByCategory(categoryId);
  return buildCarouselBooks(allBooks, limit);
}

module.exports = {
  getBooks,
  getBooksByCategory,
  getCarouselBooksByCategory,
};