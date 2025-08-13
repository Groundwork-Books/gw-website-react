'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useCart } from '@/lib/CartContext';
import { Book } from '@/lib/types';
import Link from 'next/link';

export default function BooksPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { addToCart, itemCount } = useCart();

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      const response = await fetch('/api/books');
      if (!response.ok) {
        throw new Error('Failed to fetch books');
      }
      const booksData = await response.json();
      setBooks(booksData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (book: Book) => {
    if (!user) {
      // Show login prompt instead of alert
      const shouldLogin = confirm('Please log in to add items to your cart. Would you like to go to the login page?');
      if (shouldLogin) {
        window.location.href = '/login';
      }
      return;
    }
    
    addToCart(book);
    alert(`Added "${book.name}" to cart!`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading books...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with Navigation */}
        <div className="flex justify-between items-center mb-12">
          {/* Back to Home */}
          <Link 
            href="/"
            className="text-blue-600 hover:text-blue-700 flex items-center text-sm font-medium"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Home
          </Link>
          
          {/* Title */}
          <div className="text-center flex-1">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Our Book Collection</h1>
            <p className="text-lg text-gray-600">Discover amazing books from our catalog</p>
          </div>
          
          {/* Cart Icon */}
          <Link 
            href="/cart"
            className="relative bg-white rounded-full p-3 shadow-md hover:shadow-lg transition-shadow"
          >
            <svg 
              className="w-6 h-6 text-gray-700" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.1 5a1 1 0 01-1 1H3m2 0h2m0 0v2a1 1 0 001 1h1a1 1 0 001-1v-2m-4 0V9a1 1 0 011-1h2a1 1 0 011 1v4" 
              />
            </svg>
            
            {/* Item Count Badge */}
            {itemCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
                {itemCount}
              </span>
            )}
          </Link>
        </div>

        {books.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-xl text-gray-500">No books available at the moment.</p>
            <p className="text-gray-400 mt-2">Please check back later or contact support.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {books.map((book) => (
              <div key={book.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <div className="h-48 bg-gray-200 flex items-center justify-center">
                  {book.imageUrl ? (
                    <img 
                      src={book.imageUrl} 
                      alt={book.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-gray-400 text-center">
                      <svg className="w-12 h-12 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                      </svg>
                      <p className="text-sm">No Image</p>
                    </div>
                  )}
                </div>
                
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">{book.name}</h3>
                  
                  {book.description && (
                    <p className="text-gray-600 text-sm mb-3 line-clamp-3">{book.description}</p>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-green-600">
                      ${book.price.toFixed(2)}
                    </span>
                    
                    <button
                      onClick={() => handleAddToCart(book)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}