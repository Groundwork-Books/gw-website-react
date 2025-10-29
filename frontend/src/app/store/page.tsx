'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SearchComponent from '@/components/SearchComponent';
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useCart } from '@/lib/CartContext';
import { Book } from '@/lib/types';
import { 
  getCategories, 
  getBooksByCategory, 
  getInitialStoreData,
  loadImagesForCategories,
  Category
} from '@/lib/square';
import Image from 'next/image';
import { flyToCart } from '@/lib/flyToCart';
import BookCard from '@/components/BookCard';
import { useInventory, prefetchInventory } from '@/lib/useInventory';

// Read categories from env
const categoryIds = (process.env.NEXT_PUBLIC_CATEGORY_IDS || '').split(',').map(s => s.trim()).filter(Boolean);
const categoryNames = (process.env.NEXT_PUBLIC_CATEGORY_NAMES || '').split(',').map(s => s.trim()).filter(Boolean);

const fallbackCategories: Category[] = categoryIds.map((id, i) => ({
  id,
  name: categoryNames[i] || `Category ${i + 1}`,
}));

// Simple book image component (no lazy loading complexity)
function BookImage({ book }: { book: Book }) {
  return (
    <div className="relative w-full h-full">
      {book.imageUrl ? (
        <Image
          src={book.imageUrl}
          alt={book.name}
          fill={true}
          loading="lazy"
          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 16vw"
          className="object-cover"
        />
      ) : (
        <div className="text-gray-400 text-center flex items-center justify-center h-full">
          <div>
            <svg className="w-8 h-8 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
            </svg>
            <p className="text-xs">No Image</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BooksPage() {
  const [booksByCategory, setBooksByCategory] = useState<Record<string, Book[]>>({});
  const [categories, setCategories] = useState<{id: string, name: string}[]>(fallbackCategories); // Initialize with fallback categories
  const [selectedGenre, setSelectedGenre] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [booksPerPage] = useState(12); // Number of books per page for tile view
  const [loadingBooks, setLoadingBooks] = useState(true); // Start with books loading since we show skeleton immediately
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const { user } = useAuth();
  const { addToCart } = useCart();
  const modalImageRef = useRef<HTMLDivElement | null>(null);
  const { qty: invQty, loading: invLoading } = useInventory(selectedBook?.squareVariationId);
  const seededEdgesRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    if (!selectedBook) return;

    // If the cached book lacks variation id, fetch the fresh shape from Square
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
        .catch(() => {/* ignore; keep modal usable */});
    } else {
      // Warm the inventory cache for the opened modal item
      prefetchInventory([selectedBook.squareVariationId]);
    }

    return () => { cancelled = true; };
  }, [selectedBook?.id, selectedBook?.squareVariationId]);

  // Close modal on Escape key
  useEffect(() => {
    if (!selectedBook) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedBook(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedBook]);

  // Fetch books for selected genre (tile view)
  const fetchSelectedGenreBooks = useCallback(async () => {
    if (!selectedGenre) return;
    
    setLoadingBooks(true);
    try {
      const response = await getBooksByCategory(selectedGenre);
      setBooksByCategory(prev => ({ ...prev, [selectedGenre]: response.books }));
      
      // Immediately load images for the selected genre books
      try {
        const booksWithImages = await loadImagesForCategories({ [selectedGenre]: response.books });
        setBooksByCategory(prev => ({ ...prev, ...booksWithImages }));
      } catch (imageError) {
        console.warn('Failed to load images for selected genre:', imageError);
      }
    } catch (err) {
      console.error('Error fetching genre books:', err);
      // Error is logged but no longer displayed to user
    } finally {
      setLoadingBooks(false);
    }
  }, [selectedGenre]);

  // Ultra-fast store loading using super cache
  useEffect(() => {
    const loadStoreData = async () => {
      if (selectedGenre) return; // Skip if genre is selected
      
      try {
        console.log('Loading store data from super cache...');
        const startTime = Date.now();
        
        const response = await fetch('/api/store/super-cache');
        if (!response.ok) {
          throw new Error(`Super cache failed: ${response.status}`);
        }
        
        const data = await response.json();
        const loadTime = Date.now() - startTime;
        const cacheStatus = response.headers.get('X-Cache-Status');
        
        console.log(`Super cache loaded in ${loadTime}ms (${cacheStatus}):`, {
          categories: data.categories?.length || 0,
          books: data.metadata?.totalBooks || 0,
          images: data.metadata?.imagesCount || 0,
          cached: data.metadata?.cacheInfo?.cached
        });
        
        // Update categories if we got valid data, otherwise keep fallback
        if (data.categories && data.categories.length > 0) {
          setCategories(data.categories);
        }
        
        // Update books - they should already have images if cache is populated
        if (data.defaultBooks && Object.keys(data.defaultBooks).length > 0) {
          setBooksByCategory(data.defaultBooks);
        } else if (!data.metadata?.cacheInfo?.cached) {
          // If cache wasn't populated, use original method and then populate cache
          console.log('Super cache not populated, loading with original method...');
          
          try {
            const { categories: apiCategories, initialBooks } = await getInitialStoreData(categoryIds);
            
            if (apiCategories && apiCategories.length > 0) {
              setCategories(apiCategories);
            }
            
            setBooksByCategory(initialBooks);
            
            // Load images separately
            try {
              const booksWithImages = await loadImagesForCategories(initialBooks);
              setBooksByCategory(booksWithImages);
              
              // Now populate the super cache with the loaded data
              console.log('Populating super cache with loaded data...');
              
              // Extract image URLs from loaded books
              const imageUrls: Record<string, string> = {};
              Object.values(booksWithImages).flat().forEach(book => {
                if (book.imageId && book.imageUrl) {
                  imageUrls[book.imageId] = book.imageUrl;
                }
              });
              
              // Populate the super cache in the background
              fetch('/api/store/super-cache', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  storeData: {
                    categories: apiCategories,
                    defaultBooks: booksWithImages,
                    imageUrls
                  }
                }),
              }).then(response => {
                if (response.ok) {
                  console.log('Super cache populated successfully with loaded data');
                } else {
                  console.warn('Failed to populate super cache:', response.status);
                }
              }).catch(err => {
                console.warn('Background super cache population failed:', err);
              });
              
            } catch (imageError) {
              console.warn('Failed to load images in fallback:', imageError);
              
              // Still try to populate cache without images
              const imageUrls: Record<string, string> = {};
              fetch('/api/store/super-cache', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  storeData: {
                    categories: apiCategories,
                    defaultBooks: initialBooks,
                    imageUrls
                  }
                }),
              }).catch(err => {
                console.warn('Background super cache population failed:', err);
              });
            }
            
          } catch (fallbackError) {
            console.error('Original method also failed:', fallbackError);
            
            // Final fallback: try to fetch categories at least
            try {
              await fetchCategories();
            } catch (categoriesError) {
              console.warn('Categories fallback also failed:', categoriesError);
            }
          }
        }
        
        setLoadingBooks(false);
        console.log('Store data loaded successfully');
        
      } catch (error) {
        console.error('Super cache failed, falling back to original method:', error);
        
        // Fallback to original loading method
        try {
          console.log('Loading store data with original method...');
          
          const { categories: apiCategories, initialBooks } = await getInitialStoreData(categoryIds);
          
          if (apiCategories && apiCategories.length > 0) {
            setCategories(apiCategories);
          }
          
          setBooksByCategory(initialBooks);
          
          // Load images separately
          try {
            const booksWithImages = await loadImagesForCategories(initialBooks);
            setBooksByCategory(booksWithImages);
            
            // Populate super cache with the successfully loaded data
            console.log('Populating super cache with fallback data...');
            
            const imageUrls: Record<string, string> = {};
            Object.values(booksWithImages).flat().forEach(book => {
              if (book.imageId && book.imageUrl) {
                imageUrls[book.imageId] = book.imageUrl;
              }
            });
            
            fetch('/api/store/super-cache', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                storeData: {
                  categories: apiCategories,
                  defaultBooks: booksWithImages,
                  imageUrls
                }
              }),
            }).then(response => {
              if (response.ok) {
                console.log('Super cache populated from fallback data');
              } else {
                console.warn('Failed to populate super cache from fallback');
              }
            }).catch(err => {
              console.warn('Background cache population from fallback failed:', err);
            });
            
          } catch (imageError) {
            console.warn('Failed to load images in fallback:', imageError);
          }
          
        } catch (fallbackError) {
          console.error('Both super cache and original method failed:', fallbackError);
          
          // Final fallback: try to fetch categories at least
          try {
            await fetchCategories();
          } catch (categoriesError) {
            console.warn('Categories fallback also failed:', categoriesError);
          }
        }
        
        setLoadingBooks(false);
      }
    };
    
    loadStoreData();
  }, [selectedGenre]);

  // Prefetch inventory for visible carousels when books load on the homepage view, per-category group
  useEffect(() => {
    if (selectedGenre) return;
    for (const id of categoryIds) {
      const books = (booksByCategory[id] || []).slice(0, 30);
      const ids = books.map(b => b.squareVariationId).filter(Boolean) as string[];
      if (ids.length) prefetchInventory(ids, id);
    }
  }, [booksByCategory, selectedGenre]);

  // Edge seeding: ensure top and bottom carousels get prefetched even if not intersecting yet, grouped
  useEffect(() => {
    if (selectedGenre) return;
    if (seededEdgesRef.current) return;
    const displayCategories = (categories.length > 0 ? categories : fallbackCategories).filter(cat => categoryIds.includes(cat.id));
    if (displayCategories.length === 0) return;

    const first = displayCategories[0];
    const last = displayCategories[displayCategories.length - 1];

    const firstBooks = (booksByCategory[first.id] || []).slice(0, 12);
    const lastBooks = (booksByCategory[last.id] || []).slice(-12);

    const firstIds = firstBooks.map(b => b.squareVariationId).filter(Boolean) as string[];
    const lastIds = lastBooks.map(b => b.squareVariationId).filter(Boolean) as string[];

    if (firstIds.length) prefetchInventory(firstIds, first.id);
    if (lastIds.length) prefetchInventory(lastIds, last.id);

    if (firstIds.length || lastIds.length) seededEdgesRef.current = true;
  }, [booksByCategory, categories, selectedGenre]);

  // Prefetch inventory for the current page in the tile grid, grouped by selectedGenre
  useEffect(() => {
    if (!selectedGenre) return;
    const books = booksByCategory[selectedGenre] || [];
    const startIndex = (currentPage - 1) * booksPerPage;
    const pageBooks = books.slice(startIndex, startIndex + booksPerPage);
    const ids = pageBooks.map(b => b.squareVariationId).filter(Boolean) as string[];
    if (ids.length) prefetchInventory(ids, selectedGenre);
  }, [selectedGenre, booksByCategory, currentPage, booksPerPage]);

  // Fetch book data only when categories are loaded and user selects a genre
  useEffect(() => {
    if (categories.length > 0 && selectedGenre) {
      fetchSelectedGenreBooks();
    }
  }, [selectedGenre, categories, fetchSelectedGenreBooks]);

  const fetchCategories = async () => {
    try {
      const data = await getCategories();
      // Only update categories if we got valid data, otherwise keep fallback categories
      if (data && Array.isArray(data) && data.length > 0) {
        setCategories(data);
      } else {
        console.warn('No categories returned from Square API, using fallback categories');
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
      // Don't set error state or override categories - just log the error and keep fallback categories
      console.warn('Failed to fetch categories from Square API, using fallback categories');
    }
  };

  // Memoize expensive calculations to prevent unnecessary recalculations
  const selectedBooks = useMemo(() => {
    if (!selectedGenre) return [];
    return booksByCategory[selectedGenre] || [];
  }, [selectedGenre, booksByCategory]);

  const categoriesToDisplay = useMemo(() => {
    if (selectedGenre) {
      // If a genre is selected, return empty array (we'll show tile view instead)
      return [];
    }
    // Always show categories from env, even if API fails - this ensures skeleton always shows
    const displayCategories = categories.length > 0 ? categories : fallbackCategories;
    return displayCategories.filter(cat => categoryIds.includes(cat.id));
  }, [selectedGenre, categories]);

  // Memoize pagination calculations
  const paginationData = useMemo(() => {
    const totalPages = Math.ceil(selectedBooks.length / booksPerPage);
    const startIndex = (currentPage - 1) * booksPerPage;
    const paginatedBooks = selectedBooks.slice(startIndex, startIndex + booksPerPage);
    
    return {
      totalPages,
      startIndex,
      paginatedBooks
    };
  }, [selectedBooks, currentPage, booksPerPage]);

  // Memoize event handlers to prevent unnecessary re-renders
  const handleAddToCart = useCallback((book: Book) => {
    if (!user) {
      // More elegant redirect - no confirm dialog needed
      window.location.href = `/login?redirect=${encodeURIComponent('/store')}&message=${encodeURIComponent('Please log in to add items to your cart')}`;
      return;
    }
    addToCart(book);
  }, [user, addToCart]);

  const handleGenreChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedGenre(event.target.value);
    setCurrentPage(1); // Reset to first page when genre changes
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="min-h-screen bg-gw-white">
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
                placeholder="Search books...(powered by some cool AI)"
                className="w-full"
              />
            </div>

            {/* Genre Dropdown */}
            <div className="relative w-36">
              <select
                className="appearance-none px-4 py-3 pr-10 rounded-full focus:outline-none focus:ring-0 bg-gw-green-2 text-gray-900 w-full"
                value={selectedGenre}
                onChange={handleGenreChange}
              >
                <option value="">Genre</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {/* Custom dropdown arrow */}
              <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center">
                <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Carousels or Tile Grid */}
      <div className="p-6">
        {selectedGenre ? (
          // Tile grid view for selected genre
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl text-gw-green-1 font-calluna font-bold">
                {categories.find(cat => cat.id === selectedGenre)?.name || 'Selected Genre'}
              </h2>
              <p className="text-gray-600">
                {selectedBooks.length} book{selectedBooks.length !== 1 ? 's' : ''}
              </p>
            </div>

            {loadingBooks ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gw-green-1 mb-4"></div>
                  <p className="text-gray-600">Loading books...</p>
                </div>
              </div>
            ) : paginationData.paginatedBooks.length === 0 ? (
              <p className="text-gray-500 text-center py-12">No books available in this genre.</p>
            ) : (
              <>
                {/* Books Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
                  {paginationData.paginatedBooks.map((book: Book) => (
                    <BookCard
                      key={book.id}
                      book={book}
                      onClick={() => setSelectedBook(book)}
                      fixedWidth
                    />
                  ))}
                </div>

                {/* Pagination */}
                {paginationData.totalPages > 1 && (
                  <div className="flex justify-center items-center space-x-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={`px-3 py-2 rounded-full text-sm font-medium hover:cursor-pointer ${
                        currentPage === 1
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gw-green-2'
                      }`}
                    >
                      Previous
                    </button>

                    {/* Page numbers */}
                    {Array.from({ length: Math.min(paginationData.totalPages, 5) }, (_, i) => {
                      let pageNum;
                      if (paginationData.totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= paginationData.totalPages - 2) {
                        pageNum = paginationData.totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`px-3 py-2 rounded-full text-sm font-medium hover:cursor-pointer ${
                            currentPage === pageNum
                              ? 'bg-gw-green-1 text-white'
                              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gw-green-2'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}

                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === paginationData.totalPages}
                      className={`px-3 py-2 rounded-full text-sm font-medium hover:cursor-pointer ${
                        currentPage === paginationData.totalPages
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gw-green-2'
                      }`}
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          // Carousel view for no genre selected
          loadingBooks ? (
            // Show skeleton carousels while loading
            <div className="space-y-12">
              {[1, 2, 3].map((skeleton) => (
                <div key={skeleton} className="mb-12">
                  <div className="h-8 bg-gray-200 rounded w-48 mb-4 animate-pulse"></div>
                  <div className="flex overflow-x-auto space-x-4 pb-2">
                    {[1, 2, 3, 4, 5, 6].map((item) => (
                      <div key={item} className="min-w-[200px] max-w-[200px] bg-white rounded-lg overflow-hidden animate-pulse">
                        <div className="h-50 bg-gray-200"></div>
                        <div className="p-4">
                          <div className="h-4 bg-gray-200 rounded mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-2/3 mb-2"></div>
                          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            categoriesToDisplay.map((cat: {id: string, name: string}) => {
              const books = (booksByCategory[cat.id] || []).slice(0, 20);
              return (
                <div key={cat.id} className="mb-12">
                  <h2 className="text-2xl text-gw-green-1 font-calluna font-bold mb-4">{cat.name}</h2>
                  {books.length === 0 ? (
                    <div className="flex items-center justify-center py-12 text-gray-500">
                      <div className="text-center">
                        <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-gray-300 mb-2"></div>
                        <p>Loading {cat.name.toLowerCase()}...</p>
                      </div>
                    </div>
                  ) : (
                  <div className="flex overflow-x-auto space-x-4 pb-2">
                    {books.map((book) => (
                      <BookCard
                        key={book.id}
                        book={book}
                        onClick={() => setSelectedBook(book)}
                        fixedWidth
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })
          )
        )}
      </div>

      {/* Book Modal */}
      {selectedBook && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={(e) => {
              // only close if the actual overlay was clicked, not a child
              if (e.target === e.currentTarget) setSelectedBook(null);
            }}>
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

                  {/* If Square isn't tracking inventory → show Available (like the Square UI) */}
                  {!invLoading && selectedBook?.inventoryTracked === false && (
                    <span className="text-gw-green-1">Available</span>
                  )}

                  {/* Tracked items: use numeric logic */}
                  {!invLoading && selectedBook?.inventoryTracked !== false && invQty != null && invQty > 5 && (
                    <span className="text-gw-green-1">In stock</span>
                  )}
                  {!invLoading && selectedBook?.inventoryTracked !== false && invQty != null && invQty > 0 && invQty <= 5 && (
                    <span className="text-amber-600">Low stock: ({invQty} left)</span>
                  )}
                  {!invLoading && selectedBook?.inventoryTracked !== false && invQty === 0 && (
                    <span className="text-red-600">Out of stock</span>
                  )}
                  {!invLoading && selectedBook?.inventoryTracked !== false && invQty == null && (
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
                  <p className="text-gray-700 text-sm mb-6 leading-relaxed">
                    {selectedBook.description}
                  </p>
                )}

                {/* Add to Cart Button */}
                <button
                  onClick={(e) => {
                    if (user && selectedBook) {
                      addToCart(selectedBook);
                      // Works across all browsers, ignores OS reduced-motion for this tiny affordance:
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
