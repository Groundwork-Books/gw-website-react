'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import SearchComponent from '@/components/SearchComponent';
import { useAuth } from '@/lib/AuthContext';
import { useCart } from '@/lib/CartContext';
import { Book } from '@/lib/types';
import Image from 'next/image';

interface SearchResult extends Book {
  score?: number;
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
    alert(`Added "${book.name}" to cart!`);
  };

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      const response = await fetch(`${apiUrl}/api/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: searchQuery,
          limit: 20,
          namespace: "default"
        }),
      });

      const data: SearchResponse = await response.json();

      if (data.success) {
        setResults(data.results);
      } else {
        setError(data.error || 'Search failed');
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
    <div className="min-h-screen bg-gw-white">
      {/* Header */}
      <Header />

      {/* Hero Section */}
      <section className="relative h-72 bg-gw-black flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/40 z-10"></div>
        <div className="absolute inset-0">
          <Image 
            src="/images/hero/book-collage.jpg" 
            alt="Search books background"
            fill={true}
            sizes="100vw"
            className="object-cover opacity-60"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              target.nextElementSibling?.classList.remove('hidden');
            }}
          />
          <div className="hidden w-full h-full bg-gray-600 items-center justify-center">
            <span className="text-white text-lg">Add book-collage.jpg to /public/images/hero/</span>
          </div>
        </div>
        
        {/* Hero Content */}
        <div className="relative z-20 text-center text-white px-4">
          <h1 className="text-4xl md:text-5xl font-calluna font-black mb-4">Search Our Collection</h1>
          <p className="text-xl mb-8 opacity-90">Find your next great read</p>
          
          {/* Search Component */}
          <div className="max-w-2xl mx-auto">
            <SearchComponent 
              onSearch={handleSearch}
              placeholder="Search for books by title, author, description..."
              className="bg-white/10 backdrop-blur-sm rounded-lg p-4"
            />
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="p-6">
        {/* Search Status */}
        {loading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gw-green-1"></div>
            <p className="mt-2 text-gray-600">Searching books...</p>
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
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="h-48 bg-gray-200 flex items-center justify-center">
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

                    <button
                      onClick={() => handleAddToCart(book)}
                      className={`w-full px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        user 
                          ? 'bg-gw-green-1 hover:bg-gw-green-1/90 text-white' 
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300'
                      }`}
                    >
                      {user ? 'Add to Cart' : 'Login to Purchase'}
                    </button>
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
