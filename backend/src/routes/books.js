const express = require('express');
const { getBooks } = require('../lib/square');

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

module.exports = router;