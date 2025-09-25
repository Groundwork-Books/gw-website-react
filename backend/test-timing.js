require('dotenv').config();
const { getBooksByCategory, getCategories } = require('./src/lib/square');

async function testTiming() {
  console.log('Testing Square API timing and caching effectiveness\n');
  
  try {
    // Get categories first
    console.log('Fetching categories...');
    const categories = await getCategories();
    console.log(`Found ${categories.length} categories\n`);
    
    if (categories.length === 0) {
      console.log('No categories found!');
      return;
    }
    
    const testCategory = categories[0];
    console.log(`Using test category: ${testCategory.name} (${testCategory.id})\n`);
    
    // Test 1: Cold cache (should hit Square API)
    console.log('=== TEST 1: Cold Cache (First Load) ===');
    const start1 = Date.now();
    const books1 = await getBooksByCategory(testCategory.id, false); // Force skip cache
    const time1 = Date.now() - start1;
    console.log(`TOTAL TIME (Cold): ${time1}ms - Found ${books1.length} books\n`);
    
    // Test 2: Warm cache (should hit cache)
    console.log('=== TEST 2: Warm Cache (Second Load) ===');
    const start2 = Date.now();
    const books2 = await getBooksByCategory(testCategory.id, true); // Use cache
    const time2 = Date.now() - start2;
    console.log(`TOTAL TIME (Warm): ${time2}ms - Found ${books2.length} books\n`);
    
    // Performance comparison
    console.log('=== PERFORMANCE COMPARISON ===');
    console.log(`Cold cache: ${time1}ms`);
    console.log(`Warm cache: ${time2}ms`);
    console.log(`Speed improvement: ${((time1 - time2) / time1 * 100).toFixed(1)}%`);
    console.log(`Cache is ${(time1 / time2).toFixed(1)}x faster`);
    
    // Image statistics
    const withImages = books1.filter(b => b.imageUrl).length;
    console.log(`\nImages: ${withImages}/${books1.length} books have images (${(withImages/books1.length*100).toFixed(1)}%)`);
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
if (require.main === module) {
  testTiming();
}