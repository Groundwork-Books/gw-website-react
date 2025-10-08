'use client';

import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Image from 'next/image';
import FAQAccordion from '@/components/FAQAccordion';

export default function SignUpPage() {
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
      <div className="max-w-2xl mx-auto bg-white shadow-md p-6">
        <div className=" w-full space-y-8">
        <div className="flex justify-center mb-4">
            <h2 className="font-calluna mt-6 text-center text-4xl font-extrabold text-gw-green-1">
                {"You don't have an account yet..."}
            </h2>
        </div>
        <div className="mx-auto w-full max-w-xl border-y border-black-200 py-5 mt-4">
            <div className="flex justify-center">
                <h3 className="font-calluna mt-6 text-center text-2xl font-extrabold text-gw-green-1">
                    To make an order you must make an account
                </h3>
            </div>

            <div className="mt-6 flex flex-col items-center gap-4">
                <Link
                href="/register"
                className="inline-flex h-12 w-[280px] items-center justify-center rounded-full
                            bg-gw-green-1 text-white font-semibold shadow
                            transition-colors hover:bg-gw-green-3
                            focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gw-green-1 font-calluna"
                >
                Sign Up
                </Link>

                <Link
                href="/login"
                className="inline-flex h-12 w-[280px] items-center justify-center rounded-full
                            border-2 border-gw-green-1 text-gw-green-1 font-semibold
                            transition-colors hover:bg-gw-green-1 hover:text-white
                            focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gw-green-1 font-calluna"
                >
                Login
                </Link>
            </div>
        </div>
        
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