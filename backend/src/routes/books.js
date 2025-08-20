const express = require('express');
const { getBooks, getBooksByCategory, getCarouselBooksByCategory } = require('../lib/square');

const router = express.Router();

// GET /api/books
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