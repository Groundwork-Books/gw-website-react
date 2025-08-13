'use client';

import { useAuth } from '@/lib/AuthContext';
import Link from 'next/link';

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="bg-gw-green-2 p-5 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-gw-green-1 text-4xl font-bold mb-8">Hi guys</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          {user ? (
            <div className="text-center">
              <p className="text-lg mb-4">Welcome back, {user.email}!</p>
              <Link 
                href="/account"
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition duration-200"
              >
                Go to Account
              </Link>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-lg mb-6">Welcome! Please sign in or create an account.</p>
              <div className="space-x-4">
                <Link 
                  href="/login"
                  className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition duration-200"
                >
                  Sign In
                </Link>
                <Link 
                  href="/register"
                  className="inline-block bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md transition duration-200"
                >
                  Sign Up
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
