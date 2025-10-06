'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';

interface PerformanceResult {
  categoryId: string;
  freshApiTime: number;
  cachedTime: number;
  speedImprovement: string;
  cacheMultiplier: string;
  bookCount: number;
  imagesFound: number;
  testTime: string;
  imageTestResults?: {
    imagesRequested: number;
    imagesRetrieved: number;
    imageTime: number;
  };
}

interface ApiTestResult {
  name: string;
  path: string;
  success: boolean;
  data?: unknown;
  responseTime: number;
  status: number | string;
  error?: string;
  itemCount: number | null;
}

interface Category {
  id: string;
  name: string;
}

interface RedisHealth {
  status: 'connected' | 'disconnected' | 'error';
  pingTime?: number;
  error?: string;
  clientType?: 'cluster' | 'single';
  serverInfo?: Record<string, string>;
  memoryInfo?: Record<string, string>;
}

interface CacheStatusResponse {
  success: boolean;
  data: {
    redis: RedisHealth;
    application: {
      lastChecked: string;
      features: {
        categoriesCache: boolean;
        booksByCategory: boolean;
        bookDataCache: boolean;
        searchResultsCache: boolean;
        imageCaching: boolean;
      };
    };
  };
  error?: string;
}

export default function CacheMonitorPage() {
  const { user } = useAuth();
  const [redisStatus, setRedisStatus] = useState<CacheStatusResponse | null>(null);
  const [performanceResult, setPerformanceResult] = useState<PerformanceResult | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [apiResults, setApiResults] = useState<ApiTestResult[]>([]);
  const [categoriesLastUpdated, setCategoriesLastUpdated] = useState<string | null>(null);
  const [loading, setLoading] = useState({
    redisStatus: false,
    performance: false,
    categories: false,
    apiTest: false,
    cacheInvalidation: false,
  });

  // Function to fetch Redis status
  const fetchRedisStatus = async () => {
    setLoading(prev => ({ ...prev, redisStatus: true }));
    try {
      const response = await fetch('/api/admin/cache-status');
      const data = await response.json();
      setRedisStatus(data);
    } catch (error) {
      console.error('Failed to fetch Redis status:', error);
    } finally {
      setLoading(prev => ({ ...prev, redisStatus: false }));
    }
  };

  // Function to invalidate cache
  const invalidateCache = async (scope: string = 'all') => {
    setLoading(prev => ({ ...prev, cacheInvalidation: true }));
    try {
      const response = await fetch('/api/cache', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Basic ' + btoa('admin:change_me_in_production') // TODO: Use proper credentials
        },
        body: JSON.stringify({ scope })
      });
      
      const result = await response.json();
      if (result.success) {
        alert(`Cache invalidated successfully: ${result.message}`);
        // Refresh Redis status after invalidation
        fetchRedisStatus();
      } else {
        alert(`Cache invalidation failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Failed to invalidate cache:', error);
      alert('Failed to invalidate cache');
    } finally {
      setLoading(prev => ({ ...prev, cacheInvalidation: false }));
    }
  };

  // Function to test cache performance
  const runPerformanceTest = async (categoryId?: string) => {
    setLoading(prev => ({ ...prev, performance: true }));
    
    try {
      // Get a test category if none provided
      if (!categoryId && categories.length > 0) {
        categoryId = categories[0].id;
      }
      
      if (!categoryId) {
        alert('No category available for testing');
        return;
      }

      // First, clear cache for this category to ensure fresh test
      await fetch('/api/cache', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Basic ' + btoa('admin:change_me_in_production')
        },
        body: JSON.stringify({ scope: 'books_by_category', categoryId })
      });

      // Also clear image cache
      await fetch('/api/cache', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Basic ' + btoa('admin:change_me_in_production')
        },
        body: JSON.stringify({ scope: 'image-urls' })
      });

      // Test fresh API call (no cache)
      const freshStart = Date.now();
      const freshResponse = await fetch(`/api/square/category/${categoryId}`);
      const freshData = await freshResponse.json();
      const freshTime = Date.now() - freshStart;

      // Small delay to ensure cache is set
      await new Promise(resolve => setTimeout(resolve, 500));

      // Test cached API call
      const cachedStart = Date.now();
      const cachedResponse = await fetch(`/api/square/category/${categoryId}`);
      await cachedResponse.json(); // Just to complete the request
      const cachedTime = Date.now() - cachedStart;

      // Test image batch retrieval if books have images
      let imageTestResults = null;
      if (freshData.books?.length > 0) {
        const booksWithImages = freshData.books.filter((book: { imageId?: string }) => book.imageId);
        if (booksWithImages.length > 0) {
          const imageIds = booksWithImages.slice(0, 5).map((book: { imageId: string }) => book.imageId); // Test first 5 images
          
          // Test fresh image calls
          const imageFreshStart = Date.now();
          const imageResponse = await fetch('/api/square/images/batch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageIds })
          });
          const imageData = await imageResponse.json();
          const imageFreshTime = Date.now() - imageFreshStart;
          
          imageTestResults = {
            imagesRequested: imageIds.length,
            imagesRetrieved: imageData.images?.length || 0,
            imageTime: imageFreshTime
          };
        }
      }

      // Calculate performance metrics
      const speedImprovement = ((freshTime - cachedTime) / freshTime * 100).toFixed(1);
      const cacheMultiplier = (freshTime / cachedTime).toFixed(1);

      const result: PerformanceResult = {
        categoryId,
        freshApiTime: freshTime,
        cachedTime,
        speedImprovement: `${speedImprovement}%`,
        cacheMultiplier: `${cacheMultiplier}x`,
        bookCount: freshData.books?.length || 0,
        imagesFound: freshData.books?.filter((book: { imageId?: string }) => book.imageId).length || 0,
        testTime: new Date().toISOString(),
        ...(imageTestResults && { imageTestResults })
      };

      setPerformanceResult(result);
    } catch (error) {
      console.error('Performance test failed:', error);
      alert('Performance test failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setLoading(prev => ({ ...prev, performance: false }));
    }
  };

  // Function to fetch categories for testing
  const fetchCategories = async () => {
    setLoading(prev => ({ ...prev, categories: true }));
    try {
      const response = await fetch('/api/square/categories');
      const data = await response.json();
      
      if (data.categories && Array.isArray(data.categories)) {
        setCategories(data.categories.slice(0, 10)); // Increased to first 10 for testing
        setCategoriesLastUpdated(new Date().toLocaleTimeString());
        console.log(`Categories refreshed: ${data.categories.length} total, showing first 10`);
      } else if (data.error) {
        console.error('API returned error:', data.error);
        alert(`Failed to fetch categories: ${data.error}`);
      } else {
        console.error('Unexpected response format:', data);
        alert('Unexpected response format from categories API');
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      alert('Failed to fetch categories: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setLoading(prev => ({ ...prev, categories: false }));
    }
  };

  // Function to test all API endpoints
  const testAllEndpoints = async () => {
    setLoading(prev => ({ ...prev, apiTest: true }));
    setApiResults([]);

    const endpoints = [
      { name: 'Categories', path: '/api/square/categories' },
      { name: 'Search Status', path: '/api/search/status' },
      { name: 'Cache Health', path: '/api/cache' },
      { name: 'Admin Cache Status', path: '/api/admin/cache-status' },
    ];

    const results: ApiTestResult[] = [];

    for (const endpoint of endpoints) {
      try {
        const start = Date.now();
        const response = await fetch(endpoint.path);
        const responseTime = Date.now() - start;
        const data = await response.json();
        
        let itemCount = null;
        if (endpoint.name === 'Categories' && data.categories) {
          itemCount = data.categories.length;
        }

        results.push({
          name: endpoint.name,
          path: endpoint.path,
          success: response.ok,
          data,
          responseTime,
          status: response.status,
          itemCount,
        });
      } catch (error) {
        results.push({
          name: endpoint.name,
          path: endpoint.path,
          success: false,
          responseTime: 0,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
          itemCount: null,
        });
      }
    }

    setApiResults(results);
    setLoading(prev => ({ ...prev, apiTest: false }));
  };

  // Load categories on component mount
  useEffect(() => {
    fetchCategories();
  }, []);

  // Redirect if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">You need to be logged in to access the cache monitor.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Cache Performance Monitor</h1>
                <p className="text-gray-600">Monitor your Square API cache performance in real-time</p>
              </div>
              <Link
                href="/admin"
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Back to Admin
              </Link>
            </div>
          </div>

          <div className="p-6 space-y-8">
            {/* Redis Status Section */}
            <div className="bg-blue-50 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Redis Cache Cluster</h2>
                <div className="flex gap-2">
                  <button
                    onClick={fetchRedisStatus}
                    disabled={loading.redisStatus}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {loading.redisStatus ? 'Loading...' : 'Check Redis Status'}
                  </button>
                  <button
                    onClick={() => invalidateCache('all')}
                    disabled={loading.cacheInvalidation}
                    className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {loading.cacheInvalidation ? 'Clearing...' : 'Clear All Cache'}
                  </button>
                </div>
              </div>

              {redisStatus && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className={`p-4 rounded-lg border-l-4 ${
                    redisStatus.data.redis.status === 'connected' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'
                  }`}>
                    <h3 className="font-medium text-gray-900">Connection Status</h3>
                    <p className="text-lg font-bold">{redisStatus.data.redis.status.toUpperCase()}</p>
                    {redisStatus.data.redis.clientType && (
                      <p className="text-sm text-gray-600">Type: {redisStatus.data.redis.clientType}</p>
                    )}
                  </div>
                  
                  {redisStatus.data.redis.pingTime && (
                    <div className={`p-4 rounded-lg border-l-4 ${
                      redisStatus.data.redis.pingTime < 10 ? 'border-green-500 bg-green-50' :
                      redisStatus.data.redis.pingTime < 50 ? 'border-yellow-500 bg-yellow-50' : 'border-red-500 bg-red-50'
                    }`}>
                      <h3 className="font-medium text-gray-900">Ping Time</h3>
                      <p className="text-lg font-bold">{redisStatus.data.redis.pingTime}ms</p>
                    </div>
                  )}

                  <div className="p-4 rounded-lg border-l-4 border-blue-500 bg-blue-50">
                    <h3 className="font-medium text-gray-900">Cache Features</h3>
                    <div className="text-sm space-y-1">
                      <div className={redisStatus.data.application.features.categoriesCache ? 'text-green-600' : 'text-red-600'}>
                        • Categories: {redisStatus.data.application.features.categoriesCache ? 'Active' : 'Inactive'}
                      </div>
                      <div className={redisStatus.data.application.features.booksByCategory ? 'text-green-600' : 'text-red-600'}>
                        • Books by Category: {redisStatus.data.application.features.booksByCategory ? 'Active' : 'Inactive'}
                      </div>
                      <div className={redisStatus.data.application.features.bookDataCache ? 'text-green-600' : 'text-red-600'}>
                        • Book Data: {redisStatus.data.application.features.bookDataCache ? 'Active' : 'Inactive'}
                      </div>
                      <div className={redisStatus.data.application.features.imageCaching ? 'text-green-600' : 'text-red-600'}>
                        • Image Caching: {redisStatus.data.application.features.imageCaching ? 'Active' : 'Inactive'}
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg border-l-4 border-gray-500 bg-gray-50">
                    <h3 className="font-medium text-gray-900">Last Checked</h3>
                    <p className="text-sm text-gray-600">{new Date(redisStatus.data.application.lastChecked).toLocaleString()}</p>
                  </div>
                </div>
              )}

              {redisStatus?.data.redis.error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                  <strong>Redis Error:</strong> {redisStatus.data.redis.error}
                </div>
              )}

              {redisStatus?.data.redis.serverInfo && (
                <div className="bg-white rounded p-4 border">
                  <h4 className="font-medium text-gray-900 mb-2">Redis Server Info:</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    {Object.entries(redisStatus.data.redis.serverInfo).slice(0, 9).map(([key, value]) => (
                      <div key={key}>
                        <span className="font-medium">{key}:</span> {value}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => invalidateCache('categories')}
                  disabled={loading.cacheInvalidation}
                  className="bg-orange-500 text-white px-3 py-1 rounded text-sm hover:bg-orange-600 disabled:bg-gray-400"
                >
                  Clear Categories
                </button>
                <button
                  onClick={() => invalidateCache('books-by-category')}
                  disabled={loading.cacheInvalidation}
                  className="bg-orange-500 text-white px-3 py-1 rounded text-sm hover:bg-orange-600 disabled:bg-gray-400"
                >
                  Clear Books by Category
                </button>
                <button
                  onClick={() => invalidateCache('book-data')}
                  disabled={loading.cacheInvalidation}
                  className="bg-orange-500 text-white px-3 py-1 rounded text-sm hover:bg-orange-600 disabled:bg-gray-400"
                >
                  Clear Book Data
                </button>
                <button
                  onClick={() => invalidateCache('image-urls')}
                  disabled={loading.cacheInvalidation}
                  className="bg-orange-500 text-white px-3 py-1 rounded text-sm hover:bg-orange-600 disabled:bg-gray-400"
                >
                  Clear Image Cache
                </button>
              </div>
            </div>

            {/* Performance Testing Section */}
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Cache Performance Testing</h2>
                  <p className="text-sm text-gray-600">Test cache performance vs fresh API calls</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => runPerformanceTest()}
                    disabled={loading.performance || categories.length === 0}
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {loading.performance ? 'Testing...' : 'Run Test'}
                  </button>
                  <button
                    onClick={fetchCategories}
                    disabled={loading.categories}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200 transform active:scale-95"
                  >
                    {loading.categories ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Loading...
                      </div>
                    ) : (
                      'Refresh Categories'
                    )}
                  </button>
                </div>
              </div>

              {categories.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Test Category ({categories.length} available):
                    </label>
                    {categoriesLastUpdated && (
                      <span className="text-xs text-gray-500">
                        Last updated: {categoriesLastUpdated}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => runPerformanceTest(category.id)}
                        disabled={loading.performance}
                        className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1 rounded text-sm disabled:bg-gray-100 transition-colors"
                      >
                        {category.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {categories.length === 0 && !loading.categories && (
                <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-yellow-800 text-sm">
                    No categories loaded. Click &quot;Refresh Categories&quot; to load categories for testing.
                  </p>
                </div>
              )}

              {loading.categories && (
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
                    <span className="text-blue-800 text-sm">Loading categories...</span>
                  </div>
                </div>
              )}

              {performanceResult && (
                <div className="bg-white rounded-lg p-4 border">
                  <h3 className="font-medium text-gray-900 mb-3">Performance Test Results</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-3 bg-red-50 rounded border-l-4 border-red-500">
                      <p className="text-sm font-medium text-gray-600">Fresh API Call</p>
                      <p className="text-lg font-bold text-red-600">{performanceResult.freshApiTime}ms</p>
                    </div>
                    <div className="p-3 bg-green-50 rounded border-l-4 border-green-500">
                      <p className="text-sm font-medium text-gray-600">Cached Call</p>
                      <p className="text-lg font-bold text-green-600">{performanceResult.cachedTime}ms</p>
                    </div>
                    <div className="p-3 bg-blue-50 rounded border-l-4 border-blue-500">
                      <p className="text-sm font-medium text-gray-600">Speed Improvement</p>
                      <p className="text-lg font-bold text-blue-600">{performanceResult.speedImprovement}</p>
                    </div>
                    <div className="p-3 bg-purple-50 rounded border-l-4 border-purple-500">
                      <p className="text-sm font-medium text-gray-600">Cache Multiplier</p>
                      <p className="text-lg font-bold text-purple-600">{performanceResult.cacheMultiplier}</p>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t flex justify-between text-sm text-gray-600">
                    <span>Books: {performanceResult.bookCount}</span>
                    <span>Images: {performanceResult.imagesFound}</span>
                    <span>Tested: {new Date(performanceResult.testTime).toLocaleTimeString()}</span>
                  </div>
                  {performanceResult.imageTestResults && (
                    <div className="mt-2 pt-2 border-t bg-blue-50 p-3 rounded">
                      <h4 className="text-sm font-medium text-blue-900 mb-1">Image Load Test:</h4>
                      <div className="text-sm text-blue-700">
                        <span>Loaded {performanceResult.imageTestResults.imagesRetrieved}/{performanceResult.imageTestResults.imagesRequested} images in {performanceResult.imageTestResults.imageTime}ms</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {loading.performance && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
                    <span className="text-blue-800">Running performance test...</span>
                  </div>
                </div>
              )}
            </div>

            {/* API Response Times Section */}
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">API Response Times</h2>
                <button
                  onClick={testAllEndpoints}
                  disabled={loading.apiTest}
                  className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 disabled:bg-gray-400"
                >
                  {loading.apiTest ? 'Testing...' : 'Test All Endpoints'}
                </button>
              </div>

              {apiResults.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {apiResults.map((result, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border-l-4 ${
                        result.responseTime < 200 ? 'border-green-500 bg-green-50' :
                        result.responseTime < 1000 ? 'border-yellow-500 bg-yellow-50' : 'border-red-500 bg-red-50'
                      }`}
                    >
                      <h3 className="font-medium text-gray-900">{result.name}</h3>
                      <p className="text-lg font-bold">{result.responseTime}ms</p>
                      <p className="text-sm text-gray-600">Status: {result.status}</p>
                      {result.itemCount !== null && (
                        <p className="text-sm text-gray-600">{result.itemCount} items</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}