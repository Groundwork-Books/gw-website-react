const express = require('express');
const { Pinecone } = require('@pinecone-database/pinecone');
const { getBookById } = require('../lib/square'); // Import from the correct path

const router = express.Router();

// Initialize Pinecone client
let pinecone;
try {
  pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY,
  });
} catch (error) {
  console.error('Failed to initialize Pinecone:', error);
}

// POST /api/search
router.post('/', async (req, res) => {
  try {
    if (!pinecone) {
      return res.status(500).json({ 
        error: 'Pinecone not initialized. Please check PINECONE_API_KEY environment variable.' 
      });
    }

    const { query, limit = 10, namespace } = req.body;
    
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return res.status(400).json({ 
        error: 'Query parameter is required and must be a non-empty string' 
      });
    }

    const indexName = process.env.PINECONE_INDEX_NAME || 'books-index';
    const indexHost = process.env.PINECONE_INDEX_HOST;
    
    // Get the namespace
    const namespaceClient = pinecone.index(indexName, indexHost).namespace('books');
    
    // Search using the correct API structure
    const searchResults = await namespaceClient.searchRecords({
      query: {
        topK: parseInt(limit),
        inputs: { text: query.trim() }
      },
      fields: ['ID', 'chunk_text', 'document_title', 'author', 'summary']
    });

    console.log('Pinecone search results:', JSON.stringify(searchResults, null, 2));

    // Extract book IDs from Pinecone results
    const pineconeHits = searchResults.result?.hits || [];
    const bookIds = pineconeHits
      .map(hit => hit.fields?.ID || hit._id)
      .filter(id => id); // Remove any undefined/null IDs

    console.log('Extracted book IDs:', bookIds);

    // Fetch full book details from Square API
    const books = [];
    const errors = [];

    for (const bookId of bookIds) {
      try {
        const book = await getBookById(bookId);
        if (book) {
          // Find the corresponding Pinecone hit to get the score
          const pineconeHit = pineconeHits.find(hit => 
            hit.fields?.ID === bookId || hit._id === bookId
          );
          
          books.push({
            ...book,
            searchScore: pineconeHit?._score || 0,
            searchSnippet: pineconeHit?.fields?.chunk_text || ''
          });
        }
      } catch (error) {
        console.error(`Failed to fetch book ${bookId}:`, error.message);
        errors.push({ bookId, error: error.message });
      }
    }

    res.json({
      success: true,
      query,
      results: books,
      total: books.length,
      pineconeHits: pineconeHits.length,
      errors: errors.length > 0 ? errors : undefined,
      namespace: 'books'
    });

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ 
      error: 'Failed to search books',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// POST /api/search/text - Alternative endpoint for text-based search
router.post('/text', async (req, res) => {
  try {
    if (!pinecone) {
      return res.status(500).json({ 
        error: 'Pinecone not initialized. Please check PINECONE_API_KEY environment variable.' 
      });
    }

    const { query, limit = 10, includeSnippets = false } = req.body;
    
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return res.status(400).json({ 
        error: 'Query parameter is required and must be a non-empty string' 
      });
    }

    const indexName = process.env.PINECONE_INDEX_NAME || 'books-index';
    const indexHost = process.env.PINECONE_INDEX_HOST;
    
    const namespaceClient = pinecone.index(indexName, indexHost).namespace('books');
    
    const searchResults = await namespaceClient.searchRecords({
      query: {
        topK: parseInt(limit),
        inputs: { text: query.trim() }
      },
      fields: ['ID', 'chunk_text', 'document_title', 'author', 'summary']
    });

    const pineconeHits = searchResults.result?.hits || [];

    if (includeSnippets) {
      // Return just the search snippets without full book data
      const snippets = pineconeHits.map(hit => ({
        id: hit.fields?.ID || hit._id,
        title: hit.fields?.document_title || 'Unknown Title',
        author: hit.fields?.author || '',
        snippet: hit.fields?.chunk_text || '',
        score: hit._score || 0
      }));

      return res.json({
        success: true,
        query,
        results: snippets,
        total: snippets.length,
        searchType: 'snippets-only',
        namespace: 'books'
      });
    }

    // Full search with Square API integration
    const bookIds = pineconeHits
      .map(hit => hit.fields?.ID || hit._id)
      .filter(id => id);

    const books = [];
    const errors = [];

    for (const bookId of bookIds) {
      try {
        const book = await getBookById(bookId);
        if (book) {
          const pineconeHit = pineconeHits.find(hit => 
            hit.fields?.ID === bookId || hit._id === bookId
          );
          
          books.push({
            ...book,
            searchScore: pineconeHit?._score || 0,
            searchSnippet: pineconeHit?.fields?.chunk_text || ''
          });
        }
      } catch (error) {
        console.error(`Failed to fetch book ${bookId}:`, error.message);
        errors.push({ bookId, error: error.message });
      }
    }

    res.json({
      success: true,
      query,
      results: books,
      total: books.length,
      searchType: 'text-based',
      errors: errors.length > 0 ? errors : undefined,
      namespace: 'books'
    });

  } catch (error) {
    console.error('Text search error:', error);
    res.status(500).json({ 
      error: 'Failed to search books',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/search/status - Check if Pinecone is properly configured
router.get('/status', async (req, res) => {
  try {
    if (!pinecone) {
      return res.json({ 
        status: 'error',
        message: 'Pinecone not initialized' 
      });
    }

    const indexName = process.env.PINECONE_INDEX_NAME || 'books-index';
    const indexHost = process.env.PINECONE_INDEX_HOST;
    
    // Try to get index stats
    const namespaceClient = pinecone.index(indexName, indexHost).namespace('books');
    const stats = await namespaceClient.describeIndexStats();
    
    res.json({
      status: 'ready',
      indexName,
      indexHost,
      totalVectors: stats.totalVectorCount,
      dimension: stats.dimension,
      namespaces: stats.namespaces || {}
    });

  } catch (error) {
    console.error('Pinecone status check error:', error);
    res.json({ 
      status: 'error',
      message: error.message 
    });
  }
});

module.exports = router;