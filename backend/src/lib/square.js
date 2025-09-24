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
  const startTime = Date.now();
  const file = getCacheFile(categoryId);
  if (!fs.existsSync(file)) {
    console.log(`Cache MISS: ${categoryId} (file doesn't exist) - ${Date.now() - startTime}ms`);
    return null;
  }

  const stats = fs.statSync(file);
  const ageDays = (Date.now() - stats.mtimeMs) / 1000 / 60 / 60 / 24;
  if (ageDays > maxAgeDays) {
    console.log(`Cache MISS: ${categoryId} (expired, ${ageDays.toFixed(1)} days old) - ${Date.now() - startTime}ms`);
    return null;
  }

  try {
    const result = JSON.parse(fs.readFileSync(file, 'utf-8'));
    const totalTime = Date.now() - startTime;
    console.log(`Cache HIT: ${categoryId} (${result.length} items, ${(fs.statSync(file).size / 1024).toFixed(1)}KB) - ${totalTime}ms`);
    return result;
  } catch {
    console.log(`Cache MISS: ${categoryId} (parse error) - ${Date.now() - startTime}ms`);
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
  const startTime = Date.now();
  const urlPath = url.replace(SQUARE_BASE_URL, ''); // Remove base URL for cleaner logs
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    const attemptStart = Date.now();
    try {
      const response = await fetch(url, options);
      const fetchTime = Date.now() - attemptStart;
      
      if (response.status === 429) {
        const delay = RETRY_DELAY_MS * Math.pow(2, attempt);
        console.warn(`Rate limited on ${urlPath}. Retrying in ${delay}ms... (attempt ${attempt + 1})`);
        await sleep(delay);
        continue;
      }
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Square API error: ${response.status} - ${errorText}`);
      }
      
      const parseStart = Date.now();
      const result = await response.json();
      const parseTime = Date.now() - parseStart;
      const totalTime = Date.now() - startTime;
      
      console.log(`Square API: ${urlPath} | Fetch: ${fetchTime}ms | Parse: ${parseTime}ms | Total: ${totalTime}ms ${attempt > 0 ? `(${attempt + 1} attempts)` : ''}`);
      return result;
    } catch (error) {
      const fetchTime = Date.now() - attemptStart;
      if (attempt === retries) {
        const totalTime = Date.now() - startTime;
        console.error(`Square API: ${urlPath} | Failed after ${totalTime}ms (${attempt + 1} attempts) | Last attempt: ${fetchTime}ms`);
        return null;
      }
      const delay = RETRY_DELAY_MS * Math.pow(2, attempt);
      console.warn(`Fetch failed on ${urlPath}, retrying in ${delay}ms... (attempt ${attempt + 1}, took ${fetchTime}ms)`);
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
  
  const startTime = Date.now();
  
  // Check in-memory cache first
  if (imageCache[id]) {
    console.log(`Image cache HIT: ${id} (memory) - ${Date.now() - startTime}ms`);
    return imageCache[id];
  }

  console.log(`Image cache MISS: ${id} - fetching from Square API`);
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
    const writeStart = Date.now();
    imageCache[id] = url;
    fs.writeFileSync(IMAGE_CACHE_FILE, JSON.stringify(imageCache, null, 2));
    const writeTime = Date.now() - writeStart;
    console.log(`Image cached: ${id} (disk write: ${writeTime}ms)`);
  }

  const totalTime = Date.now() - startTime;
  console.log(`Image fetch complete: ${id} - ${totalTime}ms total`);
  return url;
}

async function getBookById(bookId) {

  try {
    const data = await fetchWithRetry(`${SQUARE_BASE_URL}/v2/catalog/object/${bookId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.SQUARE_ACCESS_TOKEN}`,
        'Square-Version': '2025-01-09',
        'Content-Type': 'application/json',
      },
    });

    if (!data?.object || data.object.type !== 'ITEM') {
      console.log(`Book ${bookId} not found or not an ITEM`);
      return null;
    }

    const item = data.object;
    const itemData = item.item_data;
    const variation = itemData.variations?.[0];
    const price = variation?.item_variation_data?.price_money;

    // Fetch image URL
    let imageUrl = null;
    if (itemData.image_ids?.[0]) {
      imageUrl = await getImageCached(itemData.image_ids[0]);
    }

    const book = {
      id: item.id,
      name: itemData.name || 'Untitled Book',
      description: itemData.description || 'No description available',
      price: price ? Number(price.amount) / 100 : 0,
      currency: price?.currency || 'USD',
      imageUrl,
    };

    return book;

  } catch (error) {
    console.error(`Error fetching book ${bookId} from Square:`, error);
    throw new Error(`Failed to fetch book ${bookId}`);
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
  if (books.length > 0) {
    const imageStart = Date.now();
    console.log(`Batch fetching images for ${books.length} books (batch size: ${BATCH_SIZE})`);
    
    for (let i = 0; i < books.length; i += BATCH_SIZE) {
      const batch = books.slice(i, i + BATCH_SIZE);
      const batchStart = Date.now();
      
      await Promise.all(batch.map(async (book) => {
        if (book.imageId) {
          book.imageUrl = await getImageCached(book.imageId);
        }
      }));
      
      const batchTime = Date.now() - batchStart;
      console.log(`Batch ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(books.length/BATCH_SIZE)} complete: ${batch.length} images in ${batchTime}ms`);
    }
    
    const totalImageTime = Date.now() - imageStart;
    const imagesWithUrls = books.filter(b => b.imageUrl).length;
    console.log(`All image fetching complete: ${imagesWithUrls}/${books.length} images loaded in ${totalImageTime}ms`);
  }

  return books;
}

async function getBooksByCategory(categoryId, useCache = true) {
  const startTime = Date.now();
  console.log(`Fetching books for category: ${categoryId} (useCache: ${useCache})`);
  
  if (useCache) {
    const cached = readCache(categoryId);
    if (cached) {
      console.log(`Category fetch complete: ${categoryId} - ${Date.now() - startTime}ms (from cache)`);
      return cached;
    }
  }

  console.log(`Cache miss - fetching category ${categoryId} from Square API`);
  const fetchStart = Date.now();
  const books = await fetchCategoryBooksFromSquare(categoryId);
  const fetchTime = Date.now() - fetchStart;
  
  const writeStart = Date.now();
  writeCache(categoryId, books);
  const writeTime = Date.now() - writeStart;
  
  const totalTime = Date.now() - startTime;
  console.log(`Category fetch complete: ${categoryId} - ${totalTime}ms total (fetch: ${fetchTime}ms, cache write: ${writeTime}ms, ${books.length} books)`);

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

// ---------------- Categories ----------------

async function getBooks() {
  // Fetch all items from Square catalog
  const data = await fetchWithRetry(`${SQUARE_BASE_URL}/v2/catalog/list?types=ITEM`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${process.env.SQUARE_ACCESS_TOKEN}`,
      'Square-Version': '2025-01-09',
      'Content-Type': 'application/json',
    },
  });

  if (!data?.objects) return [];

  // Filter for ITEM objects only
  const items = data.objects.filter(obj => obj.type === 'ITEM');

  const books = items.map((item) => {
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

async function getCategories() {
  const data = await fetchWithRetry(`${SQUARE_BASE_URL}/v2/catalog/list?types=CATEGORY`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${process.env.SQUARE_ACCESS_TOKEN}`,
      'Square-Version': '2025-01-09',
      'Content-Type': 'application/json',
    },
  });

  if (!data?.objects) return [];

  // Filter for category objects only and map to our format
  const categories = data.objects
    .filter(obj => obj.type === 'CATEGORY')
    .map(obj => ({
      id: obj.id,
      name: obj.category_data?.name || 'Unnamed Category'
    }))
    .sort((a, b) => a.name.localeCompare(b.name)); // Sort alphabetically

  return categories;
}

module.exports = {
  getBooks,
  getBookById,
  getBooksByCategory,
  getCarouselBooksByCategory,
  getCategories,
  getImage: getImageCached,
};