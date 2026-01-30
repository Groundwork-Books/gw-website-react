/**
 * Unit tests for useInventory.ts
 * Tests the inventory management hook and utility functions
 */

import { renderHook, waitFor } from '@testing-library/react';
import { useInventory, prefetchInventory } from '@/lib/useInventory';

// Mock fetch globally
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

describe('useInventory.ts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Always resolve fetch immediately to avoid timing issues
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ available: {} }),
    } as Response);
  });

  describe('useInventory hook', () => {
    it('should return null quantity and not loading when no variationId provided', () => {
      const { result } = renderHook(() => useInventory());

      expect(result.current.qty).toBeNull();
      expect(result.current.loading).toBe(false);
    });

    it('should return null quantity and not loading when variationId is undefined', () => {
      const { result } = renderHook(() => useInventory(undefined));

      expect(result.current.qty).toBeNull();
      expect(result.current.loading).toBe(false);
    });

    it('should set loading to true initially when variationId is provided', () => {
      const { result } = renderHook(() => useInventory('var-123'));

      // Initially loading should be true
      expect(result.current.loading).toBe(true);
    });

    it('should eventually set loading to false', async () => {
      const { result } = renderHook(() => useInventory('var-loading-test'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      }, { timeout: 5000 });
    });

    it('should handle errors gracefully and set qty to null', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useInventory('var-error-test'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      }, { timeout: 5000 });

      expect(result.current.qty).toBeNull();
    });

    it('should handle non-ok response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      } as Response);

      const { result } = renderHook(() => useInventory('var-500-test'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      }, { timeout: 5000 });

      expect(result.current.qty).toBeNull();
    });
  });

  describe('prefetchInventory', () => {
    it('should not throw when called with valid IDs', () => {
      expect(() => prefetchInventory(['var-1', 'var-2', 'var-3'])).not.toThrow();
    });

    it('should not throw when called with empty array', () => {
      expect(() => prefetchInventory([])).not.toThrow();
    });

    it('should not throw when called with a group', () => {
      expect(() => prefetchInventory(['var-group-1'], 'test-group')).not.toThrow();
    });

    it('should call fetch eventually', async () => {
      mockFetch.mockClear();

      prefetchInventory(['var-prefetch-test-' + Date.now()]);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      }, { timeout: 5000 });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/square/inventory/batch',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });
  });

  describe('Hook cleanup', () => {
    it('should not throw when unmounted during fetch', () => {
      mockFetch.mockImplementationOnce(() =>
        new Promise(resolve => {
          setTimeout(() => {
            resolve({
              ok: true,
              json: async () => ({ available: { 'var-unmount': 5 } }),
            } as Response);
          }, 100);
        })
      );

      const { unmount } = renderHook(() => useInventory('var-unmount-test'));

      // Unmount immediately - should not throw
      expect(() => unmount()).not.toThrow();
    });
  });

  describe('Module constants', () => {
    it('should export useInventory as a function', () => {
      expect(typeof useInventory).toBe('function');
    });

    it('should export prefetchInventory as a function', () => {
      expect(typeof prefetchInventory).toBe('function');
    });
  });

  describe('Return value structure', () => {
    it('should return an object with qty and loading properties', () => {
      const { result } = renderHook(() => useInventory());

      expect(result.current).toHaveProperty('qty');
      expect(result.current).toHaveProperty('loading');
    });

    it('should have qty as number or null', () => {
      const { result } = renderHook(() => useInventory());

      expect(result.current.qty === null || typeof result.current.qty === 'number').toBe(true);
    });

    it('should have loading as boolean', () => {
      const { result } = renderHook(() => useInventory());

      expect(typeof result.current.loading).toBe('boolean');
    });
  });
});
