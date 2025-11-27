'use client';

import { useState, useEffect, Suspense, useRef } from 'react';
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
import BookCard from '@/components/BookCard';
import { useInventory, prefetchInventory, getCachedInventory } from '@/lib/useInventory';
import { flyToCart } from '@/lib/flyToCart';

// Batch inventory lookup for filtering
async function fetchInventoryMap(ids: string[]): Promise<{ qty: Record<string, number>; tracked: Record<string, boolean> }> {
  const variationIds = Array.from(new Set(ids.filter(Boolean)));
  if (variationIds.length === 0) return { qty: {}, tracked: {} };
  const qty: Record<string, number> = {};
  const tracked: Record<string, boolean> = {};

  // kick off background batched inventory fetch for these ids
  prefetchInventory(variationIds, 'search-filter');

  // fill from cache if available, without blocking on network
  for (const id of variationIds) {
    const cached = getCachedInventory(id);
    if (typeof cached === 'number') {
      qty[id] = cached;
    } else if (cached === null) {
      qty[id] = 0;
    }
  }

  return { qty, tracked: tracked };
}

interface SearchResult extends Book {
  searchScore?: number;
  searchSnippet?: string;
  score?: number; // Keep for backward compatibility
}

async function ensureVariationIds(books: Book[]): Promise<Book[]> {
  const missing = books.filter(b => !b.squareVariationId).map(b => b.id);
  if (missing.length === 0) return books;
  try {
    const r = await fetch('/api/square/books/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookIds: missing }),
    });
    if (!r.ok) return books;
    const d = await r.json();
    const byId = new Map<string, Book>((d?.books || []).map((bk: Book) => [bk.id, bk]));
    return books.map(b => byId.get(b.id) ? { ...b, ...byId.get(b.id)! } : b);
  } catch {
    return books;
  }
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

  // fly-to-cart animation and inventory
  const modalImageRef = useRef<HTMLDivElement | null>(null);
  const { qty: invQty, loading: invLoading } = useInventory(selectedBook?.squareVariationId);

  // Inventory logic
  useEffect(() => {
    let cancelled = false;
    if (!selectedBook) return;
    if (!selectedBook.squareVariationId) {
      fetch('/api/square/books/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookIds: [selectedBook.id] }),
      })
        .then(r => r.json())
        .then(d => {
          const enriched = d?.books?.[0];
          if (!cancelled && enriched?.squareVariationId) {
            setSelectedBook(prev => (prev ? { ...prev, ...enriched } : prev));
          }
        })
        .catch(() => { /* ignore; keep modal usable */ });
    } else {
      prefetchInventory([selectedBook.squareVariationId]);
    }
    return () => { cancelled = true; };
  }, [selectedBook?.id, selectedBook?.squareVariationId]);

  // close modal on Escape
  useEffect(() => {
    if (!selectedBook) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedBook(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedBook]);

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
      const data = await searchBooks(searchQuery, 100);

      if (data.success) {
        // Convert searchScore to score for compatibility
        const base = (data.results || []) as SearchResult[];
        const resultsWithScore = base.map(result => ({
          ...result,
          score: result.searchScore
        }));
        const enriched = await ensureVariationIds(resultsWithScore);
        const ids = enriched.map(b => b.squareVariationId).filter(Boolean) as string[];
        const inv = await fetchInventoryMap(ids);

        const filtered = enriched.filter(b => {
          const id = b.squareVariationId
          if (!id) return true
          const isTracked = inv.tracked[id]
          if (isTracked === true) {
            const q = inv.qty[id]
            const n = typeof q === 'number' ? q : 0
            return n > 0
          }
          if (b.inventoryTracked === false) return true
          return true
        });
        
        setResults(filtered);

        // Warm inventory for the first screenful of results
        const warmIds = filtered.slice(0, 24).map(b => b.squareVariationId).filter(Boolean) as string[];
        if (warmIds.length) prefetchInventory(warmIds);
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

  return (
    <div className="min-h-screen bg-gw-white flex flex-col">
      {/* Header */}
      <Header />

      {/* Hero Section */}
      <section className="relative h-[200px] flex items-center justify-center isolate">
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
        <div className="absolute inset-0 " />
        <div className="relative z-10 w-full px-4">
          <div className="mx-auto max-w-3xl bg-white/90 py-10 px-6 md:px-12 text-center">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {results.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  onClick={() => setSelectedBook(book)}
                  fixedWidth
                />
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
                className="inline-block bg-gw-green-1 text-white px-12 py-3 rounded-full font-calluna hover:bg-gw-green-1/90 transition-colors"
              >
                View All Books
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Book Modal */}
      {selectedBook && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedBook(null);
          }}
        >
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-xl font-bold text-gray-900">Book Details</h2>
              <button
                onClick={() => setSelectedBook(null)}
                className="text-gray-400 hover:text-gray-600 hover:cursor-pointer text-2xl font-bold"
              >
                ×
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4">
              <div className="flex flex-col items-center text-center">
                {/* Book Image */}
                <div
                  ref={modalImageRef}
                  data-book-image
                  className="relative w-48 h-64 rounded-lg overflow-hidden mb-4"
                >
                  {selectedBook.imageUrl ? (
                    <Image
                      src={selectedBook.imageUrl}
                      alt={selectedBook.name}
                      fill={true}
                      priority={true}
                      sizes="192px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
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
                    </div>
                  )}
                </div>

                {/* Inventory Status */}
                <div className="mt-2">
                  {invLoading && (
                    <span className="inline-block text-gw-green-1 align-middle">
                      <span
                        className="inline-block w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent"
                        aria-hidden="true"
                      />
                      <span className="sr-only">Checking availability</span>
                    </span>
                  )}

                  {!invLoading && typeof invQty === 'number' && invQty > 5 && (
                    <span className="text-gw-green-1">In stock</span>
                  )}

                  {!invLoading && typeof invQty === 'number' && invQty > 0 && invQty <= 5 && (
                    <span className="text-amber-600">Low stock: ({invQty} left)</span>
                  )}

                  {!invLoading && typeof invQty === 'number' && invQty <= 0 && (
                    <span className="text-red-600">Out of stock</span>
                  )}

                  {!invLoading && typeof invQty !== 'number' && selectedBook?.inventoryTracked === false && (
                    <span className="text-gw-green-1">Available</span>
                  )}

                  {!invLoading && typeof invQty !== 'number' && selectedBook?.inventoryTracked !== false && (
                    <span className="text-gray-600">Availability unavailable</span>
                  )}
                </div>

                {/* Book Info */}
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {selectedBook.name}
                </h3>

                <p className="text-2xl text-gw-green-1 font-bold mb-4">
                  ${Number(selectedBook.price).toFixed(2)}
                </p>

                {selectedBook.description && (
                  <p className="text-gray-700 text-sm mb-4 leading-relaxed">
                    {selectedBook.description}
                  </p>
                )}

                {/* % Match chip — search-only */}
                {(selectedBook as SearchResult).score ? (
                  <div className="mb-4">
                    <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                      {((selectedBook as SearchResult).score! * 100).toFixed(0)}% match
                    </span>
                  </div>
                ) : null}

                {/* Add to Cart Button */}
                <button
                  onClick={(e) => {
                    if (user && selectedBook) {
                      addToCart(selectedBook);
                      const wrap = modalImageRef.current || (e.currentTarget as HTMLElement);
                      const imgEl = wrap.querySelector('img') as HTMLImageElement | null;
                      flyToCart(e.currentTarget as HTMLElement, {
                        startSizeFromEl: wrap,
                        endSizeFromEl: (document.querySelector('#cart-icon-anchor svg') as HTMLElement) || undefined,
                        ghostImageSrc: imgEl?.currentSrc || imgEl?.src || selectedBook.imageUrl,
                        ignoreReducedMotion: true
                      });
                    } else {
                      handleAddToCart(selectedBook!);
                    }
                    setSelectedBook(null);
                  }}
                  className={`w-full px-6 py-3 rounded-full text-lg font-medium transition-colors ${
                    user
                      ? 'bg-gw-green-1 hover:cursor-pointer text-white'
                      : 'bg-gw-green-2 hover:cursor-pointer text-gray-700 border border-gray-300'
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
