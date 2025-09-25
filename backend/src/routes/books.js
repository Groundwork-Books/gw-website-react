const express = require('express');
const { 
  getBooks, 
  getBookById,
  getBooksByCategory, 
  getCarouselBooksByCategory, 
  getCategories,
  getImage 
} = require('../lib/square');

const router = express.Router();

// GET /api/books - Get all books
router.get('/', async (req, res) => {
  try {
    // Debug environment variables
    console.log('SQUARE_ACCESS_TOKEN:', process.env.SQUARE_ACCESS_TOKEN ? 'SET' : 'NOT SET');
    console.log('SQUARE_ENVIRONMENT:', process.env.SQUARE_ENVIRONMENT);
    
    const books = await getBooks();
    res.json(books);
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Failed to fetch books' });
  }
});

// GET /api/books/categories - Get all categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await getCategories();
    res.json(categories);
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// GET /api/books/category/:categoryId - Get books by category (fast, no images)
router.get('/category/:categoryId', async (req, res) => {
  const { categoryId } = req.params;
  try {
    // Fast response without images - images will be loaded on-demand
    const books = await getBooksByCategory(categoryId, true, false); // useCache=true, includeImages=false
    if (!books) {
      return res.status(404).json({ error: 'Books not found' });
    }
    res.json(books);
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Failed to fetch books' });
  }
});

// GET /api/books/categorycarousel/:categoryId - Get carousel books by category
router.get('/categorycarousel/:categoryId', async (req, res) => {
  const { categoryId } = req.params;
  
  try {
    const carouselLimit =  20; // Default to 20
    const books = await getCarouselBooksByCategory(categoryId, carouselLimit);
    if (!books) {
      return res.status(404).json({ error: 'Books not found' });
    }
    res.json(books);
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Failed to fetch books' });
  }
});

// GET /api/books/image/:id - Get image for a book
router.get('/image/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const imageUrl = await getImage(id);
    if (!imageUrl) {
      return res.status(404).json({ error: 'Image not found' });
    }
    res.json({ imageUrl });
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Failed to fetch image' });
  }
});

// GET /api/books/debug/cache-status - Debug cache performance
router.get('/debug/cache-status', async (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');
    
    const CACHE_DIR = path.resolve(__dirname, '..', 'lib', 'cache');
    const IMAGE_CACHE_FILE = path.join(CACHE_DIR, 'images.json');
    
    // Check if cache directory exists
    if (!fs.existsSync(CACHE_DIR)) {
      return res.json({ 
        status: 'cache_not_initialized',
        cacheDir: CACHE_DIR,
        exists: false 
      });
    }
    
    // Get all cache files
    const cacheFiles = fs.readdirSync(CACHE_DIR)
      .filter(file => file.endsWith('.json'))
      .map(file => {
        const filePath = path.join(CACHE_DIR, file);
        const stats = fs.statSync(filePath);
        const ageHours = (Date.now() - stats.mtimeMs) / 1000 / 60 / 60;
        
        return {
          file,
          sizeKB: (stats.size / 1024).toFixed(1),
          ageHours: ageHours.toFixed(1),
          lastModified: stats.mtime.toISOString()
        };
      });
    
    // Image cache stats
    let imageCacheStats = null;
    if (fs.existsSync(IMAGE_CACHE_FILE)) {
      const imageCache = JSON.parse(fs.readFileSync(IMAGE_CACHE_FILE, 'utf-8'));
      imageCacheStats = {
        imageCount: Object.keys(imageCache).length,
        sizeKB: (fs.statSync(IMAGE_CACHE_FILE).size / 1024).toFixed(1)
      };
    }
    
    res.json({
      status: 'cache_active',
      cacheDir: CACHE_DIR,
      totalCacheFiles: cacheFiles.length,
      categoryFiles: cacheFiles.filter(f => f.file !== 'images.json').length,
      imageCacheStats,
      cacheFiles: cacheFiles.sort((a, b) => parseFloat(a.ageHours) - parseFloat(b.ageHours)),
      serverTime: new Date().toISOString()
    });
  } catch (error) {
    console.error('Cache debug error:', error);
    res.status(500).json({ error: 'Failed to check cache status' });
  }
});

// GET /api/books/debug/test-cache-performance - Test cache vs API performance
router.get('/debug/test-cache-performance', async (req, res) => {
  try {
    const { categoryId } = req.query;
    
    if (!categoryId) {
      // Get a random category to test with
      const categories = await getCategories();
      if (categories.length === 0) {
        return res.status(400).json({ error: 'No categories found to test with' });
      }
      const testCategory = categories[0];
      return res.json({ 
        message: 'Please provide a categoryId parameter',
        example: `/api/books/debug/test-cache-performance?categoryId=${testCategory.id}`,
        availableCategories: categories.slice(0, 5).map(c => ({ id: c.id, name: c.name }))
      });
    }
    
    console.log(`Performance test requested for category: ${categoryId}`);
    
    // Test 1: Force fresh API call (no cache)
    const start1 = Date.now();
    const freshBooks = await getBooksByCategory(categoryId, false);
    const freshTime = Date.now() - start1;
    
    // Small delay to separate log entries
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Test 2: Use cache
    const start2 = Date.now();
    const cachedBooks = await getBooksByCategory(categoryId, true);
    const cachedTime = Date.now() - start2;
    
    const speedImprovement = cachedTime > 0 ? 
      ((freshTime - cachedTime) / freshTime * 100).toFixed(1) : 
      100;
    
    const result = {
      categoryId,
      freshApiTime: freshTime,
      cachedTime: cachedTime,
      speedImprovement: `${speedImprovement}%`,
      cacheMultiplier: cachedTime > 0 ? (freshTime / cachedTime).toFixed(1) : 'infinite',
      bookCount: freshBooks.length,
      imagesFound: freshBooks.filter(b => b.imageUrl).length,
      testTime: new Date().toISOString()
    };
    
    console.log(`Performance test complete:`, result);
    res.json(result);
    
  } catch (error) {
    console.error('Performance test error:', error);
    res.status(500).json({ error: 'Failed to run performance test' });
  }
});

// GET /api/books/:id - Get a single book by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const book = await getBookById(id);
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }
    res.json(book);
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Failed to fetch book' });
  }
});

module.exports = router;