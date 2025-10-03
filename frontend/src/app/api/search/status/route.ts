import { NextResponse } from 'next/server';
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

export async function GET() {
  try {
    const pineconeClient = initializePinecone();

    const indexName = process.env.PINECONE_INDEX_NAME || 'books-index';
    const indexHost = process.env.PINECONE_INDEX_HOST;
    
    // Try to get index stats
    const namespaceClient = pineconeClient.index(indexName, indexHost).namespace('books');
    const stats = await namespaceClient.describeIndexStats();
    
    return NextResponse.json({
      status: 'ready',
      indexName,
      indexHost,
      totalVectors: stats.totalRecordCount,
      dimension: stats.dimension,
      namespaces: stats.namespaces || {}
    });

  } catch (error) {
    console.error('Pinecone status check error:', error);
    return NextResponse.json({ 
      status: 'error',
      message: String(error)
    });
  }
}