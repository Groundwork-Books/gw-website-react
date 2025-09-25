'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { useCart } from '@/lib/CartContext';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user } = useAuth();
  const { itemCount } = useCart();




  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }
    // Clean up in case component unmounts while menu is open
    return () => {
      document.body.classList.remove('overflow-hidden');
    };
  }, [isMenuOpen]);



  return (
    <header className="sticky top-0 z-50 bg-gw-green-1 text-gw-white h-16">
      <div className="w-full px-7">
        <div className="flex items-center justify-between h-16 w-full">
          {/* Logo - positioned to the far left */}
          <div className="flex-shrink-0 top-1.5">
            <Link href="/" className=" text-2xl font-calluna font-black">
              Groundwork Books
            </Link>
          </div>

          {/* Center section with navigation and right icons */}
          <div className="flex items-center gap-7">
            {/* Desktop Navigation */}
            <nav className="hidden md:flex gap-7">
              <Link href="/" className="hover:text-gw-green-2 transition-colors font-helvetica text-lg font-light">
                HOME
              </Link>
              <Link href="/store" className="hover:text-gw-green-2 transition-colors text-lg font-light">
                STORE
              </Link>
              {/* <Link href="/archive" className="hover:text-gw-green-2 transition-colors text-lg font-light">
                ARCHIVE
              </Link> */}
              <Link href="/community" className="hover:text-gw-green-2 transition-colors text-lg font-light">
                COMMUNITY
              </Link>
              <Link href="/about" className="hover:text-gw-green-2 transition-colors text-lg font-light">
                ABOUT
              </Link>
            </nav>

            {/* Separator */}
            <div className="hidden md:block text-gw-green-2">|</div>

            {/* Right side icons */}
            <div className="flex items-center gap-7">
            {/* User icon as direct link(s) */}
            {user ? (
              <>
                <Link
                  href="/account"
                  className="hover:text-gw-green-2 transition-colors flex items-center"
                  aria-label="Account"
                >
                  <svg width="17" height="21" viewBox="0 0 17 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M0.833374 20.5833C0.833374 16.3491 4.26586 12.9167 8.50004 12.9167C12.7342 12.9167 16.1667 16.3491 16.1667 20.5833H14.25C14.25 17.4077 11.6757 14.8333 8.50004 14.8333C5.3244 14.8333 2.75004 17.4077 2.75004 20.5833H0.833374ZM8.50004 11.9583C5.32317 11.9583 2.75004 9.38521 2.75004 6.20833C2.75004 3.03146 5.32317 0.458334 8.50004 0.458334C11.6769 0.458334 14.25 3.03146 14.25 6.20833C14.25 9.38521 11.6769 11.9583 8.50004 11.9583ZM8.50004 10.0417C10.618 10.0417 12.3334 8.32625 12.3334 6.20833C12.3334 4.09042 10.618 2.375 8.50004 2.375C6.38212 2.375 4.66671 4.09042 4.66671 6.20833C4.66671 8.32625 6.38212 10.0417 8.50004 10.0417Z" fill="currentColor"/>
                  </svg>
                </Link>
                {user.email === 'groundworkbookscollective@gmail.com' && (
                  <Link
                    href="/admin"
                    className="hover:text-orange-500 transition-colors flex items-center ml-2 text-orange-400 font-semibold"
                    aria-label="Admin Dashboard"
                  >
                    🔐 ADMIN
                  </Link>
                )}
              </>
            ) : (
              <Link
                href="/login"
                className="hover:text-gw-green-2 transition-colors flex items-center"
                aria-label="Sign In"
              >
                <svg width="17" height="21" viewBox="0 0 17 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M0.833374 20.5833C0.833374 16.3491 4.26586 12.9167 8.50004 12.9167C12.7342 12.9167 16.1667 16.3491 16.1667 20.5833H14.25C14.25 17.4077 11.6757 14.8333 8.50004 14.8333C5.3244 14.8333 2.75004 17.4077 2.75004 20.5833H0.833374ZM8.50004 11.9583C5.32317 11.9583 2.75004 9.38521 2.75004 6.20833C2.75004 3.03146 5.32317 0.458334 8.50004 0.458334C11.6769 0.458334 14.25 3.03146 14.25 6.20833C14.25 9.38521 11.6769 11.9583 8.50004 11.9583ZM8.50004 10.0417C10.618 10.0417 12.3334 8.32625 12.3334 6.20833C12.3334 4.09042 10.618 2.375 8.50004 2.375C6.38212 2.375 4.66671 4.09042 4.66671 6.20833C4.66671 8.32625 6.38212 10.0417 8.50004 10.0417Z" fill="currentColor"/>
                </svg>
              </Link>
            )}

            {/* Cart icon */}
            <div
              className="relative flex items-center hover:text-gw-green-2 transition-colors"
            >
              <Link
                href="/cart"
                className="relative flex items-center"
                aria-label="View cart"
              >
                <svg
                  width="22"
                  height="21"
                  viewBox="0 0 22 21"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="align-middle"
                  style={{ display: 'block' }}
                >
                  <path d="M4.0625 3.4858H19.6655C20.4573 3.4858 20.935 4.3622 20.506 5.02764L17.5907 9.5496C17.2225 10.1208 16.5894 10.4659 15.9098 10.4659H8M8 10.4659L6.29897 12.8783C5.83185 13.5407 6.30564 14.4545 7.11623 14.4545H19.25M8 10.4659L3.51139 2.50883C3.15682 1.88027 2.49111 1.49148 1.76944 1.49148H1.25M8 18.4432C8 18.9939 7.49632 19.4403 6.875 19.4403C6.25368 19.4403 5.75 18.9939 5.75 18.4432C5.75 17.8925 6.25368 17.446 6.875 17.446C7.49632 17.446 8 17.8925 8 18.4432ZM19.25 18.4432C19.25 18.9939 18.7463 19.4403 18.125 19.4403C17.5037 19.4403 17 18.9939 17 18.4432C17 17.8925 17.5037 17.446 18.125 17.446C18.7463 17.446 19.25 17.8925 19.25 18.4432Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {itemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
                    {itemCount}
                  </span>
                )}
              </Link>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden hover:text-gw-green-2 transition-colors flex items-center self-center p-0 relative -top-0.5"
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6 block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
              </svg>
            </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {/* Mobile Navigation - Fullscreen Overlay */}
        <div
          className={`fixed inset-0 z-50 md:hidden bg-gw-green-1/90 backdrop-blur-sm transition-opacity duration-300 ${isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
          style={{
            transitionProperty: 'opacity',
          }}
          aria-hidden={!isMenuOpen}
        >
          {/* Close button (X) */}
          <button
            onClick={() => setIsMenuOpen(false)}
            className="absolute top-3.5 right-6 text-white hover:text-gw-green-2 transition-colors text-3xl focus:outline-none"
            aria-label="Close menu"
            tabIndex={isMenuOpen ? 0 : -1}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
          <div className="flex flex-col items-center justify-center h-full space-y-6">
            <Link
              href="/"
              className={`text-2xl py-2 hover:text-gw-green-2 transition-all duration-400 ease-in-out ${isMenuOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}
              style={{ transitionDelay: isMenuOpen ? '100ms' : '0ms' }}
              onClick={() => setIsMenuOpen(false)}
            >
              HOME
            </Link>
            <Link
              href="/store"
              className={`text-2xl py-2 hover:text-gw-green-2 transition-all duration-400 ease-in-out ${isMenuOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}
              style={{ transitionDelay: isMenuOpen ? '200ms' : '0ms' }}
              onClick={() => setIsMenuOpen(false)}
            >
              STORE
            </Link>
            <Link
              href="/community"
              className={`text-2xl py-2 hover:text-gw-green-2 transition-all duration-400 ease-in-out ${isMenuOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}
              style={{ transitionDelay: isMenuOpen ? '300ms' : '0ms' }}
              onClick={() => setIsMenuOpen(false)}
            >
              COMMUNITY
            </Link>
            <Link
              href="/about"
              className={`text-2xl py-2 hover:text-gw-green-2 transition-all duration-400 ease-in-out ${isMenuOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}
              style={{ transitionDelay: isMenuOpen ? '400ms' : '0ms' }}
              onClick={() => setIsMenuOpen(false)}
            >
              ABOUT
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}