import { Book } from './types';

// Configuration
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 500; // Match backend delay

// Types
export interface Category {
  id: string;
  name: string;
}

export interface SearchOptions {
  limit?: number;
}

export interface CategoryResponse {
  books: Book[];
  metadata: {
    totalBooks: number;
    imagesLoaded: number;
    booksWithImageIds?: number;
  };
}

// Utility functions
async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry<T = unknown>(
  url: string, 
  options: RequestInit = {}, 
  retries = MAX_RETRIES
): Promise<T> {
  const startTime = Date.now();
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, options);
      
      if (response.status === 429) {
        const delay = RETRY_DELAY_MS * Math.pow(2, attempt);
        console.warn(`Rate limited, retrying in ${delay}ms... (attempt ${attempt + 1})`);
        await sleep(delay);
        continue;
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error: ${response.status} - ${errorText}`);
      }
      
      const result = await response.json();
      const totalTime = Date.now() - startTime;
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`API call: ${totalTime}ms ${attempt > 0 ? `(${attempt + 1} attempts)` : ''}`);
      }
      
      return result;
    } catch (error) {
      if (attempt === retries) {
        const totalTime = Date.now() - startTime;
        console.error(`API failed after ${totalTime}ms (${attempt + 1} attempts)`);
        throw error;
      }
      
      const delay = RETRY_DELAY_MS * Math.pow(2, attempt);
      console.warn(`Fetch failed, retrying in ${delay}ms... (attempt ${attempt + 1})`);
      await sleep(delay);
    }
  }
  
  throw new Error('Maximum retries exceeded');
}

// Main API functions
export async function getCategories(): Promise<Category[]> {
  try {
    const data = await fetchWithRetry('/api/square/categories');
    // Handle both old format (array) and new format (object with categories property)
    if (Array.isArray(data)) {
      return data;
    } else if (data && typeof data === 'object' && 'categories' in data && Array.isArray(data.categories)) {
      return data.categories as Category[];
    } else {
      console.warn('Unexpected categories response format:', data);
      return [];
    }
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    return [];
  }
}


export async function getBooksByCategory(
  categoryId: string, 
  options: SearchOptions = {}
): Promise<CategoryResponse> {
  const { limit } = options;
  
  try {
    // Build query parameters - no longer requesting images by default
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    
    const url = `/api/square/category/${categoryId}${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await fetchWithRetry<CategoryResponse>(url);

    // Handle both old format (just books array) and new format (with metadata)
    if (Array.isArray(response)) {
      // Old format - convert to new format
      return {
        books: response,
        metadata: {
          totalBooks: response.length,
          imagesLoaded: 0,
          booksWithImageIds: response.filter((book: Book) => book.imageId).length
        }
      };
    }

    return response || {
      books: [],
      metadata: {
        totalBooks: 0,
        imagesLoaded: 0,
        booksWithImageIds: 0
      }
    };
  } catch (error) {
    console.error(`Error fetching books for category ${categoryId}:`, error);
    return {
      books: [],
      metadata: {
        totalBooks: 0,
        imagesLoaded: 0,
        booksWithImageIds: 0
      }
    };
  }
}

export async function getCarouselBooksByCategory(
  categoryId: string, 
  limit = 20
): Promise<Book[]> {
  // For carousels, fetch slightly more books to account for missing images
  const fetchLimit = Math.min(limit + 10, 50);
  
  const response = await getBooksByCategory(categoryId, { 
    limit: fetchLimit
  });
  
  const allBooks = response.books;
  
  // Priority: books with imageIds first (even without loaded imageUrls), then others
  const withImageIds = allBooks.filter((book: Book) => book.imageId);
  const withoutImageIds = allBooks.filter((book: Book) => !book.imageId);

  if (withImageIds.length >= limit) {
    return withImageIds.slice(0, limit);
  }

  return [...withImageIds, ...withoutImageIds.slice(0, limit - withImageIds.length)];
}


// Batch API functions
export async function getBooksById(bookIds: string[]): Promise<Book[]> {
  if (bookIds.length === 0) return [];

  try {
    const response = await fetch('/api/square/books/batch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ bookIds }),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch books: ${response.status}`);
    }

    const data = await response.json();
    return data.books || [];
  } catch (error) {
    console.error('Error fetching books in batch:', error);
    return [];
  }
}

export async function getImageUrlsBatch(imageIds: string[]): Promise<Record<string, string | null>> {
  if (imageIds.length === 0) return {};

  try {
    const response = await fetch('/api/square/images/batch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageIds }),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch images: ${response.status}`);
    }

    const data = await response.json();
    const imageMap: Record<string, string | null> = {};
    
    data.images.forEach((image: { id: string; imageUrl?: string | null }) => {
      imageMap[image.id] = image.imageUrl ?? null;
    });

    return imageMap;
  } catch (error) {
    console.error('Error fetching images in batch:', error);
    return {};
  }
}

export async function getCategoriesBatch(categoryIds: string[]): Promise<Category[]> {
  if (categoryIds.length === 0) return [];

  try {
    const response = await fetch('/api/square/categories/batch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ categoryIds }),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch categories: ${response.status}`);
    }

    const data = await response.json();
    return data.categories || [];
  } catch (error) {
    console.error('Error fetching categories in batch:', error);
    return [];
  }
}

