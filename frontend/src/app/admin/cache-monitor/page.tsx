'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { Book } from '@/lib/types';

type BookWithVariation = Book & { squareVariationId?: string };
type InventoryBatchResponse = { success?: boolean; available?: Record<string, number>; error?: string };
type PrefetchResponse = { error?: string };


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

interface SuperCacheTestResult {
  superCacheTime: number;
  normalFlowTime: number;
  superCacheSuccess: boolean;
  normalFlowSuccess: boolean;
  superCacheDataComplete: boolean;
  normalFlowDataComplete: boolean;
  speedImprovement: string;
  performanceMultiplier: string;
  testTime: string;
  superCacheStatus: 'HIT' | 'MISS' | 'ERROR';
  dataComparison: {
    superCacheBooks: number;
    normalFlowBooks: number;
    superCacheCategories: number;
    normalFlowCategories: number;
    superCacheImages: number;
    normalFlowImages: number;
  };
}

interface BookData {
  books: Book[];
}

interface NormalFlowData {
  categories: Category[];
  books: Record<string, Book[]>;
}

interface SuperCacheData {
  categories?: Category[];
  metadata?: {
    totalBooks?: number;
    imagesCount?: number;
  };
}

interface InventoryBatchTestResult {
  params: {
    nIds: number;
    chunkSize: number;
    runs: number;
  };
  batched: {
    samplesMs: number[];
    medianMs: number;
    p95Ms: number;
    minMs: number;
    maxMs: number;
    requestsMade: number;
  };
  single: {
    samplesMs: number[];
    medianMs: number;
    p95Ms: number;
    minMs: number;
    maxMs: number;
    requestsMade: number;
  };
  speedup: {
    percent: number;
    multiplier: number;
  };
  testTime: string;
}

interface PrefetchCoalesceResult {
  params: {
    nIds: number
    runs: number
    parallel: number
    chunkSize: number
  }
  cold: {
    ms: number
  }
  prefetch: {
    supported: boolean
    ms: number | null
    ok: boolean
  }
  warm: {
    ms: number
    headerSource?: string | null
  }
  coalesce: {
    samplesMs: number[]
    medianMs: number
    p95Ms: number
    minMs: number
    maxMs: number
    headerCoalescedHits: number
  }
  speedup: {
    warmVsColdMultiplier: number
    warmVsColdPercent: number
  }
  testTime: string
}

