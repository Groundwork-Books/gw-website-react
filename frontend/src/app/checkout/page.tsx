'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useCart } from '@/lib/CartContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
}

export default function CheckoutPage() {
  const { user, loading: authLoading } = useAuth();
  const { cart, updateQuantity, removeFromCart } = useCart();
  const router = useRouter();

  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: '',
    email: user?.email || '',
    phone: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/no-account');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user?.email) {
      setCustomerInfo(prev => ({
        ...prev,
        email: user.email || ''
      }));
    }
  }, [user]);

  const handleQuantityChange = (bookId: string, newQuantity: number) => {
    if (loading) return; // lock while redirecting
    if (newQuantity < 1) {
      removeFromCart(bookId);
    } else {
      updateQuantity(bookId, newQuantity);
    }
  };

  const totalAmount =
    cart?.items ? cart.items.reduce((sum, item) => sum + item.book.price * item.quantity, 0) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!cart?.items || cart.items.length === 0) {
      setError('Your cart is empty');
      return;
    }

    if (!customerInfo.name.trim() || !customerInfo.email.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError('');

    try {

      // Create Payment Link instead of processing payment directly
      const response = await fetch('/api/orders/create-payment-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: cart.items,
          customerInfo: {
            ...customerInfo,
            userId: user?.uid
          },
          locationId: process.env.SQUARE_LOCATION_ID
        }),
      });

      const data = await response.json();

      if (data.success && data.payment_link_url) {

        // Redirect to Square's hosted checkout page immediately
        // Don't clear cart until after successful payment
        window.location.href = data.payment_link_url;
      } else {
        throw new Error(data.error || 'Failed to create payment link');
      }

    } catch (error) {
      console.error('Checkout error:', error);
      setError(error instanceof Error ? error.message : 'An error occurred during checkout');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Empty cart state
  if (!cart?.items || cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-gw-green-2">
        <Header />
        {/* Hero */}
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
          <div className="absolute inset-0" />
          <div className="relative z-10 w-full px-4">
            <div className="mx-auto max-w-3xl bg-white/90 py-10 px-6 md:px-12 text-center">
              <h1 className="font-calluna font-black text-4xl md:text-5xl lg:text-[56px] leading-[110%] text-gw-green-1">
                Checkout
              </h1>
            </div>
          </div>
        </section>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="bg-white p-8 border border-gray-200 font-calluna">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-extrabold text-gw-green-1">Your Order</h2>
              <span className="text-xl font-extrabold text-gw-green-1">0 Items</span>
            </div>
            <div className="mt-2 mb-10 border-t border-black-300" />
            <div className="flex flex-col items-center text-center">
              <p className="text-gw-green-1 font-extrabold text-2xl mb-6">Your cart is empty...</p>
              <Link
                href="/store"
                className="px-20 py-3 rounded-full bg-gw-green-1 text-white font-semibold shadow hover:bg-gw-green-3 transition-colors cursor-pointer"
              >
                Continue shopping
              </Link>
            </div>
            <div className="mt-10 border-t border-black-300" />
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Main
  return (
    <div className="min-h-screen bg-gw-green-2">
      <Header />

      {/* Hero */}
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
        <div className="absolute inset-0" />
        <div className="relative z-10 w-full px-4">
          <div className="mx-auto max-w-3xl bg-white/90 py-10 px-6 md:px-12 text-center">
            <h1 className="font-calluna font-black text-4xl md:text-5xl lg:text-[56px] leading-[110%] text-gw-green-1">
              Checkout
            </h1>
          </div>
        </div>
      </section>

      {/* Center content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <section aria-label="Checkout items, customer info, and summary">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left: Order + Customer Info */}
            <div className="md:col-span-2 bg-white border border-gray-200 p-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <h2 className="font-calluna text-3xl font-extrabold text-gw-green-1">Your Order</h2>
                <span className="text-xl font-extrabold text-gw-green-1 font-calluna">
                  {cart.items.length} {cart.items.length === 1 ? 'Item' : 'Items'}
                </span>
              </div>
              <hr className="mt-2 mb-4 border-black-300" />

              {/* Items (with editable quantity) */}
              <div className="space-y-4">
                {cart.items.map((item) => (
                  <div
                    key={item.book.id}
                    className="flex items-start justify-between border-b border-black py-2 min-h-[88px]"
                  >
                    <div className="min-w-0 pr-4">
                      <h3 className="font-semibold text-gray-900">{item.book.name}</h3>

                      {/* Quantity stepper — matches Cart page styling */}
                      <div className="mt-2 inline-flex items-center border border-black rounded">
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(item.book.id, item.quantity - 1)}
                          disabled={loading}
                          className="px-2 py-1 text-sm text-black disabled:opacity-50 hover:cursor-pointer"
                          aria-label={`Decrease quantity of ${item.book.name}`}
                        >
                          –
                        </button>
                        <span className="px-1 py-1 text-sm font-helvetica" aria-live="polite">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(item.book.id, item.quantity + 1)}
                          disabled={loading}
                          className="px-2 py-1 text-sm text-black disabled:opacity-50 hover:cursor-pointer"
                          aria-label={`Increase quantity of ${item.book.name}`}
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Right: remove + line total */}
                    <div className="flex flex-col items-end justify-between self-stretch text-right">
                      <button
                        type="button"
                        onClick={() => handleQuantityChange(item.book.id, 0)}
                        disabled={loading}
                        className="text-sm hover:cursor-pointer text-gray-500 hover:underline disabled:opacity-50"
                      >
                        Remove
                      </button>
                      <div className="font-semibold text-gray-900 mt-auto">
                        ${(item.book.price * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pickup note */}
              <div className="mt-6 bg-gw-green-2 border border-gw-green-1/50 rounded-md p-4">
                <h3 className="font-semibold text-gw-green-1 mb-1">Pickup Information</h3>
                <p className="text-sm text-gw-black/80">
                  Your order will be ready for pickup immediately after payment. Please bring a valid ID when picking up your books.
                </p>
              </div>

              {/* Error */}
              {error && (
                <div
                  role="alert"
                  aria-live="assertive"
                  className="mt-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded"
                >
                  {error}
                </div>
              )}

              {/* Customer Info */}
              <h2 className="mt-8 font-calluna text-3xl font-extrabold text-gw-green-1">
                Customer Information
              </h2>
              <hr className="mt-2 mb-6 border-black-300" />

              <form id="checkout-form" onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={customerInfo.name}
                    onChange={(e) => setCustomerInfo((p) => ({ ...p, name: e.target.value }))}
                    className="w-full h-12 rounded-full border border-gw-green-1 bg-white px-5 text-gw-green-1 placeholder:text-gw-green-1/60 focus:outline-none focus:ring-2 focus:ring-gw-green-1/30"
                    required
                    disabled={loading}
                    placeholder="Jane Doe"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={customerInfo.email}
                    onChange={(e) => setCustomerInfo((p) => ({ ...p, email: e.target.value }))}
                    className="w-full h-12 rounded-full border border-gw-green-1 bg-white px-5 text-gw-green-1 placeholder:text-gw-green-1/60 focus:outline-none focus:ring-2 focus:ring-gw-green-1/30"
                    required
                    disabled={loading}
                    placeholder="you@example.com"
                  />

                  {user?.email &&
                    customerInfo.email &&
                    customerInfo.email.toLowerCase() !== user.email.toLowerCase() && (
                      <div className="mt-2 bg-yellow-50 border border-yellow-200 rounded-md p-3">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <svg
                              className="h-5 w-5 text-yellow-400"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm text-yellow-800">
                              <strong>Different email notice:</strong> Your receipt will be sent to{' '}
                              <strong>{customerInfo.email}</strong> instead of your login email (
                              {user.email}).
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    value={customerInfo.phone}
                    onChange={(e) => setCustomerInfo((p) => ({ ...p, phone: e.target.value }))}
                    className="w-full h-12 rounded-full border border-gw-green-1 bg-white px-5 text-gw-green-1 placeholder:text-gw-green-1/60 focus:outline-none focus:ring-2 focus:ring-gw-green-1/30"
                    disabled={loading}
                    placeholder="(555) 555-5555"
                  />
                </div>

                <div className="bg-gw-green-2 border border-gw-green-1/50 p-4 rounded-md">
                  <h3 className="font-semibold text-gw-green-1 mb-1">
                    <svg
                      className="inline-block w-6 h-6 mb-1 align-middle"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      aria-hidden="true"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 10V7a4 4 0 10-8 0v3" />
                      <rect x="5" y="10" width="14" height="10" rx="2" ry="2" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 14v3" />
                    </svg> Secure Payment</h3>
                  <p className="text-sm text-gw-black/80">
                    You&apos;ll be redirected to Square&apos;s secure checkout to complete your purchase. A confirmation email will arrive after payment.
                  </p>
                </div>
              </form>
            </div>

            {/* Right: Summary / Actions */}
            <aside className="bg-white border border-gray-200 p-6 h-min md:sticky md:top-6">
              <div className="flex items-baseline justify-between">
                <h3 className="font-calluna text-3xl font-extrabold text-gw-green-1">Total</h3>
                <div className="font-calluna text-3xl font-extrabold text-gw-green-1">
                  ${totalAmount.toFixed(2)}
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <button
                  type="submit"
                  form="checkout-form"
                  disabled={loading || !cart?.items || cart.items.length === 0}
                  className="w-full inline-flex justify-center items-center rounded-full bg-gw-green-1 text-white py-3 px-4 shadow hover:bg-gw-green-3 transition-colors disabled:opacity-50 hover:cursor-pointer disabled:cursor-not-allowed"
                >
                  {loading ? 'Redirecting…' : 'Proceed to Payment ›'}
                </button>

                <Link
                  href="/cart"
                  className="w-full inline-flex justify-center items-center rounded-full border-2 border-gw-green-1 text-gw-green-1 bg-white font-semibold py-3 px-4 hover:bg-gw-green-2/50 transition-colors"
                >
                  Back to Cart
                </Link>
              </div>

              <p className="mt-4 text-xs text-gray-600 italic">
                *Groundwork Books does not provide shipping. In-store pickup only.
              </p>
            </aside>
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
}