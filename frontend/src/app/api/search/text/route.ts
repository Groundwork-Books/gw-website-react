import { NextRequest, NextResponse } from 'next/server';
import { Pinecone } from '@pinecone-database/pinecone';
import { 
  getCachedSearchResults, 
  setCachedSearchResults, 
} from '@/lib/redis';
import crypto from 'crypto';

// Pinecone search hit interface
interface PineconeSearchHit {
  _id?: string;
  _score?: number;
  fields?: {
    ID?: string;
    document_title?: string;
    summary?: string;
    chunk_text?: string;
    author?: string;
  };
}

// Initialize Pinecone client
let pinecone: Pinecone | null = null;

function initializePinecone(): Pinecone {
  if (!pinecone) {
    const apiKey = process.env.PINECONE_API_KEY;
    if (!apiKey) {
      throw new Error('PINECONE_API_KEY environment variable is required');
    }
    pinecone = new Pinecone({ apiKey });
  }
  return pinecone;
}

export async function POST(request: NextRequest) {
  try {
    const pineconeClient = initializePinecone();
    
    const body = await request.json();
    const { query, limit = 10 } = body;
    
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Query parameter is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    // Create a cache key for text search specifically (different from main search)
    const normalizedQuery = query.trim().toLowerCase();
    const cacheKey = crypto.createHash('md5').update(`text:${normalizedQuery}:${limit}`).digest('hex');
    
    console.log(`Text search request for: "${normalizedQuery}" (limit: ${limit}), cache key: ${cacheKey}`);

    // Check cache first
    try {
      const cachedResult = await getCachedSearchResults(cacheKey);
      if (cachedResult) {
        console.log(`Returning cached text search results for query: "${normalizedQuery}"`);
        return NextResponse.json({
          success: true,
          query: normalizedQuery,
          results: cachedResult.books,
          total: cachedResult.totalCount,
          searchType: 'snippets-only',
          namespace: 'books',
          cached: true,
          cacheKey
        });
      }
    } catch (error) {
      console.warn('Cache retrieval failed for text search:', error);
    }

    console.log(`Cache miss, performing Pinecone text search for: "${normalizedQuery}"`);

    const indexName = process.env.PINECONE_INDEX_NAME || 'books-index';
    const indexHost = process.env.PINECONE_INDEX_HOST;
    
    const namespaceClient = pineconeClient.index(indexName, indexHost).namespace('books');
    
    const searchResults = await namespaceClient.searchRecords({
      query: {
        topK: parseInt(String(limit)),
        inputs: { text: normalizedQuery }
      },
      fields: ['ID', 'chunk_text', 'document_title', 'author', 'summary']
    });

    // Extract search results
    const pineconeHits = searchResults.result?.hits || [];

    // Return just the search snippets without full book data
    const snippets = pineconeHits.map((hit: PineconeSearchHit) => ({
      id: hit.fields?.ID || hit._id,
      title: hit.fields?.document_title || 'Unknown Title',
      author: hit.fields?.author || '',
      snippet: hit.fields?.chunk_text || '',
      score: hit._score || 0
    }));

    const searchResponse = {
      success: true,
      query: normalizedQuery,
      results: snippets,
      total: snippets.length,
      searchType: 'snippets-only',
      namespace: 'books',
      cached: false
    };

    // Cache the results
    try {
      await setCachedSearchResults(cacheKey, {
        books: snippets,
        totalCount: snippets.length
      });
      console.log(`Cached text search results for query: "${normalizedQuery}"`);
    } catch (error) {
      console.warn('Failed to cache text search results:', error);
    }

    return NextResponse.json({
      ...searchResponse,
      cacheKey
    });

  } catch (error) {
    console.error('Text search error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to search books',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Use POST method for text search queries' }, { status: 405 });
}