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
    total_money: {
      amount: number;
      currency: string;
    };
    note?: string;
  }>;
  fulfillments?: Array<{
    state?: string;
    type?: string;
    pickup_details?: {
      recipient?: {
        display_name?: string;
        email_address?: string;
        phone_number?: string;
      };
      schedule_type?: string;
      pickup_at?: string;
      note?: string;
    };
  }>;
  tenders?: Array<{
    type: string;
    card_details?: {
      card?: {
        brand?: string;
        last_4?: string;
      };
    };
    cash_details?: {
      buyer_tendered_money?: {
        amount: number;
        currency: string;
      };
    };
  }>;
  source?: {
    name?: string;
  };
  customer_id?: string;
}

interface Customer {
  id: string;
  given_name?: string;
  family_name?: string;
  email_address?: string;
  phone_number?: string;
}

export default function AdminPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<'recent' | 'search'>('recent');
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Record<string, Customer>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchEmail, setSearchEmail] = useState('');
  const [searchOrders, setSearchOrders] = useState<Order[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  // Fetch customers for better display
  const fetchCustomers = useCallback(async () => {
    try {
      const response = await fetch('/api/orders/admin/customers');
      if (!response.ok) {
        return;
      }
      const data = await response.json();
      if (data.success && Array.isArray(data.customers)) {
        const customerMap: Record<string, Customer> = {};
        data.customers.forEach((customer: Customer) => {
          customerMap[customer.id] = customer;
        });
        setCustomers(customerMap);
      }
    } catch (err) {
      console.error('Error fetching customers:', err);
    }
  }, []);

  // Fetch recent orders
  const fetchRecentOrders = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/orders/admin/recent-orders');
      const data = await response.json();

      if (data.success) {
        setOrders(data.orders || []);
      } else {
        setError(data.error || 'Failed to load orders');
      }
    } catch (err) {
      console.error('Error fetching recent orders:', err);
      setError('An error occurred while fetching orders');
    } finally {
      setLoading(false);
    }
  }, []);

  const searchOrdersByEmail = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!searchEmail.trim()) {
      setSearchError('Please enter an email address');
      return;
    }

    setSearchLoading(true);
    setSearchError(null);

    try {
      const encodedEmail = encodeURIComponent(searchEmail.trim());
      const response = await fetch(`/api/orders/admin/search-by-email/${encodedEmail}`);

      const data = await response.json();

      if (data.success) {
        setSearchOrders(data.orders || []);
      } else {
        setSearchError(data.error || 'Failed to search orders');
      }
    } catch (err) {
      console.error('Error searching orders by email:', err);
      setSearchError('An error occurred while searching orders');
    } finally {
      setSearchLoading(false);
    }
  };

  // Update order status (processed / ready / picked up)
  const updateOrderStatus = async (
    orderId: string,
    status: 'PREPARED' | 'COMPLETED' | 'RESERVED'
  ) => {
    try {
      setUpdatingOrderId(orderId);
      const response = await fetch(`/api/orders/admin/${orderId}/pickup-status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });

      const data = await response.json();

      if (data.success) {
        setOrders(prevOrders =>
          prevOrders.map(order => {
            if (order.id === orderId) {
              return {
                ...order,
                fulfillments: (order.fulfillments || []).map(fulfillment => ({
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
      setUpdatingOrderId(null);
    }
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

  // Check if user is admin and fetch orders
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push(
          '/login?message=' +
            encodeURIComponent('Please log in to access admin dashboard.')
        );
        return;
      }
      if (user.email !== 'groundworkbookscollective@gmail.com') {
        router.push(
          '/login?message=' +
            encodeURIComponent('Access denied. Admin login required.')
        );
        return;
      }
      fetchRecentOrders();
      fetchCustomers();
    }
  }, [authLoading, user, router, fetchRecentOrders, fetchCustomers]);

  const renderOrders = (ordersToRender: Order[], emptyMessage: string) => {
    if (!ordersToRender.length) {
      return (
        <div className="text-center py-8 text-gray-500">
          {emptyMessage}
        </div>
      );
    }

    return (
      <ul className="space-y-4">
        {ordersToRender.map(order => {
          const fulfillment = order.fulfillments?.[0];
          const pickupDetails = fulfillment?.pickup_details;
          const recipient = pickupDetails?.recipient;

          const tender = order.tenders?.[0];
          const isCardPayment = tender?.type === 'CARD';
          const isCashPayment = tender?.type === 'CASH';
          const isOnlineOrder =
            order.source?.name &&
            order.source.name.toLowerCase().includes('online');

          const customer = order.customer_id ? customers[order.customer_id] : null;

          return (
            <li
              key={order.id}
              className="bg-white rounded-lg shadow p-4 border border-gray-100"
            >
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="text-xs font-mono text-gray-400">
                      Order ID: {order.id}
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${getStatusColor(
                        fulfillment?.state || order.state
                      )}`}
                    >
                      {getStatusText(fulfillment?.state || order.state)}
                    </span>
                    {isOnlineOrder && (
                      <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-800">
                        Online Order
                      </span>
                    )}
                  </div>

                  <div className="mb-2">
                    <div className="text-sm text-gray-600">
                      Placed on:{' '}
                      {new Date(order.created_at).toLocaleString()}
                    </div>
                    <div className="text-sm font-semibold text-gray-800">
                      Total:{' '}
                      {formatAmount(order.total_money.amount)}{' '}
                      {order.total_money.currency}
                    </div>
                  </div>

                  {order.line_items?.length > 0 && (
                    <div className="mt-2">
                      <div className="text-sm font-semibold text-gray-700 mb-1">
                        Items:
                      </div>
                      <ul className="text-sm text-gray-700 space-y-1">
                        {order.line_items.map((item, index) => (
                          <li
                            key={index}
                            className="flex justify-between"
                          >
                            <span>
                              {item.quantity} × {item.name}
                              {item.note && (
                                <span className="ml-2 text-xs text-gray-500">
                                  ({item.note})
                                </span>
                              )}
                            </span>
                            <span className="font-medium">
                              {formatAmount(item.total_money.amount)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-4">
                  <div className="mb-3">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                      Customer
                    </div>
                    {customer ? (
                      <div className="text-sm text-gray-800">
                        <div>
                          {customer.given_name || customer.family_name
                            ? `${customer.given_name || ''} ${
                                customer.family_name || ''
                              }`.trim()
                            : 'Unknown Customer'}
                        </div>
                        {customer.email_address && (
                          <div className="text-xs text-gray-500">
                            {customer.email_address}
                          </div>
                        )}
                        {customer.phone_number && (
                          <div className="text-xs text-gray-500">
                            {customer.phone_number}
                          </div>
                        )}
                      </div>
                    ) : recipient ? (
                      <div className="text-sm text-gray-800">
                        <div>
                          {recipient.display_name || 'Unknown Customer'}
                        </div>
                        {recipient.email_address && (
                          <div className="text-xs text-gray-500">
                            {recipient.email_address}
                          </div>
                        )}
                        {recipient.phone_number && (
                          <div className="text-xs text-gray-500">
                            {recipient.phone_number}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500">
                        No customer information
                      </div>
                    )}
                  </div>

                  <div className="mb-3">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                      Fulfillment
                    </div>
                    {pickupDetails ? (
                      <div className="text-sm text-gray-800 space-y-1">
                        <div>
                          <span className="font-medium">
                            Type:
                          </span>{' '}
                          {fulfillment?.type || 'Pickup'}
                        </div>
                        {pickupDetails.schedule_type && (
                          <div>
                            <span className="font-medium">
                              Schedule:
                            </span>{' '}
                            {pickupDetails.schedule_type}
                          </div>
                        )}
                        {pickupDetails.pickup_at && (
                          <div>
                            <span className="font-medium">
                              Pickup at:
                            </span>{' '}
                            {new Date(
                              pickupDetails.pickup_at
                            ).toLocaleString()}
                          </div>
                        )}
                        {pickupDetails.note && (
                          <div className="text-xs text-gray-500">
                            {pickupDetails.note}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500">
                        No fulfillment details (likely in-person sale)
                      </div>
                    )}
                  </div>

                  <div className="mb-3">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                      Payment
                    </div>
                    {isCardPayment ? (
                      <div className="text-sm text-gray-800">
                        Card ending in{' '}
                        {tender!.card_details!.card!.last_4}{' '}
                        ({tender!.card_details!.card!.brand})
                      </div>
                    ) : isCashPayment ? (
                      <div className="text-sm text-gray-800">
                        Cash payment of{' '}
                        {formatAmount(
                          tender!.cash_details!
                            .buyer_tendered_money!.amount
                        )}{' '}
                        {
                          tender!.cash_details!
                            .buyer_tendered_money!.currency
                        }
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500">
                        Payment details unavailable
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-400">
                      Source: {order.source?.name || 'Unknown'}
                    </div>
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="text-xs text-indigo-600 hover:text-indigo-800"
                    >
                      View Details
                    </Link>
                  </div>

                  {/* Status action buttons */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {/* Mark as Processed (RESERVED) */}
                    {fulfillment &&
                      (fulfillment.state === 'PROPOSED' ||
                        fulfillment.state === 'PENDING') && (
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
                                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                              ></path>
                            </svg>
                          )}
                          Mark as Processed
                        </button>
                      )}

                    {/* Mark Ready for Pickup (PREPARED) */}
                    {fulfillment &&
                      (fulfillment.state === 'PROPOSED' ||
                        fulfillment.state === 'PENDING' ||
                        fulfillment.state === 'RESERVED') && (
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
                                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                              ></path>
                            </svg>
                          )}
                          Mark Ready for Pickup
                        </button>
                      )}

                    {/* Mark as Picked Up (COMPLETED) */}
                    {fulfillment &&
                      fulfillment.state === 'PREPARED' && (
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
                                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                              ></path>
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
    );
  };

  const renderContent = () => {
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
                <h1 className="text-2xl font-bold text-gray-900">
                  Admin Dashboard
                </h1>
              </div>
              <div className="flex items-center gap-4">
                <Link
                  href="/admin/cache-monitor"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  Cache Monitor
                </Link>
                <span className="text-sm text-gray-600">
                  Welcome, {user.email}
                </span>
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
                  onClick={() => setActiveTab('recent')}
                  className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'recent'
                      ? 'border-gw-green text-gw-green'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Recent Orders
                </button>
                <button
                  onClick={() => setActiveTab('search')}
                  className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'search'
                      ? 'border-gw-green text-gw-green'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Search by Email
                </button>
              </nav>
            </div>

            {/* Recent Orders Tab */}
            {activeTab === 'recent' && (
              <div>
                {error && (
                  <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {error}
                  </div>
                )}

                {loading && (
                  <div className="text-center py-4">
                    <div className="inline-flex items-center gap-2 text-gray-600">
                      <svg
                        className="animate-spin h-5 w-5"
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
                          d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                        ></path>
                      </svg>
                      <span>Loading recent orders...</span>
                    </div>
                  </div>
                )}

                {!loading &&
                  renderOrders(
                    orders,
                    'No recent orders found. Try refreshing later.'
                  )}
              </div>
            )}

            {/* Search by Email Tab */}
            {activeTab === 'search' && (
              <div>
                <form
                  onSubmit={searchOrdersByEmail}
                  className="flex flex-col sm:flex-row gap-3 mb-4"
                >
                  <input
                    type="email"
                    value={searchEmail}
                    onChange={e => setSearchEmail(e.target.value)}
                    placeholder="Enter customer email"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="submit"
                    disabled={searchLoading}
                    className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gw-green hover:bg-gw-green-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gw-green disabled:opacity-50"
                  >
                    {searchLoading ? (
                      <>
                        <svg
                          className="animate-spin h-4 w-4 mr-2"
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
                            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                          ></path>
                        </svg>
                        Searching...
                      </>
                    ) : (
                      'Search'
                    )}
                  </button>
                </form>

                {searchError && (
                  <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {searchError}
                  </div>
                )}

                {searchLoading && (
                  <div className="text-center py-4">
                    <div className="inline-flex items-center gap-2 text-gray-600">
                      <svg
                        className="animate-spin h-5 w-5"
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
                          d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                        ></path>
                      </svg>
                      <span>Searching orders...</span>
                    </div>
                  </div>
                )}

                {!searchLoading &&
                  renderOrders(
                    searchOrders,
                    'No orders found for this email address.'
                  )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return renderContent();
}
