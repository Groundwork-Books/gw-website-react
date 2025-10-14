'use client';

import { useState, useEffect, Suspense } from 'react';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Image from 'next/image';
import FAQAccordion from '@/components/FAQAccordion';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [showResetForm, setShowResetForm] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Get message from URL parameters
    const urlMessage = searchParams.get('message');
    if (urlMessage) {
      setMessage(decodeURIComponent(urlMessage));
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      
      // Check if this is the admin user and redirect accordingly
      if (email.toLowerCase() === 'groundworkbookscollective@gmail.com') {
        router.push('/admin');
      } else {
        // Redirect to the intended page or default to account for regular users
        const redirectTo = searchParams.get('redirect') || '/account';
        router.push(redirectTo);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);
      setResetEmailSent(true);
      setMessage('Password reset email sent!\nPlease follow the instructions to reset your password.\nRemember to check both your inbox and spam folder.');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred while sending the reset email');
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
          <div className="text-center">
            <h2 className="mt-4 text-4xl font-extrabold text-gw-green-1 font-calluna">
              {showResetForm ? 'Reset your password' : 'Sign in to your account'}
            </h2>
          </div>

          {message && (
            <div
              role="status"
              aria-live="polite"
              className={`mt-4 w-full ${
                resetEmailSent ? 'bg-gw-green-2 border-gw-green-1' : 'bg-gw-green-2 border-gw-green-1'
              } border rounded-md p-3`}
            >
              <div className="flex items-center justify-center text-center gap-2">
                <svg
                  className={`h-5 w-5 flex-shrink-0 ${resetEmailSent ? 'text-gw-green-1' : 'text-gw-green-1'}`}
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  {resetEmailSent ? (
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  ) : (
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  )}
                </svg>
                <p className={`text-sm whitespace-pre-line ${resetEmailSent ? 'text-gw-green-1' : 'text-gw-green-1'}`}>
                  {message}
                </p>
              </div>
            </div>
          )}
          
          {showResetForm ? (
            /* Password Reset Form */
            <form className="mt-8 space-y-6" onSubmit={handlePasswordReset}>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full h-12 rounded-full border-1 border-gw-green-1 bg-white
                          px-5 text-gw-green-1 placeholder:text-gw-green-1/60
                          focus:outline-none focus:ring-2 focus:ring-gw-green-1/30 font-calluna"
                placeholder="Enter your email address"
              />

              {error && <div className="text-red-600 text-sm text-center">{error}</div>}

              {/* Buttons: outline (Back) + filled (Send) */}
              <div className="mb-4 mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowResetForm(false);
                    setError('');
                    setMessage('');
                    setResetEmailSent(false);
                  }}
                  className="inline-flex h-12 w-full items-center justify-center rounded-full cursor-pointer
                            border-2 border-gw-green-1 text-gw-green-1 font-semibold
                            transition-colors hover:bg-gw-green-1 hover:text-white
                            focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gw-green-1 font-calluna"
                >
                  Back to Sign In
                </button>

                <button
                  type="submit"
                  disabled={loading || resetEmailSent}
                  className="inline-flex h-12 w-full items-center justify-center rounded-full cursor-pointer
                            bg-gw-green-1 text-white font-semibold shadow
                            transition-colors hover:bg-gw-green-3
                            focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gw-green-1
                            disabled:opacity-50 disabled:cursor-not-allowed font-calluna"
                >
                  {loading ? 'Sending...' : resetEmailSent ? 'Email Sent' : 'Send Reset Email'}
                </button>
              </div>
            </form>
          ) : (
            /* Login Form */
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
              </div>

              {error && <div className="text-red-600 text-sm text-center">{error}</div>}

              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full h-12 items-center justify-center rounded-full
                          bg-gw-green-1 text-white font-semibold shadow
                          transition-colors hover:bg-gw-green-3
                          focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gw-green-1
                          disabled:opacity-50 font-calluna"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>

              <div className="flex items-center justify-center gap-25">
                <button
                  type="button"
                  onClick={() => { setShowResetForm(true); setError(''); setMessage(''); }}
                  className="text-gw-green-1 font-calluna hover:underline text-sm font-medium cursor-pointer"
                >
                  Forgot your password?
                </button>

                {/* outline style like your Login button */}
                <Link
                  href="/register"
                  className="text-gw-green-1 font-calluna hover:underline text-sm font-medium"
                >
                  {"Don't have an account? Sign up"}
                </Link>
              </div>
            </form>
          )}
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

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}