export default function CacheMonitorPage() {
  const { user } = useAuth();
  const [redisStatus, setRedisStatus] = useState<CacheStatusResponse | null>(null);
  const [performanceResult, setPerformanceResult] = useState<PerformanceResult | null>(null);
  const [superCacheResult, setSuperCacheResult] = useState<SuperCacheTestResult | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [apiResults, setApiResults] = useState<ApiTestResult[]>([]);
  const [categoriesLastUpdated, setCategoriesLastUpdated] = useState<string | null>(null);
  const [inventoryBatchResult, setInventoryBatchResult] = useState<InventoryBatchTestResult | null>(null);
  const [prefetchCoalesceResult, setPrefetchCoalesceResult] = useState<PrefetchCoalesceResult | null>(null);
  const [loading, setLoading] = useState({
    redisStatus: false,
    performance: false,
    superCacheTest: false,
    categories: false,
    apiTest: false,
    cacheInvalidation: false,
    inventoryBatch: false,
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

  // Function to test Super Cache vs Normal Flow performance
  const runSuperCacheTest = async () => {
    setLoading(prev => ({ ...prev, superCacheTest: true }));
    
    try {
      console.log('Starting Super Cache vs Normal Flow performance test...');
      
      // Step 1: Clear all relevant caches to ensure fair comparison
      console.log('Clearing caches for fair comparison...');
      await fetch('/api/cache', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Basic ' + btoa('admin:change_me_in_production')
        },
        body: JSON.stringify({ scope: 'all' })
      });

      // Small delay to ensure cache clearing is complete
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 2: Test Normal Flow (original getInitialStoreData method)
      console.log('Testing normal flow performance...');
      const normalFlowStart = Date.now();
      let normalFlowSuccess = false;
      let normalFlowData: NormalFlowData | null = null;
      
      try {
        // Simulate what the store page does with getInitialStoreData
        const categoryIds = (process.env.NEXT_PUBLIC_CATEGORY_IDS || '').split(',').map(s => s.trim()).filter(Boolean);
        
        // We'll call the individual APIs that getInitialStoreData calls
        const [categoriesResponse, ...categoryResponses] = await Promise.all([
          fetch('/api/square/categories'),
          ...categoryIds.slice(0, 3).map(id => fetch(`/api/square/category/${id}`)) // Test first 3 categories
        ]);
        
        const categoriesData = await categoriesResponse.json();
        const booksData: BookData[] = await Promise.all(categoryResponses.map(r => r.json()));
        
        normalFlowData = {
          categories: categoriesData.categories || [],
          books: booksData.reduce((acc, data, index) => {
            acc[categoryIds[index]] = data.books || [];
            return acc;
          }, {} as Record<string, Book[]>)
        };
        
        normalFlowSuccess = true;
      } catch (error) {
        console.error('Normal flow test failed:', error);
        normalFlowSuccess = false;
      }
      
      const normalFlowTime = Date.now() - normalFlowStart;

      // Step 3: Test Super Cache (first call will be cache miss, then cache hit)
      console.log('Testing super cache performance...');
      
      // First call - cache miss (will populate cache)
      const superCacheMissStart = Date.now();
      let superCacheResponse = await fetch('/api/store/super-cache');
      let superCacheData: SuperCacheData = await superCacheResponse.json();
      const superCacheMissTime = Date.now() - superCacheMissStart;
      
      console.log(`Cache miss took ${superCacheMissTime}ms`);
      
      // Small delay to ensure cache is populated
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Second call - cache hit
      const superCacheHitStart = Date.now();
      superCacheResponse = await fetch('/api/store/super-cache');
      superCacheData = await superCacheResponse.json();
      const superCacheHitTime = Date.now() - superCacheHitStart;
      
      const superCacheTime = superCacheHitTime; // Use the cache hit time for comparison
      const superCacheSuccess = superCacheResponse.ok;
      const cacheStatus = superCacheResponse.headers.get('X-Cache-Status') as 'HIT' | 'MISS' | 'ERROR' || 'ERROR';

      // Step 4: Analyze and compare data completeness
      const normalFlowBooks = normalFlowData ? Object.values(normalFlowData.books).flat().length : 0;
      const normalFlowCategories = normalFlowData ? normalFlowData.categories.length : 0;
      const normalFlowImages = normalFlowData ? Object.values(normalFlowData.books).flat().filter((book: Book) => book.imageUrl).length : 0;
      
      const superCacheBooks = superCacheData.metadata?.totalBooks || 0;
      const superCacheCategories = superCacheData.categories?.length || 0;
      const superCacheImages = superCacheData.metadata?.imagesCount || 0;
      
      const superCacheDataComplete = superCacheBooks > 0 && superCacheCategories > 0;
      const normalFlowDataComplete = normalFlowBooks > 0 && normalFlowCategories > 0;

      // Step 5: Calculate performance metrics
      const speedImprovement = normalFlowTime > 0 ? ((normalFlowTime - superCacheTime) / normalFlowTime * 100).toFixed(1) : '0.0';
      const performanceMultiplier = superCacheTime > 0 ? (normalFlowTime / superCacheTime).toFixed(1) : 'N/A';

      const result: SuperCacheTestResult = {
        superCacheTime,
        normalFlowTime,
        superCacheSuccess,
        normalFlowSuccess,
        superCacheDataComplete,
        normalFlowDataComplete,
        speedImprovement: `${speedImprovement}%`,
        performanceMultiplier: `${performanceMultiplier}x`,
        testTime: new Date().toISOString(),
        superCacheStatus: cacheStatus,
        dataComparison: {
          superCacheBooks,
          normalFlowBooks,
          superCacheCategories,
          normalFlowCategories,
          superCacheImages,
          normalFlowImages
        }
      };

      console.log('Super Cache test completed:', result);
      setSuperCacheResult(result);
      
    } catch (error) {
      console.error('Super Cache test failed:', error);
      alert('Super Cache test failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setLoading(prev => ({ ...prev, superCacheTest: false }));
    }
  };

  // Function to test cache warmup performance
  const testCacheWarmup = async () => {
    setLoading(prev => ({ ...prev, superCacheTest: true }));
    
    try {
      console.log('Starting cache warmup performance test...');
      
      // Step 1: Clear super cache to start fresh
      console.log('Clearing super cache...');
      await fetch('/api/cache', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Basic ' + btoa('admin:change_me_in_production')
        },
        body: JSON.stringify({ scope: 'super-cache' })
      });

      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 2: Test cache miss (cold start) - this should trigger cache population
      console.log('Testing cache miss (cold start)...');
      const coldStart = Date.now();
      const coldResponse = await fetch('/api/store/super-cache');
      const coldData = await coldResponse.json();
      const coldTime = Date.now() - coldStart;
      const coldCacheStatus = coldResponse.headers.get('X-Cache-Status');

      // Step 3: Test immediate cache hit
      console.log('Testing immediate cache hit...');
      const warmStart = Date.now();
      const warmResponse = await fetch('/api/store/super-cache');
      const warmData = await warmResponse.json();
      const warmTime = Date.now() - warmStart;
      const warmCacheStatus = warmResponse.headers.get('X-Cache-Status');

      // Step 4: Test multiple consecutive cache hits to verify consistency
      console.log('Testing cache consistency with multiple hits...');
      const consistencyTests = [];
      for (let i = 0; i < 5; i++) {
        const start = Date.now();
        const response = await fetch('/api/store/super-cache');
        const time = Date.now() - start;
        const status = response.headers.get('X-Cache-Status');
        consistencyTests.push({ time, status });
        await new Promise(resolve => setTimeout(resolve, 100)); // Small delay between tests
      }

      const avgConsistencyTime = consistencyTests.reduce((sum, test) => sum + test.time, 0) / consistencyTests.length;

      // Calculate improvement metrics
      const warmupImprovement = coldTime > 0 ? ((coldTime - warmTime) / coldTime * 100).toFixed(1) : '0.0';
      const warmupMultiplier = warmTime > 0 ? (coldTime / warmTime).toFixed(1) : 'N/A';

      const result: SuperCacheTestResult = {
        superCacheTime: warmTime,
        normalFlowTime: coldTime,
        superCacheSuccess: warmResponse.ok,
        normalFlowSuccess: coldResponse.ok,
        superCacheDataComplete: (warmData.metadata?.totalBooks || 0) > 0,
        normalFlowDataComplete: (coldData.metadata?.totalBooks || 0) > 0,
        speedImprovement: `${warmupImprovement}%`,
        performanceMultiplier: `${warmupMultiplier}x`,
        testTime: new Date().toISOString(),
        superCacheStatus: (warmCacheStatus as 'HIT' | 'MISS' | 'ERROR') || 'ERROR',
        dataComparison: {
          superCacheBooks: warmData.metadata?.totalBooks || 0,
          normalFlowBooks: coldData.metadata?.totalBooks || 0,
          superCacheCategories: warmData.categories?.length || 0,
          normalFlowCategories: coldData.categories?.length || 0,
          superCacheImages: warmData.metadata?.imagesCount || 0,
          normalFlowImages: coldData.metadata?.imagesCount || 0
        }
      };

      console.log('Cache warmup test completed:', {
        ...result,
        coldCacheStatus,
        consistencyResults: {
          avgTime: avgConsistencyTime.toFixed(1),
          allHits: consistencyTests.every(test => test.status === 'HIT')
        }
      });

      setSuperCacheResult(result);
      
      // Show additional warmup info in console
      console.log('Warmup test details:', {
        coldStart: `${coldTime}ms (${coldCacheStatus})`,
        warmStart: `${warmTime}ms (${warmCacheStatus})`,
        consistency: `${avgConsistencyTime.toFixed(1)}ms avg over 5 tests`,
        allCacheHits: consistencyTests.every(test => test.status === 'HIT')
      });
      
    } catch (error) {
      console.error('Cache warmup test failed:', error);
      alert('Cache warmup test failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setLoading(prev => ({ ...prev, superCacheTest: false }));
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

  // Client-side inventory batch vs single test using existing endpoint
  const runInventoryBatchTest = async () => {
    setLoading(prev => ({ ...prev, inventoryBatch: true }));
    setInventoryBatchResult(null);
    try {
      let cats = categories;
      if (cats.length === 0) {
        const r = await fetch('/api/square/categories');
        const j = await r.json();
        if (j.categories && Array.isArray(j.categories)) {
          cats = j.categories;
          setCategories(j.categories.slice(0, 10));
        } else {
          alert('Failed to load categories for inventory test');
          setLoading(prev => ({ ...prev, inventoryBatch: false }));
          return;
        }
      }

      const picked = cats.slice(0, 2).map(c => c.id);
      const variationIdsSet = new Set<string>();

      for (const id of picked) {
        const r = await fetch(`/api/square/category/${id}`);
        const j = await r.json();
        const books: Book[] = j.books || [];
        for (const b of books as BookWithVariation[]) {
          const v = b.squareVariationId;
          if (v) variationIdsSet.add(v);
        }
      }

      let variationIds = Array.from(variationIdsSet).filter(Boolean);
      if (variationIds.length === 0) {
        alert('No variation IDs found to test inventory');
        setLoading(prev => ({ ...prev, inventoryBatch: false }));
        return;
      }

      variationIds.sort();
      if (variationIds.length > 200) variationIds = variationIds.slice(0, 200);

      const postInventoryBatch = async (ids: string[]) => {
        const res = await fetch('/api/square/inventory/batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            variationIds: ids,
            locationId: process.env.SQUARE_LOCATION_ID
          })
        });
        const ct = res.headers.get('content-type') || '';
        if (!ct.includes('application/json')) {
          const text = await res.text();
          throw new Error(text.slice(0, 200));
        }
        const data = await res.json();
        if (!res.ok || data.error) throw new Error(data.error || 'Inventory batch failed');
        return data;
      };

      const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
      const chunk = <T,>(arr: T[], size: number): T[][] => {
        const out: T[][] = [];
        for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
        return out;
      };
      const median = (nums: number[]) => {
        const a = [...nums].sort((x, y) => x - y);
        const n = a.length;
        if (n === 0) return 0;
        const m = Math.floor(n / 2);
        return n % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
        };
      const p95 = (nums: number[]) => {
        if (nums.length === 0) return 0;
        const a = [...nums].sort((x, y) => x - y);
        const idx = Math.min(a.length - 1, Math.max(0, Math.ceil(0.95 * a.length) - 1));
        return a[idx];
      };

      // Warm up TLS/edge
      await postInventoryBatch(variationIds.slice(0, 2));

      const runs = 5;
      const chunkSize = 60;

      // Batched mode
      const batchedSamples: number[] = [];
      let batchedRequests = 0;
      const chunks = chunk(variationIds, Math.max(1, chunkSize));

      for (let i = 0; i < runs; i++) {
        const t0 = performance.now();
        for (const ids of chunks) {
          await postInventoryBatch(ids);
          batchedRequests += 1;
        }
        const t1 = performance.now();
        batchedSamples.push(Math.round(t1 - t0));
      }

      // Single mode
      const singleSamples: number[] = [];
      let singleRequests = 0;

      for (let i = 0; i < runs; i++) {
        const t0 = performance.now();
        for (const id of variationIds) {
          await postInventoryBatch([id]);
          singleRequests += 1;
          await sleep(1);
        }
        const t1 = performance.now();
        singleSamples.push(Math.round(t1 - t0));
      }

      const batchedMedian = median(batchedSamples);
      const singleMedian = median(singleSamples);
      const result: InventoryBatchTestResult = {
        params: {
          nIds: variationIds.length,
          chunkSize,
          runs
        },
        batched: {
          samplesMs: batchedSamples,
          medianMs: batchedMedian,
          p95Ms: p95(batchedSamples),
          minMs: Math.min(...batchedSamples),
          maxMs: Math.max(...batchedSamples),
          requestsMade: batchedRequests
        },
        single: {
          samplesMs: singleSamples,
          medianMs: singleMedian,
          p95Ms: p95(singleSamples),
          minMs: Math.min(...singleSamples),
          maxMs: Math.max(...singleSamples),
          requestsMade: singleRequests
        },
        speedup: {
          percent: singleMedian > 0 ? Math.round(((singleMedian - batchedMedian) / singleMedian) * 1000) / 10 : 0,
          multiplier: batchedMedian > 0 ? Math.round((singleMedian / batchedMedian) * 10) / 10 : 0
        },
        testTime: new Date().toISOString()
      };

      setInventoryBatchResult(result);
    } catch (e) {
      console.error('Inventory batch test failed:', e);
      alert('Inventory batch test failed: ' + (e instanceof Error ? e.message : 'Unknown error'));
    } finally {
      setLoading(prev => ({ ...prev, inventoryBatch: false }));
    }
  };

  // Load prefetch and coalesce results on component mount
  const runPrefetchCoalesceTest = async () => {
    setLoading(prev => ({ ...prev, inventoryBatch: true }));
    setPrefetchCoalesceResult(null);
    try {
      let cats = categories;
      if (cats.length === 0) {
        const r = await fetch('/api/square/categories');
        const j = await r.json();
        if (j.categories && Array.isArray(j.categories)) {
          cats = j.categories;
          setCategories(j.categories.slice(0, 10));
        } else {
          alert('Failed to load categories for inventory test');
          setLoading(prev => ({ ...prev, inventoryBatch: false }));
          return;
        }
      }

      const picked = cats.slice(0, 2).map(c => c.id);
      const variationIdsSet = new Set<string>();

      for (const id of picked) {
        const r = await fetch(`/api/square/category/${id}`);
        const j = await r.json();
        const books: Book[] = j.books || [];
        for (const b of books as BookWithVariation[]) {
          const v = b.squareVariationId;
          if (v) variationIdsSet.add(v);
        }
      }

      let variationIds = Array.from(variationIdsSet).filter(Boolean);
      if (variationIds.length === 0) {
        alert('No variation IDs found to test inventory');
        setLoading(prev => ({ ...prev, inventoryBatch: false }));
        return;
      }
      variationIds.sort();
      if (variationIds.length > 300) variationIds = variationIds.slice(0, 300);

      const chunk = <T,>(arr: T[], size: number): T[][] => {
        const out: T[][] = [];
        for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
        return out;
      };
      const median = (nums: number[]) => {
        const a = [...nums].sort((x, y) => x - y);
        const n = a.length;
        if (n === 0) return 0;
        const m = Math.floor(n / 2);
        return n % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
      };
      const p95 = (nums: number[]) => {
        if (nums.length === 0) return 0;
        const a = [...nums].sort((x, y) => x - y);
        const idx = Math.min(a.length - 1, Math.max(0, Math.ceil(0.95 * a.length) - 1));
        return a[idx];
      };

      const postInventoryBatch = async (ids: string[]) => {
        const res = await fetch('/api/square/inventory/batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            variationIds: ids,
            locationId: process.env.SQUARE_LOCATION_ID
          })
        });
        const ct = res.headers.get('content-type') || '';
        const textIfNotJson = !ct.includes('application/json') ? await res.text() : null;
        const data: InventoryBatchResponse = ct.includes('application/json')
          ? await res.json() as InventoryBatchResponse
          : {};
        if (!res.ok || data.error) {
          throw new Error(data.error || textIfNotJson || 'Inventory batch failed');
        }
        return { data, headers: res.headers };
      };

      const tryPrefetch = async (ids: string[]) => {
        try {
          const t0 = performance.now();
          const res = await fetch('/api/square/inventory/batch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Prefetch': '1' },
            body: JSON.stringify({
              variationIds: ids,
              locationId: process.env.SQUARE_LOCATION_ID,
              prefetchOnly: true
            })
          });
          const ct = res.headers.get('content-type') || '';
          const json: PrefetchResponse = ct.includes('application/json')
            ? await res.json() as PrefetchResponse
            : {};
          const ok = res.ok && !json.error;
          const ms = Math.round(performance.now() - t0);
          return { supported: true, ok, ms };
        } catch {
          return { supported: true, ok: false, ms: null as number | null };
        }
      };

      // clear inventory cache so cold path is cold
      await fetch('/api/cache', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Basic ' + btoa('admin:change_me_in_production')
        },
        body: JSON.stringify({ scope: 'inventory' })
      });
      await new Promise(r => setTimeout(r, 300));

      const chunkSize = 60;
      const chunks = chunk(variationIds, Math.max(1, chunkSize));

      // cold run, batched
      let t0 = performance.now();
      for (const ids of chunks) {
        await postInventoryBatch(ids);
      }
      const coldMs = Math.round(performance.now() - t0);

      // prefetch
      const prefetchRes = await tryPrefetch(variationIds);

      // warm run after prefetch
      await new Promise(r => setTimeout(r, 200));
      t0 = performance.now();
      // also capture one header to see cache hit source if you expose it
      let headerSource: string | null = null;
      for (const ids of chunks) {
        const { headers } = await postInventoryBatch(ids);
        if (!headerSource) headerSource = headers.get('X-Inventory-Source');
      }
      const warmMs = Math.round(performance.now() - t0);

      // coalesce test, fire overlapping identical requests in parallel
      const parallel = 20;
      const targetIds = chunks[0] || variationIds.slice(0, Math.min(variationIds.length, chunkSize));
      const samples: number[] = [];
      let headerCoalescedHits = 0;

      for (let run = 0; run < 5; run++) {
        const promises = Array.from({ length: parallel }, async () => {
          await new Promise(r => setTimeout(r, Math.floor(Math.random() * 10)));
          const s = performance.now();
          const { headers } = await postInventoryBatch(targetIds);
          const ms = Math.round(performance.now() - s);
          const h = headers.get('X-Coalesced') || headers.get('X-Coalesce-Hit');
          if (h === '1' || h === 'true') headerCoalescedHits += 1;
          return ms;
        });
        const times = await Promise.all(promises);
        samples.push(...times);
        await new Promise(r => setTimeout(r, 100));
      }

      const result: PrefetchCoalesceResult = {
        params: {
          nIds: variationIds.length,
          runs: 5,
          parallel,
          chunkSize
        },
        cold: {
          ms: coldMs
        },
        prefetch: {
          supported: prefetchRes.supported,
          ms: prefetchRes.ms,
          ok: prefetchRes.ok
        },
        warm: {
          ms: warmMs,
          headerSource: headerSource || null
        },
        coalesce: {
          samplesMs: samples,
          medianMs: median(samples),
          p95Ms: p95(samples),
          minMs: Math.min(...samples),
          maxMs: Math.max(...samples),
          headerCoalescedHits
        },
        speedup: {
          warmVsColdMultiplier: warmMs > 0 ? Math.round((coldMs / warmMs) * 10) / 10 : 0,
          warmVsColdPercent: coldMs > 0 ? Math.round(((coldMs - warmMs) / coldMs) * 1000) / 10 : 0
        },
        testTime: new Date().toISOString()
      };

      setPrefetchCoalesceResult(result);
    } catch (e) {
      console.error('Prefetch/coalesce test failed:', e);
      alert('Prefetch/coalesce test failed: ' + (e instanceof Error ? e.message : 'Unknown error'));
    } finally {
      setLoading(prev => ({ ...prev, inventoryBatch: false }));
    }
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

            {/* Super Cache vs Normal Flow Performance Test Section */}
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Super Cache Performance Test</h2>
                  <p className="text-sm text-gray-600">Compare super cache speed vs normal store loading flow</p>
                </div>
                <div className="space-x-2">
                  <button
                    onClick={runSuperCacheTest}
                    disabled={loading.superCacheTest}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:bg-gray-400"
                  >
                    {loading.superCacheTest ? 'Testing...' : 'Test Super Cache'}
                  </button>
                  <button
                    onClick={testCacheWarmup}
                    disabled={loading.superCacheTest}
                    className="bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700 disabled:bg-gray-400"
                  >
                    Test Cache Warmup
                  </button>
                </div>
              </div>

              {loading.superCacheTest && (
                <div className="mb-4 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600 mr-3"></div>
                    <span className="text-indigo-800 text-sm">Running super cache performance test...</span>
                  </div>
                </div>
              )}

              {superCacheResult && (
                <div className="bg-white rounded-lg p-4 border">
                  <h3 className="font-medium text-gray-900 mb-3">Super Cache Test Results</h3>
                  
                  {/* Performance Comparison */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="p-3 bg-orange-50 rounded border-l-4 border-orange-500">
                      <p className="text-sm font-medium text-gray-600">Normal Flow</p>
                      <p className="text-lg font-bold text-orange-600">{superCacheResult.normalFlowTime}ms</p>
                      <p className="text-xs text-gray-500">{superCacheResult.normalFlowSuccess ? '✅ Success' : '❌ Failed'}</p>
                    </div>
                    <div className="p-3 bg-green-50 rounded border-l-4 border-green-500">
                      <p className="text-sm font-medium text-gray-600">Super Cache</p>
                      <p className="text-lg font-bold text-green-600">{superCacheResult.superCacheTime}ms</p>
                      <p className="text-xs text-gray-500">{superCacheResult.superCacheSuccess ? '✅ Success' : '❌ Failed'}</p>
                    </div>
                    <div className="p-3 bg-blue-50 rounded border-l-4 border-blue-500">
                      <p className="text-sm font-medium text-gray-600">Speed Improvement</p>
                      <p className="text-lg font-bold text-blue-600">{superCacheResult.speedImprovement}</p>
                    </div>
                    <div className="p-3 bg-purple-50 rounded border-l-4 border-purple-500">
                      <p className="text-sm font-medium text-gray-600">Performance Boost</p>
                      <p className="text-lg font-bold text-purple-600">{superCacheResult.performanceMultiplier}</p>
                    </div>
                  </div>

                  {/* Cache Status */}
                  <div className="mb-4 p-3 rounded border-l-4 border-gray-500 bg-gray-50">
                    <p className="text-sm font-medium text-gray-600">Cache Status</p>
                    <p className={`text-lg font-bold ${
                      superCacheResult.superCacheStatus === 'HIT' ? 'text-green-600' : 
                      superCacheResult.superCacheStatus === 'MISS' ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {superCacheResult.superCacheStatus}
                    </p>
                  </div>

                  {/* Data Completeness Comparison */}
                  <div className="border-t pt-4">
                    <h4 className="font-medium text-gray-900 mb-3">Data Completeness Comparison</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-600">Books</p>
                        <div className="flex justify-center items-center space-x-2 mt-1">
                          <span className="text-lg font-bold text-orange-600">{superCacheResult.dataComparison.normalFlowBooks}</span>
                          <span className="text-gray-400">vs</span>
                          <span className="text-lg font-bold text-green-600">{superCacheResult.dataComparison.superCacheBooks}</span>
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-600">Categories</p>
                        <div className="flex justify-center items-center space-x-2 mt-1">
                          <span className="text-lg font-bold text-orange-600">{superCacheResult.dataComparison.normalFlowCategories}</span>
                          <span className="text-gray-400">vs</span>
                          <span className="text-lg font-bold text-green-600">{superCacheResult.dataComparison.superCacheCategories}</span>
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-600">Images</p>
                        <div className="flex justify-center items-center space-x-2 mt-1">
                          <span className="text-lg font-bold text-orange-600">{superCacheResult.dataComparison.normalFlowImages}</span>
                          <span className="text-gray-400">vs</span>
                          <span className="text-lg font-bold text-green-600">{superCacheResult.dataComparison.superCacheImages}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Test Metadata */}
                  <div className="mt-4 pt-3 border-t flex justify-between text-sm text-gray-600">
                    <span>Normal Flow Complete: {superCacheResult.normalFlowDataComplete ? '✅' : '❌'}</span>
                    <span>Super Cache Complete: {superCacheResult.superCacheDataComplete ? '✅' : '❌'}</span>
                    <span>Tested: {new Date(superCacheResult.testTime).toLocaleTimeString()}</span>
                  </div>
                </div>
              )}

            </div>

            {/* Inventory Batch Performance Test */}
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Inventory Batch Performance Test</h2>
                  <p className="text-sm text-gray-600">Compare batched vs single inventory calls using the existing endpoint</p>
                </div>
                <div className="space-x-2">
                  <button
                    onClick={runInventoryBatchTest}
                    disabled={loading.inventoryBatch}
                    className="bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700 disabled:bg-gray-400"
                  >
                    {loading.inventoryBatch ? 'Testing...' : 'Test Inventory Batch'}
                  </button>
                  <button
                    onClick={runPrefetchCoalesceTest}
                    disabled={loading.inventoryBatch}
                    className="bg-sky-600 text-white px-4 py-2 rounded-md hover:bg-sky-700 disabled:bg-gray-400"
                  >
                    {loading.inventoryBatch ? 'Testing...' : 'Test Prefetch + Coalesce'}
                  </button>
                </div>
              </div>

              {loading.inventoryBatch && (
                <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-600 mr-3"></div>
                    <span className="text-emerald-800 text-sm">Running inventory batch test...</span>
                  </div>
                </div>
              )}

              {inventoryBatchResult && (
                <div className="bg-white rounded-lg p-4 border">
                  <h3 className="font-medium text-gray-900 mb-3">Inventory Batch Test Results</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="p-3 bg-green-50 rounded border-l-4 border-green-500">
                      <p className="text-sm font-medium text-gray-600">Batched median</p>
                      <p className="text-lg font-bold text-green-600">{inventoryBatchResult.batched.medianMs}ms</p>
                    </div>
                    <div className="p-3 bg-orange-50 rounded border-l-4 border-orange-500">
                      <p className="text-sm font-medium text-gray-600">Singles median</p>
                      <p className="text-lg font-bold text-orange-600">{inventoryBatchResult.single.medianMs}ms</p>
                    </div>
                    <div className="p-3 bg-blue-50 rounded border-l-4 border-blue-500">
                      <p className="text-sm font-medium text-gray-600">Speed Improvement</p>
                      <p className="text-lg font-bold text-blue-600">{inventoryBatchResult.speedup.percent}%</p>
                    </div>
                    <div className="p-3 bg-purple-50 rounded border-l-4 border-purple-500">
                      <p className="text-sm font-medium text-gray-600">Performance Boost</p>
                      <p className="text-lg font-bold text-purple-600">{inventoryBatchResult.speedup.multiplier}x</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-700">
                    <div className="p-3 bg-gray-50 rounded border">
                      <div>IDs tested: <span className="font-bold">{inventoryBatchResult.params.nIds}</span></div>
                      <div>Chunk size: <span className="font-bold">{inventoryBatchResult.params.chunkSize}</span></div>
                      <div>Runs: <span className="font-bold">{inventoryBatchResult.params.runs}</span></div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded border">
                      <div className="font-medium mb-1">Batched</div>
                      <div>p95: <span className="font-bold">{inventoryBatchResult.batched.p95Ms}ms</span></div>
                      <div>min/max: <span className="font-bold">{inventoryBatchResult.batched.minMs}</span>/<span className="font-bold">{inventoryBatchResult.batched.maxMs}</span> ms</div>
                      <div>requests: <span className="font-bold">{inventoryBatchResult.batched.requestsMade}</span></div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded border">
                      <div className="font-medium mb-1">Singles</div>
                      <div>p95: <span className="font-bold">{inventoryBatchResult.single.p95Ms}ms</span></div>
                      <div>min/max: <span className="font-bold">{inventoryBatchResult.single.minMs}</span>/<span className="font-bold">{inventoryBatchResult.single.maxMs}</span> ms</div>
                      <div>requests: <span className="font-bold">{inventoryBatchResult.single.requestsMade}</span></div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t flex justify-between text-sm text-gray-600">
                    <span>Tested: {new Date(inventoryBatchResult.testTime).toLocaleTimeString()}</span>
                    <span>Samples per mode: 7</span>
                  </div>
                </div>
              )}
            </div>
            {prefetchCoalesceResult && (
              <div className="bg-white rounded-lg p-4 border mt-4">
                <h3 className="font-medium text-gray-900 mb-3">Prefetch and Coalesce Results</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="p-3 bg-orange-50 rounded border-l-4 border-orange-500">
                    <p className="text-sm font-medium text-gray-600">Cold batched</p>
                    <p className="text-lg font-bold text-orange-600">{prefetchCoalesceResult.cold.ms}ms</p>
                  </div>
                  <div className="p-3 bg-emerald-50 rounded border-l-4 border-emerald-500">
                    <p className="text-sm font-medium text-gray-600">Prefetch</p>
                    <p className="text-lg font-bold text-emerald-600">
                      {prefetchCoalesceResult.prefetch.supported ? `${prefetchCoalesceResult.prefetch.ms}ms` : 'not supported'}
                    </p>
                  </div>
                  <div className="p-3 bg-green-50 rounded border-l-4 border-green-500">
                    <p className="text-sm font-medium text-gray-600">Warm batched</p>
                    <p className="text-lg font-bold text-green-600">{prefetchCoalesceResult.warm.ms}ms</p>
                    {prefetchCoalesceResult.warm.headerSource && (
                      <p className="text-xs text-gray-500">Source: {prefetchCoalesceResult.warm.headerSource}</p>
                    )}
                  </div>
                  <div className="p-3 bg-purple-50 rounded border-l-4 border-purple-500">
                    <p className="text-sm font-medium text-gray-600">Warm speedup</p>
                    <p className="text-lg font-bold text-purple-600">
                      {prefetchCoalesceResult.speedup.warmVsColdMultiplier}x, {prefetchCoalesceResult.speedup.warmVsColdPercent}%
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-700">
                  <div className="p-3 bg-gray-50 rounded border">
                    <div className="font-medium mb-1">Params</div>
                    <div>IDs: <span className="font-bold">{prefetchCoalesceResult.params.nIds}</span></div>
                    <div>Chunk: <span className="font-bold">{prefetchCoalesceResult.params.chunkSize}</span></div>
                    <div>Parallel: <span className="font-bold">{prefetchCoalesceResult.params.parallel}</span></div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded border">
                    <div className="font-medium mb-1">Coalesce timings</div>
                    <div>median: <span className="font-bold">{prefetchCoalesceResult.coalesce.medianMs}ms</span></div>
                    <div>p95: <span className="font-bold">{prefetchCoalesceResult.coalesce.p95Ms}ms</span></div>
                    <div>min/max: <span className="font-bold">{prefetchCoalesceResult.coalesce.minMs}</span>/<span className="font-bold">{prefetchCoalesceResult.coalesce.maxMs}</span> ms</div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded border">
                    <div className="font-medium mb-1">Server signals</div>
                    <div>coalesced hits: <span className="font-bold">{prefetchCoalesceResult.coalesce.headerCoalescedHits}</span></div>
                    <div>prefetch ok: <span className="font-bold">{prefetchCoalesceResult.prefetch.ok ? 'yes' : 'no'}</span></div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t text-sm text-gray-600 flex justify-between">
                  <span>Samples: {prefetchCoalesceResult.coalesce.samplesMs.length}</span>
                  <span>Tested: {new Date(prefetchCoalesceResult.testTime).toLocaleTimeString()}</span>
                </div>
              </div>
            )}

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