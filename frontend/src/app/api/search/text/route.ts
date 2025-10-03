import { NextRequest, NextResponse } from 'next/server';
import { Pinecone } from '@pinecone-database/pinecone';

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

    const indexName = process.env.PINECONE_INDEX_NAME || 'books-index';
    const indexHost = process.env.PINECONE_INDEX_HOST;
    
    const namespaceClient = pineconeClient.index(indexName, indexHost).namespace('books');
    
    const searchResults = await namespaceClient.searchRecords({
      query: {
        topK: parseInt(String(limit)),
        inputs: { text: query.trim() }
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

    return NextResponse.json({
      success: true,
      query,
      results: snippets,
      total: snippets.length,
      searchType: 'snippets-only',
      namespace: 'books'
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