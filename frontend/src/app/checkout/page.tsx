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
  const { cart, clearCart } = useCart();
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
      router.push('/login');
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

  const totalAmount = cart?.items ? cart.items.reduce((sum, item) => sum + (item.book.price * item.quantity), 0) : 0;

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
          locationId: process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID
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

  if (!cart?.items || cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Your Cart is Empty</h1>
          <p className="text-gray-600 mb-6">Add some books to your cart before checking out.</p>
          <Link
            href="/store"
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Browse Books
          </Link>
        </div>
      </div>
    );
  }

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
                    Checkout
                  </h1>
                </div>
              </div>
            </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Order Summary */}
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">Order Summary</h2>

                <div className="space-y-4">
                  {cart?.items && cart.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center py-4 border-b border-gray-200">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{item.book.name}</h3>
                        <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">
                          ${(item.book.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}

                  <div className="flex justify-between items-center pt-4 border-t-2 border-gray-300">
                    <span className="text-lg font-bold text-gray-900">Total:</span>
                    <span className="text-lg font-bold text-gray-900">
                      ${totalAmount.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-md">
                  <h3 className="font-medium text-blue-900 mb-2">Pickup Information</h3>
                  <p className="text-sm text-blue-800">
                    Your order will be ready for pickup immediately after payment.
                    Please bring a valid ID when picking up your books.
                  </p>
                </div>
              </div>

              {/* Customer Information */}
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">Customer Information</h2>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      value={customerInfo.name}
                      onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                      disabled={loading}
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
                      onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                      disabled={loading}
                    />
                    {/* Email difference warning */}
                    {user?.email && customerInfo.email && customerInfo.email.toLowerCase() !== user.email.toLowerCase() && (
                      <div className="mt-2 bg-yellow-50 border border-yellow-200 rounded-md p-3">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm text-yellow-800">
                              <strong>Different email notice:</strong> Your receipt will be sent to <strong>{customerInfo.email}</strong> instead of your login email ({user.email}).
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
                      onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={loading}
                    />
                  </div>

                  <div className="bg-yellow-50 p-4 rounded-md">
                    <h3 className="font-medium text-yellow-900 mb-2">🔒 Secure Payment</h3>
                    <p className="text-sm text-yellow-800">
                      You&apos;ll be redirected to Square&apos;s secure payment page to complete your purchase.
                      You&apos;ll receive an email confirmation after payment.
                    </p>
                  </div>

                  <div className="flex space-x-4">
                    <Link
                      href="/cart"
                      className="flex-1 bg-gray-200 text-gray-800 py-3 px-6 rounded-md text-center hover:bg-gray-300 transition-colors"
                    >
                      Back to Cart
                    </Link>

                    <button
                      type="submit"
                      disabled={loading || !cart?.items || cart.items.length === 0}
                      className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {loading ? 'Redirecting to Secure Payment...' : 'Proceed to Payment'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}