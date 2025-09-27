'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';

interface CacheStatus {
  status: string;
  cacheDir: string;
  totalCacheFiles: number;
  categoryFiles: number;
  imageCacheStats?: {
    imageCount: number;
    sizeKB: string;
  };
  cacheFiles: Array<{
    file: string;
    sizeKB: string;
    ageHours: string;
    lastModified: string;
  }>;
  serverTime: string;
}

interface PerformanceResult {
  categoryId: string;
  freshApiTime: number;
  cachedTime: number;
  speedImprovement: string;
  cacheMultiplier: string;
  bookCount: number;
  imagesFound: number;
  testTime: string;
}

interface ApiResult<T = unknown> {
  success: boolean;
  data?: T;
  responseTime: number;
  status: number | string;
  error?: string;
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

export default function CacheMonitorPage() {
  const { user } = useAuth();
  const [cacheStatus, setCacheStatus] = useState<CacheStatus | null>(null);
  const [performanceResult, setPerformanceResult] = useState<PerformanceResult | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [apiResults, setApiResults] = useState<ApiTestResult[]>([]);
  const [loading, setLoading] = useState({
    cacheStatus: false,
    performance: false,
    categories: false,
    apiTest: false,
  });

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
            {/* Cache Status Section */}
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Cache Status</h2>
                <button
                  onClick={() => {}}
                  disabled={loading.cacheStatus}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {loading.cacheStatus ? 'Loading...' : 'Refresh Cache Status'}
                </button>
              </div>

              {cacheStatus && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className={`p-4 rounded-lg border-l-4 ${
                    cacheStatus.status === 'cache_active' ? 'border-green-500 bg-green-50' : 'border-yellow-500 bg-yellow-50'
                  }`}>
                    <h3 className="font-medium text-gray-900">Cache Status</h3>
                    <p className="text-lg font-bold">{cacheStatus.status.replace('_', ' ').toUpperCase()}</p>
                  </div>
                  
                  <div className={`p-4 rounded-lg border-l-4 ${
                    cacheStatus.totalCacheFiles > 0 ? 'border-green-500 bg-green-50' : 'border-yellow-500 bg-yellow-50'
                  }`}>
                    <h3 className="font-medium text-gray-900">Cache Files</h3>
                    <p className="text-lg font-bold">{cacheStatus.totalCacheFiles} total files</p>
                    <p className="text-sm text-gray-600">{cacheStatus.categoryFiles} categories cached</p>
                  </div>

                  {cacheStatus.imageCacheStats && (
                    <div className="p-4 rounded-lg border-l-4 border-green-500 bg-green-50">
                      <h3 className="font-medium text-gray-900">Image Cache</h3>
                      <p className="text-lg font-bold">{cacheStatus.imageCacheStats.imageCount} images</p>
                      <p className="text-sm text-gray-600">Size: {cacheStatus.imageCacheStats.sizeKB}KB</p>
                    </div>
                  )}
                </div>
              )}

              {cacheStatus?.cacheFiles && cacheStatus.cacheFiles.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Recent Cache Files:</h4>
                  <div className="bg-gray-100 rounded p-3 overflow-x-auto">
                    <pre className="text-sm">
                      {cacheStatus.cacheFiles.slice(0, 10).map(file => {
                        const age = parseFloat(file.ageHours);
                        const ageColor = age < 1 ? 'text-green-600' : age < 24 ? 'text-yellow-600' : 'text-red-600';
                        return (
                          <div key={file.file} className={ageColor}>
                            {file.file} - {file.sizeKB}KB - {file.ageHours}h old
                          </div>
                        );
                      })}
                    </pre>
                  </div>
                </div>
              )}
            </div>

            {/* Performance Test Section */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Performance Test</h2>
              <p className="text-gray-600 mb-4">Test cache vs API performance for a specific category:</p>

              <div className="flex gap-4 mb-4">
                <button
                  onClick={() => {}}
                  disabled={loading.categories}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {loading.categories ? 'Loading...' : 'Load Categories'}
                </button>

                <button
                  onClick={() => {}}
                  disabled={!selectedCategory || loading.performance}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {loading.performance ? 'Testing...' : 'Run Performance Test'}
                </button>
              </div>

              {categories.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">Select a category to test:</h4>
                  <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-md">
                    {categories.map(category => (
                      <div
                        key={category.id}
                        onClick={() => setSelectedCategory(category)}
                        className={`p-2 cursor-pointer hover:bg-gray-100 ${
                          selectedCategory?.id === category.id ? 'bg-blue-100 border-blue-500' : ''
                        }`}
                      >
                        {category.name}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {performanceResult && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div className={`p-4 rounded-lg border-l-4 ${
                    performanceResult.cachedTime < 10 ? 'border-green-500 bg-green-50' : 'border-yellow-500 bg-yellow-50'
                  }`}>
                    <h3 className="font-medium text-gray-900">Cache Performance</h3>
                    <p className="text-lg font-bold">{performanceResult.cachedTime}ms (cached)</p>
                    <p className="text-sm text-gray-600">{performanceResult.freshApiTime}ms (fresh API)</p>
                  </div>

                  <div className={`p-4 rounded-lg border-l-4 ${
                    parseFloat(performanceResult.speedImprovement) > 80 ? 'border-green-500 bg-green-50' : 'border-yellow-500 bg-yellow-50'
                  }`}>
                    <h3 className="font-medium text-gray-900">Speed Improvement</h3>
                    <p className="text-lg font-bold">{performanceResult.speedImprovement} faster</p>
                    <p className="text-sm text-gray-600">{performanceResult.cacheMultiplier}x speed multiplier</p>
                  </div>

                  <div className="p-4 rounded-lg border-l-4 border-blue-500 bg-blue-50">
                    <h3 className="font-medium text-gray-900">Data Info</h3>
                    <p className="text-lg font-bold">{performanceResult.bookCount} books</p>
                    <p className="text-sm text-gray-600">{performanceResult.imagesFound} with images</p>
                  </div>
                </div>
              )}
            </div>

            {/* API Response Times Section */}
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">API Response Times</h2>
                <button
                  onClick={() => {}}
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