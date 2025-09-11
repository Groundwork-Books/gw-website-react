/**
 * Test script with proper object debugging for Pinecone responses
 */

require('dotenv').config();
const { Pinecone } = require('@pinecone-database/pinecone');

async function testPineconeConnection() {
  try {
    console.log('Testing Pinecone connection...');

    const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
    const indexName = process.env.PINECONE_INDEX_NAME;
    const indexHost = process.env.PINECONE_INDEX_HOST;

    const namespace = pinecone.index(indexName, indexHost).namespace('books');

    console.log('\n🔍 Testing search query...');
    const response = await namespace.searchRecords({
      query: {
        topK: 10,
        inputs: { text: 'french books' },
      },
      fields: ['ID', 'chunk_text', 'document_title', 'author', 'summary'],
    });

    // Method 1: JSON.stringify with proper formatting
    console.log('\n📋 Full Response (JSON.stringify):');
    console.log(JSON.stringify(response, null, 2));

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error object:');
    console.error(JSON.stringify(error, null, 2));
  }
}

// Alternative: Quick debugging function you can use anywhere
function debugObject(obj, label = 'Object') {
  console.log(`\n=== ${label} ===`);
  console.log(JSON.stringify(obj, null, 2));
}

// Another alternative: Console.dir with options
function deepLog(obj, label = 'Object') {
  console.log(`\n=== ${label} ===`);
  console.dir(obj, { depth: null, colors: true });
}

if (require.main === module) {
  testPineconeConnection();
}

module.exports = { testPineconeConnection, debugObject, deepLog };