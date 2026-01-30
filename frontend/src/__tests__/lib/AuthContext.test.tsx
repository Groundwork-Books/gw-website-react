/**
 * Unit tests for AuthContext.tsx
 * Tests authentication context provider and hook
 */

import { render, screen, waitFor, act } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import { useAuth, AuthProvider } from '@/lib/AuthContext';

// Mock Firebase modules
const mockSignOut = jest.fn();
const mockOnAuthStateChanged = jest.fn();

jest.mock('firebase/auth', () => ({
  onAuthStateChanged: (...args: unknown[]) => mockOnAuthStateChanged(...args),
  signOut: (...args: unknown[]) => mockSignOut(...args),
}));

jest.mock('@/lib/firebase', () => ({
  auth: { currentUser: null },
}));

// Mock user object
const mockUser = {
  uid: 'test-user-123',
  email: 'test@example.com',
  displayName: 'Test User',
  emailVerified: true,
};

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default: no user logged in
    mockOnAuthStateChanged.mockImplementation((auth, callback) => {
      callback(null);
      return jest.fn(); // unsubscribe function
    });
  });

  describe('AuthProvider', () => {
    it('should render children', () => {
      render(
        <AuthProvider>
          <div data-testid="child">Child content</div>
        </AuthProvider>
      );

      expect(screen.getByTestId('child')).toBeInTheDocument();
    });

    it('should provide initial loading state as true', () => {
      // Don't call the callback immediately to keep loading state
      mockOnAuthStateChanged.mockImplementation(() => {
        return jest.fn();
      });

      const TestComponent = () => {
        const { loading } = useAuth();
        return <div data-testid="loading">{loading.toString()}</div>;
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      expect(screen.getByTestId('loading')).toHaveTextContent('true');
    });

    it('should set loading to false after auth state is determined', async () => {
      mockOnAuthStateChanged.mockImplementation((auth, callback) => {
        callback(null);
        return jest.fn();
      });

      const TestComponent = () => {
        const { loading } = useAuth();
        return <div data-testid="loading">{loading.toString()}</div>;
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });
    });

    it('should provide null user when not logged in', async () => {
      mockOnAuthStateChanged.mockImplementation((auth, callback) => {
        callback(null);
        return jest.fn();
      });

      const TestComponent = () => {
        const { user } = useAuth();
        return <div data-testid="user">{user ? 'logged in' : 'not logged in'}</div>;
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('not logged in');
      });
    });

    it('should provide user when logged in', async () => {
      mockOnAuthStateChanged.mockImplementation((auth, callback) => {
        callback(mockUser);
        return jest.fn();
      });

      const TestComponent = () => {
        const { user } = useAuth();
        return <div data-testid="user">{user?.email || 'no email'}</div>;
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('test@example.com');
      });
    });

    it('should call unsubscribe on unmount', () => {
      const mockUnsubscribe = jest.fn();
      mockOnAuthStateChanged.mockImplementation((auth, callback) => {
        callback(null);
        return mockUnsubscribe;
      });

      const { unmount } = render(
        <AuthProvider>
          <div>Child</div>
        </AuthProvider>
      );

      unmount();

      expect(mockUnsubscribe).toHaveBeenCalled();
    });
  });

  describe('useAuth hook', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    it('should return user, loading, and logout function', async () => {
      mockOnAuthStateChanged.mockImplementation((auth, callback) => {
        callback(null);
        return jest.fn();
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current).toHaveProperty('user');
        expect(result.current).toHaveProperty('loading');
        expect(result.current).toHaveProperty('logout');
      });
    });

    it('should have logout as a function', async () => {
      mockOnAuthStateChanged.mockImplementation((auth, callback) => {
        callback(null);
        return jest.fn();
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(typeof result.current.logout).toBe('function');
      });
    });

    it('should call signOut when logout is called', async () => {
      mockOnAuthStateChanged.mockImplementation((auth, callback) => {
        callback(mockUser);
        return jest.fn();
      });
      mockSignOut.mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.user).toBeTruthy();
      });

      await act(async () => {
        await result.current.logout();
      });

      expect(mockSignOut).toHaveBeenCalled();
    });
  });

  describe('useAuth outside provider', () => {
    it('should return default context value when used outside provider', () => {
      // Suppress expected error in test
      const originalError = console.error;
      console.error = jest.fn();

      const TestComponent = () => {
        const { user, loading } = useAuth();
        return (
          <div>
            <span data-testid="user">{user ? 'has user' : 'no user'}</span>
            <span data-testid="loading">{loading.toString()}</span>
          </div>
        );
      };

      render(<TestComponent />);

      // Default context values
      expect(screen.getByTestId('user')).toHaveTextContent('no user');
      expect(screen.getByTestId('loading')).toHaveTextContent('true');

      console.error = originalError;
    });
  });

  describe('Auth state changes', () => {
    it('should update when user logs in', async () => {
      let authCallback: ((user: unknown) => void) | null = null;

      mockOnAuthStateChanged.mockImplementation((auth, callback) => {
        authCallback = callback;
        callback(null); // Initial state: not logged in
        return jest.fn();
      });

      const TestComponent = () => {
        const { user, loading } = useAuth();
        return (
          <div>
            <span data-testid="status">{loading ? 'loading' : user ? 'logged in' : 'logged out'}</span>
            {user && <span data-testid="email">{user.email}</span>}
          </div>
        );
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('status')).toHaveTextContent('logged out');
      });

      // Simulate user logging in
      act(() => {
        authCallback?.(mockUser);
      });

      await waitFor(() => {
        expect(screen.getByTestId('status')).toHaveTextContent('logged in');
        expect(screen.getByTestId('email')).toHaveTextContent('test@example.com');
      });
    });

    it('should update when user logs out', async () => {
      let authCallback: ((user: unknown) => void) | null = null;

      mockOnAuthStateChanged.mockImplementation((auth, callback) => {
        authCallback = callback;
        callback(mockUser); // Initial state: logged in
        return jest.fn();
      });

      const TestComponent = () => {
        const { user } = useAuth();
        return <div data-testid="status">{user ? 'logged in' : 'logged out'}</div>;
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('status')).toHaveTextContent('logged in');
      });

      // Simulate user logging out
      act(() => {
        authCallback?.(null);
      });

      await waitFor(() => {
        expect(screen.getByTestId('status')).toHaveTextContent('logged out');
      });
    });
  });

  describe('User properties', () => {
    it('should expose user uid', async () => {
      mockOnAuthStateChanged.mockImplementation((auth, callback) => {
        callback(mockUser);
        return jest.fn();
      });

      const TestComponent = () => {
        const { user } = useAuth();
        return <div data-testid="uid">{user?.uid}</div>;
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('uid')).toHaveTextContent('test-user-123');
      });
    });

    it('should expose user displayName', async () => {
      mockOnAuthStateChanged.mockImplementation((auth, callback) => {
        callback(mockUser);
        return jest.fn();
      });

      const TestComponent = () => {
        const { user } = useAuth();
        return <div data-testid="name">{user?.displayName}</div>;
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('name')).toHaveTextContent('Test User');
      });
    });
  });
});
