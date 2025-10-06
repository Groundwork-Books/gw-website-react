// Client-side API functions to fetch data from our Next.js API routes

import { Book } from './types';

type EnrichedBookResult = Book & { searchScore: number; searchSnippet: string };

interface PineconeResult {
  id: string;
  name?: string;
  description?: string;
  searchScore?: number;
  searchSnippet?: string;
}

export interface InstagramPost {
  postUrl: string;
  altText: string;
  order: number;
  active: boolean;
}

export interface Event {
  eventName: string;
  date: string;
  description: string;
  imageUrl: string;
  location: string;
  link: string;
  active: boolean;
}

export interface SearchResult {
  success: boolean;
  query: string;
  results: (Book & {
    searchScore: number;
    searchSnippet: string;
  })[];
  total: number;
}

// Search function for Pinecone-powered book search
export async function searchBooks(query: string, limit = 10): Promise<SearchResult> {
  try {
    const response = await fetch('/api/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, limit }),
    });

    if (!response.ok) {
      throw new Error('Search failed');
    }

    const pineconeResults = await response.json();
    
    if (!pineconeResults.success || !pineconeResults.results || !Array.isArray(pineconeResults.results)) {
      console.error('Invalid search response structure:', pineconeResults);
      return {
        success: false,
        query,
        results: [],
        total: 0,
      };
    }

    // Now fetch full book details using Square API batch endpoint
    const bookIds = pineconeResults.results
      .map((result: PineconeResult) => result.id)
      .filter((id: string) => id); // Remove any undefined IDs

    console.log(`Fetching batch book details for ${bookIds.length} books`);

    let enrichedResults: EnrichedBookResult[] = [];

    if (bookIds.length > 0) {
      try {
        const batchResponse = await fetch('/api/square/books/batch', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ bookIds }),
        });

        if (batchResponse.ok) {
          const batchData = await batchResponse.json();
          
          // Ensure batchData.books exists and is an array
          if (!batchData.books || !Array.isArray(batchData.books)) {
            console.error('Batch API returned invalid data structure');
            throw new Error('Invalid batch response structure');
          }
          
          const bookMap = new Map(batchData.books.map((book: Book) => [book.id, book]));

          // Merge Square API data with Pinecone search results
          enrichedResults = pineconeResults.results.map((result: PineconeResult) => {
            const squareBook = bookMap.get(result.id);
            
            if (squareBook) {
              // Use Square API data with search context
              return {
                ...squareBook,
                searchScore: result.searchScore || 0,
                searchSnippet: result.searchSnippet || ''
              };
            } else {
              // Fallback to Pinecone data if book not found in Square
              return {
                id: result.id,
                name: result.name || 'Unknown Book',
                description: result.description || 'No description available',
                price: 0,
                currency: 'USD',
                searchScore: result.searchScore || 0,
                searchSnippet: result.searchSnippet || ''
              };
            }
          });

          console.log(`Successfully enriched ${batchData.books.length} out of ${bookIds.length} books`);

          // Load images for the enriched results in batch (optimized)
          if (enrichedResults.length > 0) {
            try {
              const { loadImagesForBooksBatchOptimized } = await import('./square');
              const booksWithImages = await loadImagesForBooksBatchOptimized(enrichedResults);
              
              // Preserve the search metadata while updating with image URLs
              enrichedResults = enrichedResults.map(result => {
                const bookWithImage = booksWithImages.find(book => book.id === result.id);
                return {
                  ...result,
                  imageUrl: bookWithImage?.imageUrl || result.imageUrl
                };
              });
              
              console.log(`Loaded images for search results using optimized batch loading`);
            } catch (imageError) {
              console.warn('Failed to load images for search results:', imageError);
              // Continue without images if image loading fails
            }
          }
        } else {
          console.error('Batch book fetch failed, falling back to Pinecone data');
          throw new Error('Batch fetch failed');
        }
      } catch (error) {
        console.error('Error in batch book fetch, using fallback data:', error);
        
        // Fallback to Pinecone data for all results
        enrichedResults = pineconeResults.results.map((result: PineconeResult) => ({
          id: result.id,
          name: result.name || 'Unknown Book',
          description: result.description || 'No description available',
          price: 0,
          currency: 'USD',
          searchScore: result.searchScore || 0,
          searchSnippet: result.searchSnippet || ''
        }));
      }
    } else {
      // No valid book IDs found
      enrichedResults = [];
    }

    return {
      success: true,
      query,
      results: enrichedResults,
      total: enrichedResults.length,
    };

  } catch (error) {
    console.error('Error searching books:', error);
    return {
      success: false,
      query,
      results: [],
      total: 0,
    };
  }
}

export async function getInstagramPosts(): Promise<InstagramPost[]> {
  try {
    const response = await fetch('/api/instagram');
    if (!response.ok) {
      throw new Error('Failed to fetch Instagram posts');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching Instagram posts:', error);
    // Return fallback data if API fails
    return [
      {
        postUrl: 'https://www.instagram.com/p/C3CYLGrLK8F/',
        altText: 'Groundwork Books community post',
        order: 1,
        active: true
      },
      {
        postUrl: 'https://www.instagram.com/p/DKaqRZjS--b/',
        altText: 'Recent book arrivals and displays',
        order: 2,
        active: true
      },
      {
        postUrl: 'https://www.instagram.com/p/DIIVR-ERxFf/',
        altText: 'Community gathering and events',
        order: 3,
        active: true
      },
      {
        postUrl: 'https://www.instagram.com/p/DGOZRmAShAR/',
        altText: 'Book selection and recommendations',
        order: 4,
        active: true
      },
      {
        postUrl: 'https://www.instagram.com/p/DGHx5T-OJe6/?img_index=1',
        altText: 'Store interior and atmosphere',
        order: 5,
        active: true
      },
      {
        postUrl: 'https://www.instagram.com/p/DF_ggzDS0w0/',
        altText: 'Local authors and book highlights',
        order: 6,
        active: true
      },
      {
        postUrl: 'https://www.instagram.com/p/DF_CfnmSMWk/?img_index=1',
        altText: 'Community organizing and activism',
        order: 7,
        active: true
      },
      {
        postUrl: 'https://www.instagram.com/p/DF6ewBOPtxP/',
        altText: 'Book club and discussion events',
        order: 8,
        active: true
      }
    ];
  }
}

export async function getEvents(): Promise<Event[]> {
  try {
    const response = await fetch('/api/events');
    if (!response.ok) {
      throw new Error('Failed to fetch events');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching events:', error);
    // Return fallback data if API fails
    return [
      {
        eventName: 'Bonfire & Books',
        date: '2025-02-15',
        description: 'Join us for an evening of reading and discussion around the campfire',
        imageUrl: '/images/events/bonfire-books.jpg',
        location: 'Outdoor Patio',
        link: 'https://eventbrite.com/bonfire-books',
        active: true
      },
      {
        eventName: 'Dollar Launch Club',
        date: '2025-02-20',
        description: 'Coffee, community, and conversations about local organizing',
        imageUrl: '/images/events/coffee-meeting.jpg',
        location: 'Main Reading Room',
        link: 'https://eventbrite.com/dollar-launch',
        active: true
      },
      {
        eventName: 'Book Discussion Circle',
        date: '2025-02-25',
        description: 'Weekly book club featuring radical literature and community voices',
        imageUrl: '/images/events/book-discussion.jpg',
        location: 'Community Space',
        link: 'https://eventbrite.com/book-discussion',
        active: true
      }
    ];
  }
}