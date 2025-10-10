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

    {/* Orders + Account Summary */}
    <section className="py-14">
      <div className="mx-auto max-w-6xl px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/*Your Orders*/}
          <div className="md:col-span-2 bg-white shadow-sm p-6 border border-gray-200">
            <h2 className="font-calluna text-3xl font-extrabold text-gw-green-1">Your Orders</h2>
            <hr className="mt-3 mb-10 border-black-300" />

            <div className="flex flex-col items-center justify-center text-center">
              <p className="text-gw-green-1 font-semibold mb-6 font-calluna text-2xl">No Orders Yet...</p>
              <button
                onClick={() => router.push('/store')}
                className="px-20 py-3 cursor-pointer rounded-full bg-gw-green-1 font-calluna text-white font-semibold shadow hover:bg-gw-green-3 transition-colors"
              >
                View Store
              </button>
            </div>

            <hr className="mt-10 border-black-300" />
          </div>

          {/*Account Summary*/}
          <div className="bg-white shadow-sm p-5 mb-15 border border-gray-200">
            <h2 className="font-calluna text-3xl font-extrabold text-gw-green-1 text-center">
              Your Account
            </h2>

            <div className="mt-6 text-center space-y-2">
              <p className="font-semibold text-gray-900">
                {user.displayName || (user.email?.split('@')[0] ?? 'Account')}
              </p>
              <p className="text-gray-700">{user.email}</p>
              {user.phoneNumber ? (
                <p className="text-gray-700">{user.phoneNumber}</p>
              ) : null}
            </div>
              {/* Logout Button */}
              <div className="flex justify-center pt-5">
                <button
                  onClick={handleLogout}
                  className="px-6 py-2 cursor-pointer bg-gw-green-1 text-white rounded-full font-semibold shadow hover:bg-gw-green-3 transition-colors duration-200"
                >
                  Log Out
                </button>
              </div>
          </div>
        </div>
      </div>
    </section>
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