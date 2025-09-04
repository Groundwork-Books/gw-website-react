'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
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

export default function OrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const fetchOrders = useCallback(async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      const response = await fetch(`${apiUrl}/api/orders/customer/${encodeURIComponent(user?.email || '')}`);
      const data = await response.json();
      
      if (data.success) {
        setOrders(data.orders || []);
      } else {
        setError(data.error || 'Failed to load orders');
      }
    } catch {
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchOrders();
      
      // Auto-refresh orders every 30 seconds to catch status updates
      const interval = setInterval(() => {
        fetchOrders();
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [user, fetchOrders]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount / 100);
  };

  const getStatusColor = (state: string) => {
    switch (state) {
      case 'COMPLETED':
        return 'text-green-600 bg-green-100';
      case 'PREPARED':
        return 'text-blue-600 bg-blue-100';
      case 'PROPOSED':
      case 'PENDING':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (state: string) => {
    switch (state) {
      case 'COMPLETED':
        return 'Picked Up';
      case 'PREPARED':
        return 'Ready for Pickup';
      case 'PROPOSED':
      case 'PENDING':
        return 'Pending';
      default:
        return `Processing (${state})`;
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading your orders...</div>
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

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Order History</h1>
            <Link 
              href="/store"
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition duration-200"
            >
              Continue Shopping
            </Link>
          </div>

          {orders.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zM8 6V6a2 2 0 114 0v1H8z" clipRule="evenodd" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
              <p className="text-gray-500 mb-6">Start shopping to see your orders here!</p>
              <Link 
                href="/store"
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition duration-200"
              >
                Browse Books
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {orders.map((order) => {
                const orderStatus = order.fulfillments?.[0]?.state || 'PENDING';
                const itemCount = order.line_items.reduce((total, item) => total + parseInt(item.quantity), 0);
                
                return (
                  <div key={order.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Order #{order.id.slice(-8)}
                        </h3>
                        <p className="text-gray-600">
                          {formatDate(order.created_at)} • {itemCount} {itemCount === 1 ? 'item' : 'items'}
                        </p>
                        {/* Display payment email if different from login email */}
                        {order.fulfillments?.[0]?.pickup_details?.recipient?.email_address && 
                         order.fulfillments[0].pickup_details.recipient.email_address.toLowerCase() !== user?.email?.toLowerCase() && (
                          <p className="text-sm text-blue-600 mt-1">
                            📧 Receipt sent to: {order.fulfillments[0].pickup_details.recipient.email_address}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(orderStatus)}`}>
                          {getStatusText(orderStatus)}
                        </div>
                        <p className="text-lg font-semibold text-gray-900 mt-1">
                          {formatAmount(order.total_money.amount, order.total_money.currency)}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      {order.line_items.slice(0, 3).map((item, index) => (
                        <div key={index} className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">
                            {item.name} × {item.quantity}
                          </span>
                        </div>
                      ))}
                      {order.line_items.length > 3 && (
                        <p className="text-sm text-gray-500">
                          +{order.line_items.length - 3} more items
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        {orderStatus === 'COMPLETED' && 'Order completed and picked up'}
                        {orderStatus === 'PREPARED' && 'Ready for pickup - please bring ID'}
                        {orderStatus === 'PENDING' && 'Order is being processed'}
                      </div>
                      <Link
                        href={`/order-confirmation?orderId=${order.id}`}
                        className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
