'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SearchComponent from '@/components/SearchComponent';
import { useAuth } from '@/lib/AuthContext';
import { useCart } from '@/lib/CartContext';
import { Book } from '@/lib/types';
import { searchBooks } from '@/lib/api';
import Image from 'next/image';

interface SearchResult extends Book {
  searchScore?: number;
  searchSnippet?: string;
  score?: number; // Keep for backward compatibility
}

interface SearchResponse {
  success: boolean;
  query: string;
  results: SearchResult[];
  total: number;
  error?: string;
}

function SearchPageContent() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const { user } = useAuth();
  const { addToCart } = useCart();

  // Get query from URL parameters on component mount
  useEffect(() => {
    const urlQuery = searchParams.get('q');
    if (urlQuery) {
      setQuery(urlQuery);
      performSearch(urlQuery);
    }
  }, [searchParams]);

  const handleAddToCart = (book: Book) => {
    if (!user) {
      window.location.href = `/login?redirect=${encodeURIComponent('/search')}${query ? `?q=${encodeURIComponent(query)}` : ''}&message=${encodeURIComponent('Please log in to add items to your cart')}`;
      return;
    }
    addToCart(book);
  };

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const data = await searchBooks(searchQuery, 30);

      if (data.success) {
        // Convert searchScore to score for compatibility
        const resultsWithScore = data.results.map(result => ({
          ...result,
          score: result.searchScore
        }));
        setResults(resultsWithScore);
      } else {
        setError('Search failed');
        setResults([]);
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to search books. Please try again.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (newQuery: string) => {
    setQuery(newQuery);
    performSearch(newQuery);

    // Update URL without page reload
    const url = new URL(window.location.href);
    url.searchParams.set('q', newQuery);
    window.history.pushState({}, '', url.toString());
  };

  return (
    <div className="min-h-screen bg-gw-white flex flex-col">
      {/* Header */}
      <Header />

      {/* Hero Section (full-bleed) */}
        <section className="relative h-[200px] flex items-center justify-center isolate">
          {/* Background image */}
          <div className="rounded-lg overflow-hidden">
            <Image
              src="/images/hero/book-collage.jpg"
              alt="Book collage background"
              fill
              className="object-cover"
              priority
              sizes="100vw"
            />
          </div>
          {/* Optional overlay for readability */}
          <div className="absolute inset-0 " />

          {/* Content */}
          <div className="relative z-10 w-full px-4">
            <div className="mx-auto max-w-3xl bg-white/90 py-10 px-6 md:px-12  text-center">
              <h1 className="font-calluna font-black text-4xl md:text-5xl lg:text-[56px] leading-[110%] text-gw-green-1">
                Bookstore Selection
              </h1>
            </div>
          </div>
        </section>


{/* Search Section */}
      <section className=" py-6">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex gap-4 items-center">
            {/* Search Input */}
            <div className="flex-1">
              <SearchComponent
                placeholder="Search for books ... by title, author, content."
                className="w-full"
              />
            </div>
            {/* Back to Store Button */}
            <Link
              href="/store"
              className="relative w-48 appearance-none px-4 py-3 pr-10 rounded-full focus:outline-none focus:ring-0 bg-gw-green-2 text-gray-900 flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Store
            </Link>

          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="p-6 pb-20 flex-1">
        {/* Search Status */}
        {loading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gw-green-1"></div>
            <p className="mt-2 text-gray-600">Searching</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 max-w-4xl mx-auto">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Search Results Header */}
        {hasSearched && !loading && !error && (
          <div className="mb-6 max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900">
              {results.length > 0
                ? `Found ${results.length} book${results.length !== 1 ? 's' : ''} for "${query}"`
                : `No books found for "${query}"`
              }
            </h2>
          </div>
        )}

        {/* Results Grid */}
        {results.length > 0 && (
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {results.map((book) => (
                <div
                  key={book.id}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer group"
                  onClick={() => setSelectedBook(book)}
                >
                  <div className="h-48 bg-gray-200 flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-green-500 opacity-0 group-hover:opacity-20 transition-opacity duration-200 z-10"></div>
                    {book.imageUrl ? (
                      <div className="relative w-full h-full">
                        <Image
                          src={book.imageUrl}
                          alt={book.name}
                          fill={true}
                          sizes="300px"
                          className="object-cover"
                        />
                      </div>
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

                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                      {book.name}
                    </h3>

                    {book.description && (
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {book.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between mb-3">
                      <span className="text-lg text-gw-green-1 font-bold">
                        ${Number(book.price).toFixed(2)}
                      </span>
                      {book.score && (
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {(book.score * 100).toFixed(0)}% match
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No Results */}
        {hasSearched && !loading && !error && results.length === 0 && (
          <div className="text-center py-12 max-w-2xl mx-auto">
            <div className="text-gray-500 text-xl mb-4">
              No books found for your search.
            </div>
            <p className="text-gray-400 mb-6">
              Try different keywords or browse our store instead.
            </p>
            <Link
              href="/store"
              className="inline-block bg-gw-green-1 text-white px-6 py-3 rounded-lg hover:bg-gw-green-1/90 transition-colors"
            >
              Browse Our Collection
            </Link>
          </div>
        )}

        {/* Initial State */}
        {!hasSearched && !loading && (
          <div className="text-center py-12 max-w-2xl mx-auto">
            <div className="text-gray-500 text-xl mb-4">
              Enter a search term to find books
            </div>
            <p className="text-gray-400 mb-6">
              Search by title, author, description, or any keywords.
            </p>
            <div className="space-y-4">
              <p className="text-sm text-gray-500">Or browse our categories:</p>
              <Link
                href="/store"
                className="inline-block bg-gw-green-1 text-white px-6 py-3 rounded-lg hover:bg-gw-green-1/90 transition-colors"
              >
                View All Books
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Book Modal */}
      {selectedBook && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-xl font-bold text-gray-900">Book Details</h2>
              <button
                onClick={() => setSelectedBook(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4">
              <div className="flex flex-col items-center text-center">
                {/* Book Image */}
                <div className="w-48 h-64 bg-gray-200 rounded-lg flex items-center justify-center mb-4">
                  {selectedBook.imageUrl ? (
                    <div className="relative w-full h-full">
                      <Image
                        src={selectedBook.imageUrl}
                        alt={selectedBook.name}
                        fill={true}
                        sizes="192px"
                        className="object-cover rounded-lg"
                      />
                    </div>
                  ) : (
                    <div className="text-gray-400 text-center">
                      <svg
                        className="w-16 h-16 mx-auto mb-2"
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

                {/* Book Info */}
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {selectedBook.name}
                </h3>

                <p className="text-2xl text-green-600 font-bold mb-4">
                  ${Number(selectedBook.price).toFixed(2)}
                </p>

                {selectedBook.description && (
                  <p className="text-gray-700 text-sm mb-6 leading-relaxed">
                    {selectedBook.description}
                  </p>
                )}

                {/* Match Score for Search Results */}
                {(selectedBook as SearchResult).score && (
                  <div className="mb-4">
                    <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                      {((selectedBook as SearchResult).score! * 100).toFixed(0)}% match
                    </span>
                  </div>
                )}

                {/* Add to Cart Button */}
                <button
                  onClick={() => {
                    handleAddToCart(selectedBook);
                    setSelectedBook(null);
                  }}
                  className={`w-full px-6 py-3 rounded-lg text-lg font-medium transition-colors ${
                    user
                      ? 'bg-gw-green-1 hover:bg-gw-green-1/90 text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300'
                  }`}
                >
                  {user ? 'Add to Cart' : 'Login to Purchase'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    }>
      <SearchPageContent />
    </Suspense>
  );
}
