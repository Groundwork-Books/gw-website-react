'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface SearchComponentProps {
  onSearch?: (query: string) => void;
  placeholder?: string;
  className?: string;
}

export default function SearchComponent({ 
  onSearch, 
  placeholder = "Search books...(powered by some cool AI)", 
  className = "" 
}: SearchComponentProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (query.trim()) {
      if (onSearch) {
        // If onSearch prop is provided, use it (for inline search)
        onSearch(query.trim());
      } else {
        // Otherwise, navigate to search results page
        router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`flex gap-2 ${className}`}>
      <div className="relative flex-1">
        <input
          ref={inputRef}
          // (Option A) keep type="text" and use the custom clear button below
          type="text"
          // (Option B) use type="search" for native WebKit clear button:
          // type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full px-4 pr-10 py-3 rounded-full focus:outline-none focus:ring-0 bg-gw-green-2 text-gray-900 placeholder-gray-500"
        />

        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              // put cursor back in the box
              inputRef.current?.focus();
            }}
            aria-label="Clear search"
            title="Clear"
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-gw-green-1"
          >
            <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor" aria-hidden="true">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293A1 1 0 014.293 14.293L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
      </div>
    </form>
  );
}
