'use client';

import { useAuth } from '@/lib/AuthContext';
import { useCart } from '@/lib/CartContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

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
                  <path d="M4.0625 3.4858H19.6655C20.4573 3.4858 20.935 4.3622 20.506 5.02764L17.5907 9.5496C17.2225 10.1208 16.5894 10.4659 15.9098 10.4659H8M8 10.4659L6.29897 12.8783C5.83185 13.5407 6.30564 14.4545 7.11623 14.4545H19.25M8 10.4659L3.51139 2.50883C3.15682 1.88027 2.49111 1.49148 1.76944 1.49148H1.25M8 18.4432C8 18.9939 7.49632 19.4403 6.875 19.4403C6.25368 19.4403 5.75 18.9939 5.75 18.4432C5.75 17.8925 6.25368 17.446 6.875 17.446C7.49632 17.446 8 17.8925 8 18.4432ZM19.25 18.4432C19.25 18.9939 18.7463 19.4403 18.125 19.4403C17.5037 19.4403 17 18.9939 17 18.4432C17 17.8925 17.5037 17.446 18.125 17.446C18.7463 17.446 19.25 17.8925 19.25 18.4432Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
              <Link href="/store" className="text-blue-600 hover:text-blue-700 font-medium">
                Continue Shopping
              </Link>
            </div>

            <>
              <div className="space-y-4 mb-8">
                {cart.items.map((item) => (
                  <div key={item.book.id} className="flex items-center justify-between border-b border-gray-200 pb-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-20 bg-gray-200 rounded flex items-center justify-center">
                        {item.book.imageUrl ? (
                          <Image
                            src={item.book.imageUrl}
                            alt={item.book.name}
                            width={64}
                            height={80}
                            className="w-full h-full object-cover rounded"
                          />
                        ) : (
                          <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </div>

                      <div>
                        <h3 className="font-semibold text-gray-900">{item.book.name}</h3>
                        <p className="text-gray-600">${item.book.price.toFixed(2)} each</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="flex items-center border border-gray-300 rounded">
                        <button
                          onClick={() => handleQuantityChange(item.book.id, item.quantity - 1)}
                          className="px-3 py-1 text-gray-600 hover:text-gray-800"
                        >
                          -
                        </button>
                        <span className="px-3 py-1 border-l border-r border-gray-300">{item.quantity}</span>
                        <button
                          onClick={() => handleQuantityChange(item.book.id, item.quantity + 1)}
                          className="px-3 py-1 text-gray-600 hover:text-gray-800"
                        >
                          +
                        </button>
                      </div>

                      <div className="w-24 text-right">
                        <span className="font-semibold">
                          ${(item.book.price * item.quantity).toFixed(2)}
                        </span>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.book.id)}
                        className="text-red-600 hover:text-red-800 p-1"
                        title="Remove item"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-200 pt-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-sm text-gray-600">
                      {itemCount} {itemCount === 1 ? 'item' : 'items'} in cart
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-gray-900">Total: ${cart.total.toFixed(2)}</p>
                  </div>
                </div>

                <div className="flex space-x-4">
                  <button
                    onClick={clearCart}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 px-4 rounded-md transition duration-200"
                  >
                    Clear Cart
                  </button>
                  <Link
                    href="/checkout"
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-md transition duration-200 text-center"
                  >
                    Proceed to Checkout
                  </Link>
                </div>
              </div>
            </>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}