'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';

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

export default function AdminPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchEmail, setSearchEmail] = useState('');
  const [activeTab, setActiveTab] = useState<'recent' | 'search'>('recent');
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const fetchRecentOrders = useCallback(async () => {
    setLoading(true);
    setError('');
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      const response = await fetch(`${apiUrl}/api/orders/admin/recent-orders?limit=20`);
      const data = await response.json();
      
      if (data.success) {
        setOrders(data.orders || []);
      } else {
        setError(data.error || 'Failed to fetch orders');
      }
    } catch (err) {
      setError('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  }, []);

  // Check if user is admin and fetch orders
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login?message=' + encodeURIComponent('Please log in to access admin dashboard.'));
        return;
      }
      if (user.email !== 'groundworkbookscollective@gmail.com') {
        router.push('/login?message=' + encodeURIComponent('Access denied. Admin login required.'));
        return;
      }
      // User is authenticated as admin, fetch orders
      fetchRecentOrders();
    }
  }, [user, authLoading, router, fetchRecentOrders]);

  const searchOrdersByEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchEmail.trim()) return;
    
    setLoading(true);
    setError('');
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      const response = await fetch(`${apiUrl}/api/orders/admin/search-by-email/${encodeURIComponent(searchEmail)}`);
      const data = await response.json();
      
      if (data.success) {
        setOrders(data.orders || []);
      } else {
        setError(data.error || 'Failed to search orders');
      }
    } catch (err) {
      setError('Failed to search orders');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, status: 'PREPARED' | 'COMPLETED') => {
    try {
      setUpdatingOrderId(orderId); // Show loading state for specific order
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      const response = await fetch(`${apiUrl}/api/orders/admin/${orderId}/pickup-status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Immediately update the local state to show the change
        setOrders(prevOrders => 
          prevOrders.map(order => {
            if (order.id === orderId) {
              return {
                ...order,
                fulfillments: order.fulfillments.map(fulfillment => ({
                  ...fulfillment,
                  state: status
                }))
              };
            }
            return order;
          })
        );
        
      } else {
        setError(data.error || 'Failed to update order status');
      }
    } catch (err) {
      setError('Failed to update order status');
    } finally {
      setUpdatingOrderId(null); // Clear loading state
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatAmount = (amount: number, currency: string) => {
    return `$${(amount / 100).toFixed(2)}`;
  };

  const getStatusColor = (state: string) => {
    switch (state) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'PREPARED':
        return 'bg-blue-100 text-blue-800';
      case 'PROPOSED':
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
        return 'Preparing Order';
      default:
        return `Processing (${state})`;
    }
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  // This should not render if user is not admin (redirected in useEffect)
  if (!user || user.email !== 'groundworkbookscollective@gmail.com') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg">Access denied.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">Welcome, {user.email}</span>
              <button
                onClick={() => router.push('/')}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Back to Site
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => {
                  setActiveTab('recent');
                  fetchRecentOrders();
                }}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'recent'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Recent Orders
              </button>
              <button
                onClick={() => setActiveTab('search')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'search'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Search Orders
              </button>
            </nav>
          </div>

          {/* Search Form */}
          {activeTab === 'search' && (
            <div className="mb-6">
              <form onSubmit={searchOrdersByEmail} className="flex gap-4">
                <input
                  type="email"
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  placeholder="Enter customer email"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium disabled:opacity-50"
                >
                  Search
                </button>
              </form>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="text-center py-4">
              <div className="text-gray-500">Loading orders...</div>
            </div>
          )}

          {/* Orders List */}
          {!loading && orders.length === 0 && (
            <div className="text-center py-8">
              <div className="text-gray-500">No orders found</div>
            </div>
          )}

          {!loading && orders.length > 0 && (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {orders.map((order) => {
                  const fulfillment = order.fulfillments?.[0];
                  const pickupDetails = fulfillment?.pickup_details;
                  const itemCount = order.line_items.reduce((total, item) => total + parseInt(item.quantity), 0);

                  return (
                    <li key={order.id} className="px-6 py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-lg font-semibold text-gray-900">
                                Order #{order.id.slice(-8)}
                              </p>
                              <p className="text-sm text-gray-500">
                                {formatDate(order.created_at)} • {itemCount} {itemCount === 1 ? 'item' : 'items'}
                              </p>
                              {pickupDetails?.recipient && (
                                <p className="text-sm text-gray-600 mt-1">
                                  📧 {pickupDetails.recipient.display_name} ({pickupDetails.recipient.email_address})
                                  {pickupDetails.recipient.phone_number && (
                                    <span> • 📱 {pickupDetails.recipient.phone_number}</span>
                                  )}
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(fulfillment?.state || 'PROPOSED')}`}>
                                {getStatusText(fulfillment?.state || 'PROPOSED')}
                              </div>
                              <p className="text-lg font-semibold text-gray-900 mt-1">
                                {formatAmount(order.total_money.amount, order.total_money.currency)}
                              </p>
                            </div>
                          </div>

                          <div className="mt-3">
                            <div className="text-sm text-gray-600">
                              {order.line_items.slice(0, 3).map((item, index) => (
                                <div key={index}>
                                  {item.name} × {item.quantity}
                                </div>
                              ))}
                              {order.line_items.length > 3 && (
                                <div className="text-gray-500">
                                  +{order.line_items.length - 3} more items
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="mt-4 flex gap-2">
                            {(fulfillment?.state === 'PROPOSED' || fulfillment?.state === 'PENDING') && (
                              <button
                                onClick={() => updateOrderStatus(order.id, 'PREPARED')}
                                disabled={updatingOrderId === order.id}
                                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-3 py-1 rounded text-sm font-medium flex items-center gap-2"
                              >
                                {updatingOrderId === order.id && (
                                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                )}
                                Mark Ready for Pickup
                              </button>
                            )}
                            {fulfillment?.state === 'PREPARED' && (
                              <button
                                onClick={() => updateOrderStatus(order.id, 'COMPLETED')}
                                disabled={updatingOrderId === order.id}
                                className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-3 py-1 rounded text-sm font-medium flex items-center gap-2"
                              >
                                {updatingOrderId === order.id && (
                                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                )}
                                Mark as Picked Up
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
