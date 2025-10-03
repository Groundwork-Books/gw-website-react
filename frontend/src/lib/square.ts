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
  includeImages?: boolean;
  limit?: number;
}

export interface CategoryResponse {
  books: Book[];
  metadata: {
    totalBooks: number;
    imagesLoaded: number;
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
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    return [];
  }
}


export async function getBooksByCategory(
  categoryId: string, 
  options: SearchOptions = {}
): Promise<CategoryResponse> {
  const { includeImages = false, limit } = options;
  
  try {
    // Build query parameters
    const params = new URLSearchParams();
    if (includeImages) params.append('includeImages', 'true');
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
          imagesLoaded: response.filter((book: Book) => book.imageUrl).length
        }
      };
    }

    return response || {
      books: [],
      metadata: {
        totalBooks: 0,
        priorityImagesLoaded: 0,
        lazyImagesAvailable: 0,
        lazyLoadingSupported: false
      }
    };
  } catch (error) {
    console.error(`Error fetching books for category ${categoryId}:`, error);
    return {
      books: [],
      metadata: {
        totalBooks: 0,
        imagesLoaded: 0
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
    includeImages: true, 
    limit: fetchLimit,
    // Load images for all carousel items
  });
  
  const allBooks = response.books;
  
  // Priority: books with images first, then others
  const withImages = allBooks.filter((book: Book) => book.imageUrl);
  const withoutImages = allBooks.filter((book: Book) => !book.imageUrl);

  if (withImages.length >= limit) {
    return withImages.slice(0, limit);
  }

  return [...withImages, ...withoutImages.slice(0, limit - withImages.length)];
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

// OPTIMIZATION: Parallel category loading with progressive updates
export async function loadCategoriesInParallel(
  categoryIds: string[],
  options: {
    limit?: number;
    includeImages?: boolean;
    onCategoryLoaded?: (categoryId: string, books: Book[]) => void;
  } = {}
): Promise<Record<string, Book[]>> {
  const { limit = 20, includeImages = true, onCategoryLoaded } = options;
  
  console.log(`Loading ${categoryIds.length} categories in parallel...`);
  const startTime = Date.now();
  
  // Create promises for all categories
  const categoryPromises = categoryIds.map(async (categoryId) => {
    try {
      const response = await getBooksByCategory(categoryId, { 
        includeImages, 
        limit 
      });
      
      // Progressive update callback - allows UI to update as each category loads
      if (onCategoryLoaded) {
        onCategoryLoaded(categoryId, response.books);
      }
      
      return { categoryId, books: response.books, success: true };
    } catch (error) {
      console.warn(`Failed to load category ${categoryId}:`, error);
      return { categoryId, books: [], success: false };
    }
  });
  
  // Wait for all categories to complete
  const results = await Promise.all(categoryPromises);
  
  // Convert to record format
  const categoryBooks: Record<string, Book[]> = {};
  results.forEach(({ categoryId, books }) => {
    categoryBooks[categoryId] = books;
  });
  
  const totalTime = Date.now() - startTime;
  const successCount = results.filter(r => r.success).length;
  console.log(`Parallel loading complete: ${successCount}/${categoryIds.length} categories loaded in ${totalTime}ms`);
  
  return categoryBooks;
}

// OPTIMIZATION: Fast initial load strategy with progressive loading
export async function getInitialStoreData(
  categoryIds: string[]
): Promise<{
  categories: Category[];
  initialBooks: Record<string, Book[]>;
}> {
  console.log('Starting optimized store data load...');
  const startTime = Date.now();
  
  try {
    // Load categories and initial books in parallel
    const [categories, initialBooks] = await Promise.all([
      getCategories(),
      loadCategoriesInParallel(categoryIds, {
        limit: 20, // Load reasonable amount initially
        includeImages: true
      })
    ]);
    
    const totalTime = Date.now() - startTime;
    console.log(`Initial store data loaded in ${totalTime}ms`);
    
    return {
      categories: categories.length > 0 ? categories : [], // Fallback handled in component
      initialBooks
    };
  } catch (error) {
    console.error('Failed to load initial store data:', error);
    throw error; // Let component handle fallback
  }
}