'use client';

import { useAuth } from '@/lib/AuthContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Image from 'next/image';
import FAQAccordion from '@/components/FAQAccordion';

export default function AccountPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/no-account');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gw-green-2">
      <Header />

      {/* Hero Section (full-bleed) */}
      <section className="relative h-[200px] flex items-center justify-center isolate">
        {/* Background image */}
        <div className="rounded-lg overflow-hidden">
          <Image
            src="/images/hero/book-collage.jpg"
            alt="Book collage background"
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
        </div>
        {/* Optional overlay for readability */}
        <div className="absolute inset-0 " />

        {/* Content */}
        <div className="relative z-10 w-full px-4">
          <div className="mx-auto max-w-3xl bg-white/90 py-10 px-6 md:px-12  text-center">
            <h1 className="font-calluna font-black text-4xl md:text-5xl lg:text-[56px] leading-[110%] text-gw-green-1">
              Account
            </h1>
          </div>
        </div>
      </section>

    <div className="py-20">
      <div className="max-w-md mx-auto bg-white shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Your Account</h1>
          <div className="w-20"></div> {/* Spacer for centering */}
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <p className="mt-1 text-sm text-gray-900 bg-gray-50 rounded-md px-3 py-2">
              {user.email}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">User ID</label>
            <p className="mt-1 text-xs text-gray-600 bg-gray-50 rounded-md px-3 py-2 break-all">
              {user.uid}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Account Created</label>
            <p className="mt-1 text-sm text-gray-900 bg-gray-50 rounded-md px-3 py-2">
              {user.metadata.creationTime}
            </p>
          </div>
        </div>
      </div>
      </div>
      {/* Logout Button */}
      <div className="flex justify-center pb-10">
        <button
          onClick={handleLogout}
          className="mt-6 px-6 py-2 bg-gw-green-1 text-white rounded-lg font-semibold shadow hover:bg-gw-green-3 transition-colors duration-200"
        >
          Log Out
        </button>
      </div>
      {/* FAQ Section */}
        <div className = "pt-20 bg-white flex justify-center">
          <h2 className="font-calluna text-2xl font-extrabold text-gw-green-1">
            Frequently Asked Questions
          </h2>
        </div>
        <div className = "pt-4 bg-white flex justify-center">
          <h3 className="font-calluna text-black">
            {"Can't find an answer to your question? Reach out to us at "} <a href="mailto:groundworkbookscollective@gmail.com" className="font-semibold underline">groundworkbookscollective@gmail.com</a>
          </h3>
        </div>
        <div className="py-12 bg-white">
        <FAQAccordion/>
        </div>
      <Footer />
    </div>
  );
}