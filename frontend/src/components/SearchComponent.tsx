'use client';

import { useState } from 'react';
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
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gw-green-1 focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        )}
      </div>
    </form>
  );
}
