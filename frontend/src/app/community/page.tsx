'use client';

import Header from '@/components/Header';
import EventsGrid from '@/components/EventsGrid';
console.log('EventsGrid component:', EventsGrid);
import Link from 'next/link';
import Image from 'next/image';

export default function CommunityPage() {
  return (
    <div className="min-h-screen bg-gw-white font-helvetica text-gw-black">
      {/* Header */}
      <Header />

      {/* Hero Section (full-bleed) */}
      <section className="relative h-[302px] flex items-center justify-center isolate">
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
        {/* Overlay for readability */}
        <div className="absolute inset-0 bg-gw-green-1/40" />

        {/* Content */}
        <div className="relative z-10 w-full px-4">
          <div className="mx-auto max-w-3xl bg-white/80 py-10 px-6 md:px-12 rounded-xl text-center">
            <h1 className="font-calluna font-black text-4xl md:text-5xl lg:text-[56px] leading-[110%] text-gw-green-1">Community</h1>
          </div>
        </div>
      </section>

      <div className="bg-gw-green-2 pt-16 pb-10 flex items-center justify-center">
        <h2 className="font-calluna text-gw-green-1 text-3xl font-bold text-center">Upcoming Events</h2>
      </div>

      <EventsGrid />

      {/* Weekly Reading Group */}
      <section className="py-16 bg-gw-green-2">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-30 items-center">
            {/* Left side - Image */}
            <div className="order-2 lg:order-1">
              <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-gray-300">
                <Image
                  src="/images/events/discussion-circle.jpg"
                  alt="Weekly reading group"
                  fill
                  className="object-cover object-top"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                />
              </div>
            </div>

            {/* Right side - Text content */}
            <div className="order-1 lg:order-2 space-y-6">
              <h2 className="text-3xl font-calluna font-bold text-gw-green-1">Weekly Reading Group</h2>
              <p className="text-gw-black/80 leading-relaxed font-helvetica">
                Every Friday @ 4 PM in Groundworks
              </p>
              <button className="bg-gw-green-2 border-2 border-gw-green-1 text-gw-green-1 px-8 py-3 rounded-full font-semibold hover:bg-gw-green-1 hover:text-gw-white transition-colors">
                View Reading Info
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Host a Meeting */}
      <section className="py-16 bg-gw-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-30 items-center">
            {/* Right side - Image */}
            <div className="order-1 lg:order-2">
              <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-gray-300">
                <Image
                  src="/images/location/storefront2.jpg"
                  alt="Storefront"
                  fill
                  className="object-cover object-top"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                />
              </div>
            </div>

            {/* Left side - Text content */}
            <div className="order-2 lg:order-1 space-y-6">
              <h2 className="text-3xl font-calluna font-bold text-gw-green-1">Host a meeting at Groundworks!</h2>
              <p className="text-gw-black/80 leading-relaxed font-helvetica">
                If you'd like to host an event with us, email us at groundworkbookscollective@gmail.com.
              </p>
              <button className="bg-gw-white border-2 border-gw-green-1 text-gw-green-1 px-8 py-3 rounded-full font-semibold hover:bg-gw-green-1 hover:text-gw-white transition-colors">
                View Interest Form
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Get Involved Section */}
      <section className="py-16 bg-gw-green-2">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Left side - Image */}
            <div className="order-2 lg:order-1">
              <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-gray-300">
                <Image
                  src="/images/community/book-stand.jpg"
                  alt="Groundwork Books Book Stand"
                  fill
                  className="object-cover object-top"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                />
              </div>
            </div>

            {/* Right side - Text content */}
            <div className="order-1 lg:order-2 space-y-6">
              <h2 className="text-3xl font-calluna font-bold text-gw-green-1">Interested In Volunteering?</h2>
              <p className="text-gw-black/80 leading-relaxed font-helvetica">
                Like what you see and share our values? Come join us as a volunteer at Groundworks! 
                Visit us in person to learn more or reach out via the contact form below.
              </p>
              <button className="bg-gw-green-2 border-2 border-gw-green-1 text-gw-green-1 px-8 py-3 rounded-full font-semibold hover:bg-gw-green-1 hover:text-gw-white transition-colors">
                View Interest Form
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Host a Meeting */}
      <section className="py-16 bg-gw-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-30 items-center">
            {/* Right side - Image */}
            <div className="order-1 lg:order-2">
              <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-gray-300">
                <Image
                  src="/images/community/staff-picks.jpg"
                  alt="Storefront"
                  fill
                  className="object-cover object-top"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                />
              </div>
            </div>

            {/* Left side - Text content */}
            <div className="order-2 lg:order-1 space-y-6">
              <h2 className="text-3xl font-calluna font-bold text-gw-green-1">Community Restock Requests</h2>
              <p className="text-gw-black/80 leading-relaxed font-helvetica">
                Use this form to request books for when we restock! We'll do our best to get them in at a reduced price for you, so long as they're offered by our supplier.
              </p>
              <button className="bg-gw-white border-2 border-gw-green-1 text-gw-green-1 px-8 py-3 rounded-full font-semibold hover:bg-gw-green-1 hover:text-gw-white transition-colors">
                View Request Form
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Books for Prisoners */}
      <section className="py-16 bg-gw-green-2">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Left side - Image */}
            <div className="order-2 lg:order-1">
              <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-gray-300">
                <Image
                  src="/images/events/books-4-prisoners.jpg"
                  alt="Books for prisoners flyer"
                  fill
                  className="object-cover object-top"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                />
              </div>
            </div>

            {/* Right side - Text content */}
            <div className="order-1 lg:order-2 space-y-6">
              <h2 className="text-3xl font-calluna font-bold text-gw-green-1">Books for Prisoners</h2>
              <p className="text-gw-black/80 leading-relaxed font-helvetica">
                Books for Prisoners is a non-profit, student organization at UCSD affiliated with Groundwork Books. The organization receives letters from inmates all over the country requesting books and resources. Donated books (textbooks, novels, magazines, dictionaries, etc.) are sent directly to the inmates who write in. Often they send artwork, stories and letters about their lives inside the prison system. Books for Prisoners goal is to help better educate inmates while they are incarcerated in the prison system while at the same time challenging the prison industrial complex.
              </p>
              <button className="bg-gw-green-2 border-2 border-gw-green-1 text-gw-green-1 px-8 py-3 rounded-full font-semibold hover:bg-gw-green-1 hover:text-gw-white transition-colors">
                View Request Form
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer (full-bleed by default) */}
      <footer className="bg-gw-green-1 text-gw-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left side - Contact info */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold">Groundwork Books</h3>
              <div className="space-y-2 text-sm">
                <p>0323 UCSD Old Student Center, La Jolla, CA 92037</p>
                <p>groundworkbookscollective@gmail.com</p>
                <p>(858) 224-2614</p>
              </div>
            </div>

            {/* Right side - Navigation */}
            <div className="space-y-4">
              <nav className="flex flex-wrap gap-6 text-sm">
                <Link href="/" className="hover:text-gw-green-2 transition-colors">HOME</Link>
                <Link href="/books" className="hover:text-gw-green-2 transition-colors">STORE</Link>
                <Link href="/archive" className="hover:text-gw-green-2 transition-colors">ARCHIVE</Link>
                <Link href="/community" className="hover:text-gw-green-2 transition-colors">COMMUNITY</Link>
                <Link href="/about" className="hover:text-gw-green-2 transition-colors">ABOUT</Link>
              </nav>
            </div>
          </div>

          {/* Bottom section */}
          <div className="mt-8 pt-8 border-t border-gw-green-1/70 flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gw-green-2">Groundwork Books Collective © 2025</p>
            <div className="flex space-x-4 mt-4 md:mt-0">{/* Social icons unchanged */}</div>
          </div>
        </div>
      </footer>
    </div>
  );
}