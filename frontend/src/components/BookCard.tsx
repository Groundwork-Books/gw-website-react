// components/BookCard.tsx
'use client';

import Image from 'next/image';
import * as React from 'react';

type Book = {
  id: string;
  name: string;
  price: number | string;
  imageUrl?: string | null;
  description?: string | null;
};

type Props = {
  book: Book;
  onClick?: () => void;
  className?: string;
  /** Use for horizontal carousels (adds min/max width). */
  fixedWidth?: boolean;
  /** Override the overlay color; defaults to your brand green. */
  overlayClassName?: string; // e.g., 'bg-gw-green-1'
};

export default function BookCard({
  book,
  onClick,
  className = '',
  fixedWidth = false,
  overlayClassName = 'bg-gw-green-1',
}: Props) {
  const priceNum =
    typeof book.price === 'number' ? book.price : parseFloat(book.price || '0');

  return (
    <div
      data-book-id={book.id}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(e) => {
        if (!onClick) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className={[
        fixedWidth ? 'min-w-[200px] max-w-[200px]' : '',
        'bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg',
        'transition-all duration-200 cursor-pointer group',
        className,
      ].join(' ')}
    >
      {/* Image */}
      <div className="h-48 bg-gray-200 flex items-center justify-center relative overflow-hidden">
        <div
          className={`absolute inset-0 ${overlayClassName} opacity-0 group-hover:opacity-20 transition-opacity duration-200 z-10`}
        />
        {book.imageUrl ? (
          <div className="relative w-full h-full">
            <Image
              src={book.imageUrl}
              alt={book.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 16vw"
              className="object-cover"
            />
          </div>
        ) : (
          <div className="text-gray-400 text-center flex items-center justify-center h-full w-full">
            <div>
              <svg className="w-8 h-8 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-xs">No Image</p>
            </div>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-3">
        <h3 className="text-sm font-light text-gray-900 mb-2 line-clamp-2 min-h-[2.5rem]">
          {book.name}
        </h3>
        <span className="text-sm text-gw-green-1 font-bold block mb-2">
          ${priceNum.toFixed(2)}
        </span>
      </div>
    </div>
  );
}
