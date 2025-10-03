'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SearchComponent from '@/components/SearchComponent';
import { useState, useEffect, useMemo, useCallback } from 'react';
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
  const [error, setError] = useState<string | null>(null);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const { user } = useAuth();
  const { addToCart } = useCart();

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
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoadingBooks(false);
    }
  }, [selectedGenre]);

  // Optimized initial data loading
  useEffect(() => {
    const loadStoreData = async () => {
      if (selectedGenre) return; // Skip if genre is selected
      
      try {
        console.log('Loading initial store data...');
        
        const { categories: apiCategories, initialBooks } = await getInitialStoreData(categoryIds);
        
        // Update categories if we got valid data, otherwise keep fallback
        if (apiCategories && apiCategories.length > 0) {
          setCategories(apiCategories);
        }
        
        // Update books with initial data (no images yet)
        setBooksByCategory(initialBooks);
        setLoadingBooks(false);
        
        console.log('Initial store data loaded successfully, now loading images...');
        
        // Immediately load images for all books
        try {
          const booksWithImages = await loadImagesForCategories(initialBooks);
          setBooksByCategory(booksWithImages);
          console.log('Images loaded successfully');
        } catch (imageError) {
          console.warn('Failed to load images, books will display without images:', imageError);
        }
        
      } catch (error) {
        console.error('Failed to load store data:', error);
        // Fallback: try to fetch categories at least
        try {
          await fetchCategories();
        } catch (fallbackError) {
          console.warn('Categories fallback also failed:', fallbackError);
        }
        setLoadingBooks(false);
      }
    };
    
    loadStoreData();
  }, [selectedGenre]);

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
                {selectedBooks.length} book{selectedBooks.length !== 1 ? 's' : ''} found
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
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6 mb-8">
                  {paginationData.paginatedBooks.map((book: Book) => (
                    <div
                      key={book.id}
                      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer group"
                      onClick={() => setSelectedBook(book)}
                    >
                      <div className="h-48 bg-gray-200 flex items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-green-500 opacity-0 group-hover:opacity-20 transition-opacity duration-200 z-10"></div>
                        <BookImage book={book} />
                      </div>

                      <div className="p-3">
                        <h3 className="text-sm font-light text-gray-900 mb-2 line-clamp-2 min-h-[2.5rem]">
                          {book.name}
                        </h3>
                        <span className="text-sm text-green-600 font-bold block mb-2">
                          ${Number(book.price).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {paginationData.totalPages > 1 && (
                  <div className="flex justify-center items-center space-x-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={`px-3 py-2 rounded-md text-sm font-medium ${
                        currentPage === 1
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
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
                          className={`px-3 py-2 rounded-md text-sm font-medium ${
                            currentPage === pageNum
                              ? 'bg-blue-600 text-white'
                              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}

                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === paginationData.totalPages}
                      className={`px-3 py-2 rounded-md text-sm font-medium ${
                        currentPage === paginationData.totalPages
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
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
                      <div
                        key={book.id}
                        className="min-w-[200px] max-w-[200px] bg-white overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer group"
                        onClick={() => setSelectedBook(book)}
                      >
                        <div className=" h-50 bg-gray-200 flex items-center justify-center relative overflow-hidden">
                          <div className="absolute inset-0 bg-green-500 opacity-0 group-hover:opacity-20 transition-opacity duration-200 z-10"></div>
                          <BookImage book={book} />
                        </div>

                        <div className="p-3">
                          <h3 className="text-md font-normal text-gray-900 mb-1 line-clamp-2">
                            {book.name}
                          </h3>
                          <span className="text-sm text-green-600 font-bold">
                            ${Number(book.price).toFixed(2)}
                          </span>
                        </div>
                      </div>
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
                        priority={true} // Modal images should load immediately
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

                {/* Add to Cart Button */}
                <button
                  onClick={() => {
                    handleAddToCart(selectedBook);
                    setSelectedBook(null);
                  }}
                  className={`w-full px-6 py-3 rounded-lg text-lg font-medium transition-colors ${
                    user
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
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
