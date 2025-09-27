import { NextRequest, NextResponse } from 'next/server';

// Pinecone result types
interface PineconeHit {
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

interface SearchBook {
  id: string;
  name: string;
  description: string;
  author: string;
  price: number;
  currency: string;
  searchScore: number;
  searchSnippet: string;
}
import { Pinecone } from '@pinecone-database/pinecone';

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

    const indexName = process.env.PINECONE_INDEX_NAME || 'books-index';
    const indexHost = process.env.PINECONE_INDEX_HOST;
    
    // Get the namespace
    const namespaceClient = pineconeClient.index(indexName, indexHost).namespace('books');
    
    // Search using the correct API structure
    const searchResults = await namespaceClient.searchRecords({
      query: {
        topK: parseInt(String(limit)),
        inputs: { text: query.trim() }
      },
      fields: ['ID', 'chunk_text', 'document_title', 'author', 'summary']
    });

    console.log('Pinecone search results:', JSON.stringify(searchResults, null, 2));

    // Extract book information from Pinecone results
    const pineconeHits = searchResults.result?.hits || [];
    
    // Transform Pinecone results to match frontend expectations
    const books = pineconeHits.map((hit: PineconeHit) => {
      return {
        id: hit.fields?.ID || hit._id,
        name: hit.fields?.document_title || 'Unknown Title',
        description: hit.fields?.summary || hit.fields?.chunk_text || 'No description available',
        author: hit.fields?.author || '',
        price: 0, // Price will be fetched on frontend from Square API
        currency: 'USD',
        searchScore: hit._score || 0,
        searchSnippet: hit.fields?.chunk_text || ''
      };
    }).filter((book): book is SearchBook => Boolean(book.id)); // Remove any results without ID

    return NextResponse.json({
      success: true,
      query,
      results: books,
      total: books.length,
      pineconeHits: pineconeHits.length,
      namespace: 'books'
    });

  } catch (error) {
    console.error('Search error:', error);
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
  return NextResponse.json({ message: 'Use POST method for search queries' }, { status: 405 });
}