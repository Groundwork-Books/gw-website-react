'use client';

import { useAuth } from '@/lib/AuthContext';
import { useCart } from '@/lib/CartContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

type BookExtras = {
  author?: string;
  availability?: 'available' | 'unavailable' | string;
  isUnavailable?: boolean;
  unavailable?: boolean;
};

type CartItemExtras = {
  unavailable?: boolean;
};

export default function CartPage() {
  const { user, loading: authLoading } = useAuth();
  const { cart, removeFromCart, updateQuantity, clearCart, itemCount } = useCart();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/no-account');
    }
  }, [user, authLoading, router]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleQuantityChange = (bookId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      removeFromCart(bookId);
    } else {
      updateQuantity(bookId, newQuantity);
    }
  };

  return (
    <div className="min-h-screen bg-gw-green-2">
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
              Shopping Cart
            </h1>
          </div>
        </div>
      </section>

      {/* Center content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {cart.items.length === 0 ? (
          /* EMPTY CART — match screenshot */
          <div className="bg-white p-8 border border-gray-200 font-calluna">
            {/* Header row */}
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-extrabold text-gw-green-1">Your Cart</h2>
              <span className="text-xl font-extrabold text-gw-green-1">
                {itemCount} {itemCount === 1 ? 'Item' : 'Items'}
              </span>
            </div>

            {/* Top rule */}
            <div className="mt-2 mb-10 border-t border-black-300" />

            {/* Center content */}
            <div className="flex flex-col items-center text-center">
              {/* Cart icon */}
              <svg
                  width="66"
                  height="63"
                  viewBox="0 0 22 21"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="align-middle text-gw-green-1 mb-6"
                  style={{ display: 'block' }}
                >
                  <path d="M4.0625 3.4858H19.6655C20.4573 3.4858 20.935 4.3622 20.506 5.02764L17.5907 9.5496C17.2225 10.1208 16.5894 10.4659 15.9098 10.4659H8M8 10.4659L6.29897 12.8783C5.83185 13.5407 6.30564 14.4545 7.11623 14.4545H19.25M8 10.4659L3.51139 2.50883C3.15682 1.88027 2.49111 1.49148 1.76944 1.49148H1.25M8 18.4432C8 18.9939 7.49632 19.4403 6.875 19.4403C6.25368 19.4403 5.75 18.9939 5.75 18.4432C5.75 17.8925 6.25368 17.446 6.875 17.446C7.49632 17.446 8 17.8925 8 18.4432ZM19.25 18.4432C19.25 18.9939 18.7463 19.4403 18.125 19.4403C17.5037 19.4403 17 18.9939 17 18.4432C17 17.8925 17.5037 17.446 18.125 17.446C18.7463 17.446 19.25 17.8925 19.25 18.4432Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>

              <p className="text-gw-green-1 font-extrabold text-2xl mb-6">Your cart is empty...</p>

              <Link
                href="/store"
                className="px-20 py-3 rounded-full bg-gw-green-1 text-white font-semibold shadow hover:bg-gw-green-3 transition-colors cursor-pointer"
              >
                Continue shopping
              </Link>
            </div>

            {/* Bottom rule */}
            <div className="mt-10 border-t border-black-300" />
          </div>
        ) : (
          <section aria-label="Cart items and summary" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Your Cart */}
              <div className="md:col-span-2 bg-white border border-gray-200 p-6">
                {/* Header row */}
                <div className="flex items-center justify-between">
                  <h2 className="font-calluna text-3xl font-extrabold text-gw-green-1">Your Cart</h2>
                  <span className="text-xl font-extrabold text-gw-green-1 font-calluna">
                    {itemCount} {itemCount === 1 ? 'Item' : 'Items'}
                  </span>
                </div>
                <hr className="mt-2 mb-4 border-black-300" />

                {/* Cart items */}
                <div className="space-y-4">
                  {cart.items.map((item) => {
                    const bookMeta = item.book as Partial<BookExtras>;
                    const itemMeta = item as Partial<CartItemExtras>;
                    // Optional “unavailable” overlay support if you ever set these flags on items
                    const unavailable =
                      Boolean(itemMeta.unavailable) ||
                      Boolean(bookMeta.unavailable) ||
                      Boolean(bookMeta.isUnavailable) ||
                      bookMeta.availability === 'unavailable';
                    return (
                      <div
                        key={item.book.id}
                        className="relative flex items-start justify-between border-b border-black py-2 min-h-[112px]"
                      >
                        {unavailable && (
                          <div className="absolute inset-0 bg-gray-200/80 z-10 flex items-center">
                            <p className="ml-24 text-xs font-semibold text-gray-800 tracking-wide">
                              ITEM UNAVAILABLE - LIMITED STOCK
                            </p>
                          </div>
                        )}

                        <div className="flex items-start gap-4">
                          {/* Thumb */}
                          <div className="relative w-20 h-28 flex-shrink-0 overflow-hidden bg-gray-100 rounded">
                            {item.book.imageUrl ? (
                              <Image
                                src={item.book.imageUrl}
                                alt={item.book.name}
                                fill
                                sizes="80px"
                                className="object-cover"
                                priority={false}
                              />
                            ) : (
                              <svg className="w-6 h-6 text-gray-400 absolute inset-0 m-auto" viewBox="0 0 20 20" fill="currentColor">
                                <path
                                  fillRule="evenodd"
                                  d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            )}
                          </div>

                          {/* Title/author + qty */}
                          <div className="min-w-0">
                            <h3 className="pr-8 text-gray-900">{item.book.name}</h3>
                            {/* If you pass an author field, this will render like the mock */}
                            {bookMeta.author && (
                              <p className="text-sm text-gray-600">by {bookMeta.author}</p>
                            )}

                            {/* Quantity stepper */}
                            <div className="mt-2 inline-flex items-center border border-black rounded">
                              <button
                                onClick={() => handleQuantityChange(item.book.id, item.quantity - 1)}
                                disabled={unavailable}
                                className="px-2 py-1 text-sm text-black disabled:opacity-50 hover:cursor-pointer"
                                aria-label="Decrease quantity"
                              >
                                –
                              </button>
                              <span className="px-1 py-1 text-sm font-helvetica">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => handleQuantityChange(item.book.id, item.quantity + 1)}
                                disabled={unavailable}
                                className="px-2 py-1 text-sm text-black disabled:opacity-50 hover:cursor-pointer"
                                aria-label="Increase quantity"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Right side: Remove + line total */}
                        <div className="flex flex-col items-end justify-between self-stretch text-right">
                          <button
                            onClick={() => removeFromCart(item.book.id)}
                            disabled={unavailable}
                            className="text-sm hover:cursor-pointer text-gray-500 hover:underline disabled:opacity-50"
                          >
                            Remove
                          </button>

                          {/* Price tag */}
                          <div className="font-semibold text-gray-900 mt-auto">
                            ${(item.book.price * item.quantity).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right: 1/3 — Summary card */}
              <aside className="bg-white border border-gray-200 p-6 h-min md:sticky md:top-6">
                <div className="flex items-baseline justify-between">
                  <h3 className="font-calluna text-3xl font-extrabold text-gw-green-1">Total</h3>
                  <div className="font-calluna text-3xl font-extrabold text-gw-green-1">
                    ${cart.total.toFixed(2)}
                  </div>
                </div>

                {/* Buttons */}
                <div className="mt-6 space-y-3">
                  <Link
                    href="/checkout"
                    className="w-full inline-flex justify-center items-center rounded-full bg-gw-green-1 text-white py-3 px-4 shadow hover:bg-gw-green-3 transition-colors"
                  >
                    Proceed to checkout &gt;
                  </Link>
                  <Link
                    href="/store"
                    className="w-full inline-flex justify-center items-center rounded-full border border-gw-green-1 text-gw-green-1 bg-white font-semibold py-3 px-4 hover:bg-gw-green-2/50 transition-colors"
                  >
                    Continue shopping &gt;
                  </Link>
                </div>

                <div className="mt-2 text-center">
                  <button
                    type="button"
                    onClick={clearCart}
                    className="text-sm text-black hover:underline hover:cursor-pointer"
                  >
                    Clear cart
                  </button>
                </div>

                <p className="mt-2 text-xs text-gray-600 italic">
                  *Please note that Groundwork Books does not provide shipping. Your order will be in store pick up only.
                </p>
              </aside>
            </div>
          </section>
        )}
      </div>
      <Footer />
    </div>
  );
}