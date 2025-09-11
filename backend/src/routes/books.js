const express = require('express');
const { 
  getBooks, 
  getBookById,
  getBooksByCategory, 
  getCarouselBooksByCategory, 
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

// GET /api/books/category/:categoryId - Get books by category
router.get('/category/:categoryId', async (req, res) => {
  const { categoryId } = req.params;
  try {
    const books = await getBooksByCategory(categoryId);
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
    const books = await getCarouselBooksByCategory(categoryId);
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

module.exports = router;