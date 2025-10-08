'use client';

import { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Image from 'next/image';
import FAQAccordion from '@/components/FAQAccordion';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      router.push('/account');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
    } finally {
      setLoading(false);
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
  <div className="max-w-2xl mx-auto bg-white shadow-md p-6 flex justify-center">
    <div className="max-w-md w-full space-y-8">
      <div>
        <h2 className="mt-6 text-center text-4xl font-extrabold text-gw-green-1 font-calluna">
          Create your account
        </h2>
      </div>

      <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
        <div className="space-y-4">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="block w-full h-12 rounded-full border-1 border-gw-green-1 bg-white
                       px-5 text-gw-green-1 placeholder:text-gw-green-1/60
                       focus:outline-none focus:ring-2 focus:ring-gw-green-1/30 font-calluna"
            placeholder="Email address"
          />

          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="block w-full h-12 rounded-full border-1 border-gw-green-1 bg-white
                       px-5 text-gw-green-1 placeholder:text-gw-green-1/60
                       focus:outline-none focus:ring-2 focus:ring-gw-green-1/30 font-calluna"
            placeholder="Password"
          />

          <input
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="block w-full h-12 rounded-full border-1 border-gw-green-1 bg-white
                       px-5 text-gw-green-1 placeholder:text-gw-green-1/60
                       focus:outline-none focus:ring-2 focus:ring-gw-green-1/30 font-calluna"
            placeholder="Confirm password"
          />
        </div>

        {error && (
          <div className="text-red-600 text-sm text-center">{error}</div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="inline-flex w-full h-12 items-center justify-center rounded-full
                          bg-gw-green-1 text-white font-semibold shadow
                          transition-colors hover:bg-gw-green-3
                          focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gw-green-1
                          disabled:opacity-50 font-calluna"
        >
          {loading ? 'Creating account...' : 'Sign up'}
        </button>

        <div className="mt-2 flex justify-center">
          <Link
            href="/login"
            className="text-gw-green-1 font-calluna hover:underline text-sm font-medium"
          >
            Already have an account? Sign in
          </Link>
        </div>
      </form>
    </div>
  </div>
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