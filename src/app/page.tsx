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
              <p className="text-lg mb-6">Welcome back, {user.email}!</p>
              <div className="space-x-4">
                <Link 
                  href="/books"
                  className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-md transition duration-200"
                >
                  📚 Find Books
                </Link>
                <Link 
                  href="/account"
                  className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition duration-200"
                >
                  Account
                </Link>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-lg mb-6">Welcome! Please sign in or create an account.</p>
              
              {/* Find Books - Always Available */}
              <div className="mb-6">
                <Link 
                  href="/books"
                  className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-6 rounded-md transition duration-200 text-lg"
                >
                  📚 Browse Our Books
                </Link>
              </div>
              
              {/* Auth Buttons */}
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
