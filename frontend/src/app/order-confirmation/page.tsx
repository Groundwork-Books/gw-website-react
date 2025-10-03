'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useCart } from '@/lib/CartContext';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface Order {
  id: string;
  created_at: string;
  state: string;
  total_money: {
    amount: number;
    currency: string;
  };
  line_items: Array<{
    name: string;
    quantity: string;
    base_price_money: {
      amount: number;
      currency: string;
    };
  }>;
  fulfillments: Array<{
    type: string;
    state: string;
    pickup_details?: {
      recipient: {
        display_name: string;
        email_address: string;
        phone_number?: string;
      };
      note?: string;
    };
  }>;
}

function OrderConfirmationContent() {
  const { user, loading: authLoading } = useAuth();
  const { clearCart } = useCart();
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusUpdating] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const fetchOrderDetails = useCallback(async () => {
    try {
      const response = await fetch(`/api/orders/${orderId}`);
      const data = await response.json();
      
      if (data.success) {
        setOrder(data.order);
      } else {
        setError(data.error || 'Failed to load order details');
      }
    } catch {
      setError('Failed to load order details');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  // Clear cart immediately when order confirmation loads (successful payment)
  useEffect(() => {
    if (orderId && user) {
      console.log('🛒 Clearing cart after successful payment...');
      clearCart();
      
      // Also clear from localStorage immediately to prevent reload issues
      try {
        const cartKey = `cart_${user.uid}`;
        localStorage.removeItem(cartKey);
        console.log('🗑️ Removed cart from localStorage');
      } catch (error) {
        console.error('Error removing cart from localStorage:', error);
      }
      
      // Order will be in 'Preparing Order' state until admin manually updates it
      setTimeout(() => {
        console.log('🔄 Refreshing order details to show current status...');
        fetchOrderDetails();
      }, 2000);
      
      // Initial fetch
      fetchOrderDetails();
    }
  }, [orderId, user, clearCart, fetchOrderDetails]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount / 100);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading order details...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <Link 
            href="/store"
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition duration-200"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Order not found</h1>
          <Link 
            href="/store"
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition duration-200"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  const pickupDetails = order.fulfillments?.[0]?.pickup_details;
  const orderStatus = order.fulfillments?.[0]?.state || 'PENDING';

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Confirmed!</h1>
            <p className="text-gray-600">Thank you for your purchase. We&apos;ll send you an email confirmation shortly.</p>
          </div>

          {/* Order Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Order Information */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Order Information</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Order Number:</span>
                  <span className="font-medium">{order.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Order Date:</span>
                  <span className="font-medium">{formatDate(order.created_at)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <div className="flex items-center gap-2">
                    <span className={`font-medium ${
                      orderStatus === 'COMPLETED' ? 'text-green-600' :
                      orderStatus === 'PREPARED' ? 'text-blue-600' :
                      'text-yellow-600'
                    }`}>
                                          {orderStatus === 'COMPLETED' ? 'Picked Up' :
                     orderStatus === 'PREPARED' ? 'Ready for Pickup' :
                     'Preparing Order'}
                    </span>
                    {statusUpdating && orderStatus === 'PROPOSED' && (
                      <div className="flex items-center gap-1 text-sm text-blue-600">
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Updating...</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total:</span>
                  <span className="font-medium text-lg">
                    {formatAmount(order.total_money.amount, order.total_money.currency)}
                  </span>
                </div>
              </div>
            </div>

            {/* Pickup Information */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Pickup Information</h2>
              {pickupDetails ? (
                <div className="space-y-3">
                  <div>
                    <span className="text-gray-600 block">Customer Name:</span>
                    <span className="font-medium">{pickupDetails.recipient.display_name}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 block">Email:</span>
                    <span className="font-medium">{pickupDetails.recipient.email_address}</span>
                  </div>
                  {pickupDetails.recipient.phone_number && (
                    <div>
                      <span className="text-gray-600 block">Phone:</span>
                      <span className="font-medium">{pickupDetails.recipient.phone_number}</span>
                    </div>
                  )}
                  {pickupDetails.note && (
                    <div>
                      <span className="text-gray-600 block">Note:</span>
                      <span className="font-medium">{pickupDetails.note}</span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-600">Pickup details will be available shortly.</p>
              )}
            </div>
          </div>

          {/* Order Items */}
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Order Items</h2>
            <div className="space-y-4">
              {order.line_items.map((item, index) => (
                <div key={index} className="flex items-center justify-between border-b border-gray-200 pb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">{item.name}</h3>
                    <p className="text-gray-600">Quantity: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold">
                      {formatAmount(
                        item.base_price_money.amount * parseInt(item.quantity),
                        item.base_price_money.currency
                      )}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Important Notice */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-semibold text-blue-900 mb-2">Important Pickup Information</h3>
            <ul className="text-blue-800 text-sm space-y-1">
              <li>• You will receive an email confirmation with pickup instructions</li>
              <li>• Please bring a valid ID when picking up your order</li>
              <li>• Orders are typically ready for pickup within 1-2 business days</li>
              <li>• We will contact you when your order is ready</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <Link 
              href="/orders"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-md transition duration-200 text-center"
            >
              View Order History
            </Link>
            <Link 
              href="/store"
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 px-4 rounded-md transition duration-200 text-center"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OrderConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    }>
      <OrderConfirmationContent />
    </Suspense>
  );
}
