import { Book } from './types';

// Configuration
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 500;
const BATCH_SIZE = 5;

// Types
export interface Category {
  id: string;
  name: string;
}

export interface SearchOptions {
  includeImages?: boolean;
  limit?: number;
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

// Interface for image data response
interface ImageData {
  imageUrl: string;
}

// Image loading using Next.js API route
async function getImageUrl(imageId: string): Promise<string | null> {
  if (!imageId) return null;
  
  try {
    const data = await fetchWithRetry<ImageData>(`/api/square/image/${imageId}`);
    return data?.imageUrl || null;
  } catch (error) {
    console.error(`Failed to fetch image ${imageId}:`, error);
    return null;
  }
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

export async function getBookById(bookId: string): Promise<Book | null> {
  try {
    const data = await fetchWithRetry(`/api/square/book/${bookId}`);
    
    // The API route already transforms the data, but we need to load the image separately
    const book = data as Book;
    
    // Load image if available
    if (book.imageId) {
      book.imageUrl = await getImageUrl(book.imageId) || undefined;
    }

    return book;
  } catch (error) {
    console.error(`Error fetching book ${bookId}:`, error);
    return null;
  }
}

export async function getBooksByCategory(
  categoryId: string, 
  options: SearchOptions = {}
): Promise<Book[]> {
  const { includeImages = false, limit } = options;
  
  try {
    // Build query parameters
    const params = new URLSearchParams();
    if (includeImages) params.append('includeImages', 'true');
    if (limit) params.append('limit', limit.toString());
    
    const url = `/api/square/category/${categoryId}${params.toString() ? `?${params.toString()}` : ''}`;
    const books = await fetchWithRetry(url);

    return Array.isArray(books) ? books : [];
  } catch (error) {
    console.error(`Error fetching books for category ${categoryId}:`, error);
    return [];
  }
}

export async function getCarouselBooksByCategory(
  categoryId: string, 
  limit = 20
): Promise<Book[]> {
  // For carousels, fetch slightly more books to account for missing images
  const fetchLimit = Math.min(limit + 10, 50);
  
  const allBooks = await getBooksByCategory(categoryId, { 
    includeImages: true, 
    limit: fetchLimit 
  });
  
  // Priority: books with images first, then others
  const withImages = allBooks.filter(book => book.imageUrl);
  const withoutImages = allBooks.filter(book => !book.imageUrl);

  if (withImages.length >= limit) {
    return withImages.slice(0, limit);
  }

  return [...withImages, ...withoutImages.slice(0, limit - withImages.length)];
}

// Helper function to load images in batches
async function loadImagesForBooks(books: Book[]): Promise<void> {
  const booksWithImageIds = books.filter(book => book.imageId);
  
  if (booksWithImageIds.length === 0) return;

  console.log(`Loading images for ${booksWithImageIds.length} books (batch size: ${BATCH_SIZE})`);
  
  for (let i = 0; i < booksWithImageIds.length; i += BATCH_SIZE) {
    const batch = booksWithImageIds.slice(i, i + BATCH_SIZE);
    
    await Promise.all(
      batch.map(async (book) => {
        if (book.imageId) {
          book.imageUrl = await getImageUrl(book.imageId) || undefined;
        }
      })
    );
  }
  
  const imagesLoaded = books.filter(book => book.imageUrl).length;
  console.log(`Images loaded: ${imagesLoaded}/${booksWithImageIds.length}`);
}

// Priority loading for performance-critical components
export async function loadImageForBook(book: Book): Promise<Book> {
  if (!book.imageId || book.imageUrl) {
    return book;
  }
  
  const imageUrl = await getImageUrl(book.imageId);
  return { ...book, imageUrl: imageUrl || undefined };
}

export async function loadImagesForBooksBatch(books: Book[]): Promise<Book[]> {
  const updatedBooks = [...books];
  await loadImagesForBooks(updatedBooks);
  return updatedBooks;
}