'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { useCart } from '@/lib/CartContext';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
  const [isCartDropdownOpen, setIsCartDropdownOpen] = useState(false);
  const { user, logout } = useAuth();
  const accountDropdownRef = useRef<HTMLDivElement>(null);
  const cartDropdownRef = useRef<HTMLDivElement>(null);
  const { itemCount } = useCart();

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (accountDropdownRef.current && !accountDropdownRef.current.contains(event.target as Node)) {
        setIsAccountDropdownOpen(false);
      }
      if (cartDropdownRef.current && !cartDropdownRef.current.contains(event.target as Node)) {
        setIsCartDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setIsAccountDropdownOpen(false);
  };

  return (
    <header className="bg-gw-green-1 text-gw-white">
      <div className="w-full px-8 sm:px-12 lg:px-16">
        <div className="flex items-center justify-between h-16 w-full">
          {/* Logo - positioned to the far left */}
          <div className="flex-shrink-0">
            <Link href="/" className="text-xl font-calluna font-black">
              Groundwork Books
            </Link>
          </div>

          {/* Center section with navigation and right icons */}
          <div className="flex items-center space-x-6">
            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-8">
              <Link href="/" className="hover:text-gw-green-2 transition-colors font-helvetica">
                HOME
              </Link>
              <Link href="/store" className="hover:text-gw-green-2 transition-colors">
                STORE
              </Link>
              <Link href="/archive" className="hover:text-gw-green-2 transition-colors">
                ARCHIVE
              </Link>
              <Link href="/community" className="hover:text-gw-green-2 transition-colors">
                COMMUNITY
              </Link>
              <Link href="/about" className="hover:text-gw-green-2 transition-colors">
                ABOUT
              </Link>
            </nav>

            {/* Separator */}
            <div className="hidden md:block text-gw-green-2">|</div>

            {/* Right side icons */}
            <div className="flex items-center space-x-4">
            {/* User icon with dropdown */}
            <div className="relative" ref={accountDropdownRef}>
              <button
                onClick={() => setIsAccountDropdownOpen(!isAccountDropdownOpen)}
                className="hover:text-gw-green-2 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </button>
              
              {/* Account Dropdown Menu */}
              {isAccountDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-gw-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                  {user ? (
                    <>
                      <div className="px-4 py-2 border-b border-gray-200">
                        <p className="text-sm text-gw-black font-medium">{user.email}</p>
                      </div>
                      <Link
                        href="/account"
                        className="block px-4 py-2 text-sm text-gw-black hover:bg-gw-green-2 transition-colors"
                        onClick={() => setIsAccountDropdownOpen(false)}
                      >
                        Account Settings
                      </Link>
                      <Link
                        href="/orders"
                        className="block px-4 py-2 text-sm text-gw-black hover:bg-gw-green-2 transition-colors"
                        onClick={() => setIsAccountDropdownOpen(false)}
                      >
                        My Orders
                      </Link>
                      <Link
                        href="/wishlist"
                        className="block px-4 py-2 text-sm text-gw-black hover:bg-gw-green-2 transition-colors"
                        onClick={() => setIsAccountDropdownOpen(false)}
                      >
                        Wishlist
                      </Link>
                      <hr className="my-1 border-gray-200" />
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        Sign Out
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/login"
                        className="block px-4 py-2 text-sm text-gw-black hover:bg-gw-green-2 transition-colors"
                        onClick={() => setIsAccountDropdownOpen(false)}
                      >
                        Sign In
                      </Link>
                      <Link
                        href="/register"
                        className="block px-4 py-2 text-sm text-gw-black hover:bg-gw-green-2 transition-colors"
                        onClick={() => setIsAccountDropdownOpen(false)}
                      >
                        Register
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Cart icon with dropdown */}
            <div className="relative" ref={cartDropdownRef}>
              <button
                onClick={() => setIsCartDropdownOpen(!isCartDropdownOpen)}
                className="relative hover:text-gw-green-2 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l-1 12H6L5 9z" />
                </svg>
                {itemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
                    {itemCount}
                  </span>
                )}
              </button>
              
              {/* Cart Dropdown Menu */}
              {isCartDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-gw-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                  {user ? (
                    <>
                      <div className="px-4 py-2 border-b border-gray-200">
                        <p className="text-sm text-gw-black font-medium">
                          {itemCount > 0 ? `${itemCount} item${itemCount > 1 ? 's' : ''} in cart` : 'Your cart is empty'}
                        </p>
                      </div>
                      <Link
                        href="/cart"
                        className="block px-4 py-2 text-sm text-gw-black hover:bg-gw-green-2 transition-colors"
                        onClick={() => setIsCartDropdownOpen(false)}
                      >
                        View Cart
                      </Link>
                      {itemCount > 0 && (
                        <Link
                          href="/checkout"
                          className="block px-4 py-2 text-sm text-gw-green-1 hover:bg-gw-green-2 transition-colors font-medium"
                          onClick={() => setIsCartDropdownOpen(false)}
                        >
                          Checkout
                        </Link>
                      )}
                    </>
                  ) : (
                    <div className="px-4 py-3">
                      <p className="text-sm text-gw-black/70 mb-2">You must sign in to view your cart</p>
                      <Link
                        href="/login"
                        className="inline-block bg-gw-green-1 text-gw-white px-3 py-1 rounded text-sm hover:bg-gw-green-1/90 transition-colors"
                        onClick={() => setIsCartDropdownOpen(false)}
                      >
                        Sign In
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden hover:text-gw-green-2 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
              </svg>
            </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gw-green-1/70 py-4">
            <div className="space-y-2">
              <Link href="/" className="block py-2 hover:text-gw-green-2 transition-colors">
                HOME
              </Link>
              <Link href="/books" className="block py-2 hover:text-gw-green-2 transition-colors">
                STORE
              </Link>
              <Link href="/archive" className="block py-2 hover:text-gw-green-2 transition-colors">
                ARCHIVE
              </Link>
              <Link href="/community" className="block py-2 hover:text-gw-green-2 transition-colors">
                COMMUNITY
              </Link>
              <Link href="/about" className="block py-2 hover:text-gw-green-2 transition-colors">
                ABOUT
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}