// Enhanced batch image loading for books
export async function loadImagesForBooksBatchOptimized(books: Book[]): Promise<Book[]> {
  const booksWithImageIds = books.filter(book => book.imageId && !book.imageUrl);
  
  if (booksWithImageIds.length === 0) {
    return books;
  }

  const imageIds = booksWithImageIds.map(book => book.imageId!);
  const imageMap = await getImageUrlsBatch(imageIds);

  // Apply the loaded images to the books
  return books.map(book => {
    if (book.imageId && imageMap[book.imageId] !== undefined) {
      return {
        ...book,
        imageUrl: imageMap[book.imageId] || undefined
      };
    }
    return book;
  });
}

// NEW: Load images for all books in categories
export async function loadImagesForCategories(
  categoryBooks: Record<string, Book[]>
): Promise<Record<string, Book[]>> {
  console.log('Loading images for all category books...');
  const startTime = Date.now();
  
  // Collect all image IDs from all categories
  const allBooks = Object.values(categoryBooks).flat();
  const booksWithImageIds = allBooks.filter(book => book.imageId && !book.imageUrl);
  
  if (booksWithImageIds.length === 0) {
    console.log('No images to load');
    return categoryBooks;
  }
  
  console.log(`Loading ${booksWithImageIds.length} images in batch...`);
  
  // Load all images in one batch call
  const imageIds = booksWithImageIds.map(book => book.imageId!);
  const imageMap = await getImageUrlsBatch(imageIds);
  
  // Apply images to all categories
  const updatedCategories: Record<string, Book[]> = {};
  
  for (const [categoryId, books] of Object.entries(categoryBooks)) {
    updatedCategories[categoryId] = books.map(book => {
      if (book.imageId && imageMap[book.imageId] !== undefined) {
        return {
          ...book,
          imageUrl: imageMap[book.imageId] || undefined
        };
      }
      return book;
    });
  }
  
  const totalTime = Date.now() - startTime;
  const imagesLoaded = Object.keys(imageMap).filter(id => imageMap[id]).length;
  console.log(`Batch image loading complete: ${imagesLoaded}/${imageIds.length} images loaded in ${totalTime}ms`);
  
  return updatedCategories;
}

// NEW: Ultra-fast batch loading of all categories at once
export async function loadAllCategoriesBatch(
  categoryIds: string[],
  limit = 20
): Promise<Record<string, Book[]>> {
  if (categoryIds.length === 0) return {};

  console.log(`Ultra-fast batch loading ${categoryIds.length} categories...`);
  const startTime = Date.now();

  try {
    const response = await fetch('/api/square/categories/books', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ categoryIds, limit }),
    });

    if (!response.ok) {
      throw new Error(`Failed to batch load categories: ${response.status}`);
    }

    const data = await response.json();
    
    // Transform response to simple format
    const categoryBooks: Record<string, Book[]> = {};
    if (data.categories) {
      Object.keys(data.categories).forEach(categoryId => {
        categoryBooks[categoryId] = data.categories[categoryId].books || [];
      });
    }

    const totalTime = Date.now() - startTime;
    const totalBooks = Object.values(categoryBooks).flat().length;
    console.log(`Ultra-fast batch loading complete: ${totalBooks} books in ${totalTime}ms`);

    return categoryBooks;
  } catch (error) {
    console.error('Error in ultra-fast batch loading:', error);
    
    // Fallback to individual category calls if batch fails
    console.log('Falling back to individual category loading...');
    const fallbackStartTime = Date.now();
    
    try {
      const categoryPromises = categoryIds.map(async (categoryId) => {
        try {
          const response = await getBooksByCategory(categoryId, { limit });
          return { categoryId, books: response.books };
        } catch (err) {
          console.warn(`Failed to load category ${categoryId}:`, err);
          return { categoryId, books: [] };
        }
      });
      
      const results = await Promise.all(categoryPromises);
      const fallbackBooks: Record<string, Book[]> = {};
      results.forEach(({ categoryId, books }) => {
        fallbackBooks[categoryId] = books;
      });
      
      const fallbackTime = Date.now() - fallbackStartTime;
      console.log(`Fallback loading complete in ${fallbackTime}ms`);
      
      return fallbackBooks;
    } catch (fallbackError) {
      console.error('Both ultra-fast and fallback loading failed:', fallbackError);
      throw fallbackError;
    }
  }
}

// OPTIMIZATION: Ultra-fast initial load strategy
export async function getInitialStoreData(
  categoryIds: string[]
): Promise<{
  categories: Category[];
  initialBooks: Record<string, Book[]>;
}> {
  console.log('Starting ultra-fast store data load...');
  const startTime = Date.now();
  
  try {
    // Load categories and initial books in parallel using ultra-fast batch API
    const [categories, initialBooks] = await Promise.all([
      getCategories(),
      loadAllCategoriesBatch(categoryIds, 20) // Ultra-fast batch loading
    ]);
    
    const totalTime = Date.now() - startTime;
    const totalBooks = Object.values(initialBooks).flat().length;
    console.log(`Ultra-fast store data loaded: ${totalBooks} books in ${totalTime}ms (images will be loaded separately)`);
    
    return {
      categories: categories.length > 0 ? categories : [], // Fallback handled in component
      initialBooks
    };
  } catch (error) {
    console.error('Failed to load store data with ultra-fast approach:', error);
    throw error; // Let component handle fallback
  }
}