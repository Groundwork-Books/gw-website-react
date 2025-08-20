'use client';

import Header from '@/components/Header';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useCart } from '@/lib/CartContext';
import { Book } from '@/lib/types';
import Link from 'next/link';

// Read categories from env
const categoryIds = (process.env.NEXT_PUBLIC_CATEGORY_IDS || '').split(',').map(s => s.trim());
const categoryNames = (process.env.NEXT_PUBLIC_CATEGORY_NAMES || '').split(',').map(s => s.trim());

const categories = categoryIds.map((id, i) => ({
  id,
  name: categoryNames[i] || `Category ${i + 1}`,
}));

export default function BooksPage() {
  const [booksByCategory, setBooksByCategory] = useState<Record<string, Book[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { addToCart } = useCart();

  useEffect(() => {
    fetchAllCategories();
  }, []);

  const fetchAllCategories = async () => {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

    const promises = categories.map(async (cat) => {
      const response = await fetch(`${apiUrl}/api/books/categorycarousel/${cat.id}`);
      if (!response.ok) {
        throw new Error(`Response ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      return { id: cat.id, books: data as Book[] };
    });

    const resultsArray = await Promise.all(promises);

    const results: Record<string, Book[]> = {};
    for (const { id, books } of resultsArray) {
      results[id] = books;
    }

    // Test: Check if any books have valid imageUrl
    const allBooks = Object.values(results).flat();
    const booksWithImages = allBooks.filter(book => book.imageUrl);
    console.log(`Frontend: Found ${booksWithImages.length} books with imageUrl out of ${allBooks.length} total books`);
    if (booksWithImages.length > 0) {
      console.log('Sample book with image:', booksWithImages[0].name, 'imageUrl:', booksWithImages[0].imageUrl);
    }

    setBooksByCategory(results);
  } catch (err) {
    setError(err instanceof Error ? err.message : 'An error occurred');
  } finally {
    setLoading(false);
  }
};

  const handleAddToCart = (book: Book) => {
    if (!user) {
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
    <div className="min-h-screen bg-gw-white">
      {/* Header */}
      <Header />

      {/* Hero Section */}
      <section className="relative h-72 bg-gw-black flex items-center justify-center">
        {/* Background collage */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/40 z-10"></div>
        <div className="absolute inset-0">
          <img 
            src="/images/hero/book-collage.jpg" 
            alt="Book collage background"
            className="w-full h-full object-cover opacity-60"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              target.nextElementSibling?.classList.remove('hidden');
            }}
          />
          <div className="hidden w-full h-full bg-gray-600 flex items-center justify-center">
            <span className="text-white text-lg">Add book-collage.jpg to /public/images/hero/</span>
          </div>
        </div>
      </section>

      {/* Carousels */}
      <div className="p-6">
        {categories.map((cat) => {
          const books = (booksByCategory[cat.id] || []).slice(0, 20);
          return (
            <div key={cat.id} className="mb-12">
              <h2 className="text-2xl font-bold mb-4">{cat.name}</h2>
              {books.length === 0 ? (
                <p className="text-gray-500">No books available in this category.</p>
              ) : (
                <div className="flex overflow-x-auto space-x-4 pb-2">
                  {books.map((book) => (
                    <div
                      key={book.id}
                      className="min-w-[200px] max-w-[200px] bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                    >
                      <div className="h-40 bg-gray-200 flex items-center justify-center">
                        {book.imageUrl ? (
                          <img
                            src={book.imageUrl}
                            alt={book.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="text-gray-400 text-center">
                            <svg
                              className="w-8 h-8 mx-auto mb-2"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                                clipRule="evenodd"
                              />
                            </svg>
                            <p className="text-sm">No Image</p>
                          </div>
                        )}
                      </div>

                      <div className="p-3">
                        <h3 className="text-md font-semibold text-gray-900 mb-1 line-clamp-2">
                          {book.name}
                        </h3>
                        <span className="text-sm text-green-600 font-bold">
                          ${Number(book.price).toFixed(2)}
                        </span>

                        <button
                          onClick={() => handleAddToCart(book)}
                          className="mt-2 w-full bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md text-sm font-medium transition-colors"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
