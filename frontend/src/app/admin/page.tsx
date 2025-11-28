'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
  fulfillments?: Array<{
    uid?: string;
    type?: string;
    state?: string;
    pickup_details?: {
      recipient?: {
        display_name: string;
        email_address: string;
        phone_number?: string;
      };
      note?: string;
    };
  }>;
}

interface OrderSearchResponse {
  success?: boolean;
  error?: string;
  orders?: Order[];
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
      const response = await fetch(`/api/orders/admin/recent-orders?limit=20`);
      const data = await response.json();
      
      if (data.success) {
        setOrders(data.orders || []);
      } else {
        setError(data.error || 'Failed to fetch orders');
      }
    } catch (err) {
      console.error('Error fetching recent orders:', err);
      setError('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateOrderStatus = async (orderId: string, status: 'PREPARED' | 'COMPLETED' | 'RESERVED') => {
    try {
      setUpdatingOrderId(orderId); // Show loading state for specific order
      const response = await fetch(`/api/orders/admin/${orderId}/pickup-status`, {
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
                fulfillments: order.fulfillments?.map(fulfillment => ({
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
      console.error('Error updating order status:', err);
      setError('Failed to update order status');
    } finally {
      setUpdatingOrderId(null); // Clear loading state
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatAmount = (amount: number) => {
    return `$${(amount / 100).toFixed(2)}`;
  };

  const getStatusColor = (state: string) => {
    switch (state) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'PREPARED':
        return 'bg-blue-100 text-blue-800';
      case 'RESERVED':
        return 'bg-yellow-100 text-yellow-800';
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
      case 'RESERVED':
        return 'Processed';
      case 'PROPOSED':
      case 'PENDING':
        return 'Preparing Order';
      default:
        return `Processing (${state})`;
    }
  };

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
      const response = await fetch(`/api/orders/admin/search-by-email/${encodeURIComponent(searchEmail)}`);
      const data = await response.json();
      
      if (data.success) {
        setOrders(data.orders || []);
      } else {
        setError(data.error || 'Failed to search orders');
      }
    } catch (err) {
      console.error('Error searching orders:', err);
      setError('Failed to search orders');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab: 'recent' | 'search') => {
    setActiveTab(tab);
    if (tab === 'recent') {
      // Refresh recent orders when switching back to this tab
      fetchRecentOrders();
    } else {
      // Clear previous search state
      setSearchEmail('');
      setOrders([]);
      setError('');
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
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-1">
              View and manage recent orders from the online store and in-person sales.
            </p>
          </div>
          <div className="mt-3 sm:mt-0 flex gap-3">
            <Link
              href="/admin/cache-monitor"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Cache Monitor
            </Link>
            <span className="text-sm text-gray-600">Welcome, {user.email}</span>
            <button
              onClick={() => router.push('/')}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Back to Site
            </button>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-11.75a.75.75 0 00-1.5 0v4.5a.75.75 0 001.5 0v-4.5zm0 6.5a.75.75 0 10-1.5 0 .75.75 0 001.5 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
              </div>
            </div>
          </div>
        )}

        {/* Tabs and search */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="border-b border-gray-200 px-4 py-3 sm:px-6 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => handleTabChange('recent')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                  activeTab === 'recent'
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Recent orders
              </button>
              <button
                type="button"
                onClick={() => handleTabChange('search')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                  activeTab === 'search'
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Search by email
              </button>
            </div>
            <button
              type="button"
              onClick={fetchRecentOrders}
              className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
            >
              Refresh
            </button>
          </div>

          {activeTab === 'search' && (
            <div className="px-4 py-3 sm:px-6 border-b border-gray-200">
              <form
                onSubmit={searchOrdersByEmail}
                className="flex flex-col sm:flex-row gap-3 sm:items-center"
              >
                <div className="flex-1">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Customer email
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={searchEmail}
                    onChange={(e) => setSearchEmail(e.target.value)}
                    placeholder="customer@example.com"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-900 focus:ring-gray-900 sm:text-sm"
                  />
                </div>
                <div className="mt-2 sm:mt-6 flex gap-2">
                  <button
                    type="submit"
                    className="inline-flex items-center rounded-md border border-transparent bg-gray-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-gray-800"
                  >
                    Search orders
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchEmail('');
                      fetchRecentOrders();
                      setActiveTab('recent');
                    }}
                    className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                  >
                    Clear
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="px-4 py-4 sm:px-6">
            {loading ? (
              <div className="py-10 flex justify-center">
                <div className="flex flex-col items-center gap-2">
                  <svg
                    className="animate-spin h-6 w-6 text-gray-600"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <div className="text-gray-600 text-sm">Loading orders...</div>
                </div>
              </div>
            ) : orders.length === 0 ? (
              <div className="py-10 text-center text-gray-500 text-sm">No orders found</div>
            ) : (
              <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-gray-200">
                  {orders.map((order) => {
                    const fulfillment = order.fulfillments?.[0];
                    const pickupDetails = fulfillment?.pickup_details;
                    const itemCount = order.line_items.reduce(
                      (total, item) => total + parseInt(item.quantity),
                      0
                    );

                    return (
                      <li key={order.id}>
                        <div className="px-4 py-4 sm:px-6">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-lg font-semibold text-gray-900">
                                    Order #{order.id.slice(-8)}
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    {formatDate(order.created_at)} • {itemCount}{' '}
                                    {itemCount === 1 ? 'item' : 'items'}
                                  </p>
                                  {pickupDetails?.recipient && (
                                    <p className="text-sm text-gray-600 mt-1">
                                      📧 {pickupDetails.recipient.display_name} (
                                      {pickupDetails.recipient.email_address})
                                      {pickupDetails.recipient.phone_number && (
                                        <span>
                                          {' '}
                                          • 📱 {pickupDetails.recipient.phone_number}
                                        </span>
                                      )}
                                    </p>
                                  )}
                                </div>
                                <div className="text-right">
                                  <span
                                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                      fulfillment?.state || 'PROPOSED'
                                    )}`}
                                  >
                                    {getStatusText(fulfillment?.state || 'PROPOSED')}
                                  </span>
                                  <p className="mt-2 text-lg font-semibold text-gray-900">
                                    {formatAmount(order.total_money.amount)}
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
                                {(fulfillment?.state === 'PROPOSED' ||
                                  fulfillment?.state === 'PENDING') && (
                                  <button
                                    onClick={() =>
                                      updateOrderStatus(order.id, 'RESERVED')
                                    }
                                    disabled={updatingOrderId === order.id}
                                    className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded text-sm font-medium flex items-center gap-2"
                                  >
                                    {updatingOrderId === order.id && (
                                      <svg
                                        className="animate-spin h-4 w-4"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                      >
                                        <circle
                                          className="opacity-25"
                                          cx="12"
                                          cy="12"
                                          r="10"
                                          stroke="currentColor"
                                          strokeWidth="4"
                                        ></circle>
                                        <path
                                          className="opacity-75"
                                          fill="currentColor"
                                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        ></path>
                                      </svg>
                                    )}
                                    Mark as Processed
                                  </button>
                                )}

                                {(fulfillment?.state === 'PROPOSED' ||
                                  fulfillment?.state === 'PENDING' ||
                                  fulfillment?.state === 'RESERVED') && (
                                  <button
                                    onClick={() =>
                                      updateOrderStatus(order.id, 'PREPARED')
                                    }
                                    disabled={updatingOrderId === order.id}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm font-medium flex items-center gap-2"
                                  >
                                    {updatingOrderId === order.id && (
                                      <svg
                                        className="animate-spin h-4 w-4"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                      >
                                        <circle
                                          className="opacity-25"
                                          cx="12"
                                          cy="12"
                                          r="10"
                                          stroke="currentColor"
                                          strokeWidth="4"
                                        ></circle>
                                        <path
                                          className="opacity-75"
                                          fill="currentColor"
                                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        ></path>
                                      </svg>
                                    )}
                                    Mark Ready for Pickup
                                  </button>
                                )}

                                {fulfillment?.state === 'PREPARED' && (
                                  <button
                                    onClick={() =>
                                      updateOrderStatus(order.id, 'COMPLETED')
                                    }
                                    disabled={updatingOrderId === order.id}
                                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm font-medium flex items-center gap-2"
                                  >
                                    {updatingOrderId === order.id && (
                                      <svg
                                        className="animate-spin h-4 w-4"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                      >
                                        <circle
                                          className="opacity-25"
                                          cx="12"
                                          cy="12"
                                          r="10"
                                          stroke="currentColor"
                                          strokeWidth="4"
                                        ></circle>
                                        <path
                                          className="opacity-75"
                                          fill="currentColor"
                                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        ></path>
                                      </svg>
                                    )}
                                    Mark as Picked Up
                                  </button>
                                )}
                              </div>
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
    </div>
  );
}
