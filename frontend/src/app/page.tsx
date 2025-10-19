'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import EventsCarousel from '@/components/EventsCarousel';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { getInstagramPosts, type InstagramPost } from '@/lib/api';
import { InstagramEmbed } from 'react-social-media-embed';

export default function Home() {
  const [isClient, setIsClient] = useState(false);
  const [instagramPosts, setInstagramPosts] = useState<InstagramPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setIsClient(true);
    
    // Fetch Instagram posts from Google Sheets
    const fetchInstagramPosts = async () => {
      try {
        const posts = await getInstagramPosts();
        setInstagramPosts(posts);
      } catch (error) {
        console.error('Error fetching Instagram posts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInstagramPosts();

    // No cleanup needed since we're using SafeInstagramEmbed
  }, []);


  return (
    <div className="min-h-screen bg-gw-white">
      {/* Header */}
      <Header />
      
      {/* Hero Section */}
      <section className="relative h-[800px] flex items-center justify-center isolate">
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
        
        {/* Hero content */}
        <div className="relative z-20 text-center text-white px-4">
          <div className="bg-white/75 backdrop-blur-sm p-8 max-w-4xl mx-auto">
            <h1 className="font-calluna text-4xl md:text-6xl font-black mb-8 leading-tight text-gw-green-1">
              A bookstore, organizing space, and community hub.
            </h1>
            <button onClick={() => window.location.href = "/about"}  className="font-helvetica border-2 border-gw-green-1 text-gw-green-1 px-8 py-3 rounded-full font-semibold text-lg hover:bg-gw-green-1 hover: cursor-pointer hover:text-gw-white transition-colors">
              Check us out  {" >"}
            </button>
          </div>
        </div>
      </section>

      {/* Combined Photos + Features Section */}
      <section className="py-16 bg-gw-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Great Books */}
            <div className="text-center space-y-4">
              <div className="h-64 relative overflow-hidden rounded-lg">
                <Image 
                  src="/images/community/bookshelves.jpg" 
                  alt="Bookstore interior with shelves"
                  fill={true}
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.nextElementSibling?.classList.remove('hidden');
                  }}
                />
                <div className="hidden h-full bg-gray-300 items-center justify-center rounded-lg">
                  <span className="text-gray-600">Add bookshelves.jpg</span>
                </div>
              </div>
              <h3 className="font-calluna text-2xl font-bold text-gw-black">Great Books</h3>
              <p className="font-helvetica text-gw-black/80 leading-relaxed">
                Browse our collection of diverse book selections, local authors, zines, and unique finds. We curate books that inspire, educate, and challenge.
              </p>
              <button onClick={() => window.location.href = "/store"} className="bg-gw-white border-2 border-gw-green-1 text-gw-green-1 px-6 py-2 rounded-full font-semibold hover:bg-gw-green-1 hover:cursor-pointer hover:text-gw-white transition-colors">
                Books
              </button>
            </div>
            
            {/* Local Activism */}
            <div className="text-center space-y-4">
              <div className="h-64 relative overflow-hidden rounded-lg">
                <Image 
                  src="/images/community/mural.jpg" 
                  alt="Community mural and artwork"
                  fill={true}
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.nextElementSibling?.classList.remove('hidden');
                  }}
                />
                <div className="hidden h-full bg-gray-400 items-center justify-center rounded-lg">
                  <span className="text-gray-600">Add mural.jpg</span>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gw-black">Local Activism</h3>
              <p className="text-gw-black/80 leading-relaxed">
                Connect with local organizing efforts and community events. We host discussions, workshops, and events that bring people together for social change.
              </p>
              <button onClick={() => window.location.href = "/community"} className="bg-gw-white border-2 border-gw-green-1 text-gw-green-1 px-6 py-2 rounded-full font-semibold hover:bg-gw-green-1 hover:cursor-pointer hover:text-gw-white transition-colors">
                Community
              </button>
            </div>
            
            {/* Community Space */}
            <div className="text-center space-y-4">
              <div className="h-64 relative overflow-hidden rounded-lg">
                <Image 
                  src="/images/community/community-gathering.jpg" 
                  alt="Community gathering in the space"
                  fill={true}
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.nextElementSibling?.classList.remove('hidden');
                  }}
                />
                <div className="hidden h-full bg-gray-300 items-center justify-center rounded-lg">
                  <span className="text-gray-600">Add community-gathering.jpg</span>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gw-black">Community Space</h3>
              <p className="text-gw-black/80 leading-relaxed">
                Our space is available for community meetings, book clubs, and grassroots organizing. Come work, learn, and connect with others.
              </p>
              <button onClick={() => window.location.href = "/about"}  className="bg-gw-white border-2 border-gw-green-1 text-gw-green-1 px-6 py-2 rounded-full font-semibold hover:bg-gw-green-1 hover:cursor-pointer hover:text-gw-white transition-colors">
                About
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Events Carousel */}
      <EventsCarousel />

      {/* Instagram Posts Grid */}
      <section className="py-16 bg-gw-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gw-black mb-12">
            Follow Our Instagram
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {isClient && !loading ? (
              // Show Instagram posts immediately as they load individually
              instagramPosts.map((post, index) => (
                <div 
                  key={`instagram-${index}-${post.order}`} 
                  className="flex justify-center opacity-0 animate-slide-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="w-full max-w-[350px] group cursor-pointer" suppressHydrationWarning={true}>
                    <div className="transform transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-lg rounded-xl overflow-hidden">
                      <InstagramEmbed 
                        url={post.postUrl} 
                        width="100%"
                        captioned
                        placeholderSpinnerDisabled={false}
                      />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              // Initial loading skeletons
              [...Array(8)].map((_, index) => (
                <div key={`skeleton-${index}`} className="flex justify-center">
                  <div className="w-full max-w-[328px] instagram-skeleton opacity-0 animate-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
                    <div className="flex items-center p-3 space-x-3">
                      <div className="w-8 h-8 rounded-full skeleton-shimmer"></div>
                      <div className="flex-1 space-y-1">
                        <div className="h-3 skeleton-shimmer rounded w-24"></div>
                        <div className="h-2 skeleton-shimmer rounded w-16"></div>
                      </div>
                      <div className="w-4 h-4 skeleton-shimmer rounded"></div>
                    </div>
                    <div className="w-full aspect-square bg-gray-100 relative overflow-hidden">
                      <div className="absolute inset-0 skeleton-shimmer"></div>
                    </div>
                    <div className="p-3 space-y-3">
                      <div className="flex items-center space-x-4">
                        <div className="w-6 h-6 skeleton-shimmer rounded"></div>
                        <div className="w-6 h-6 skeleton-shimmer rounded"></div>
                        <div className="w-6 h-6 skeleton-shimmer rounded"></div>
                      </div>
                      <div className="h-3 skeleton-shimmer rounded w-20"></div>
                      <div className="h-3 skeleton-shimmer rounded w-full"></div>
                      <div className="h-3 skeleton-shimmer rounded w-3/4"></div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          
          {/* Instagram CTA */}
          <div className="text-center mt-8">
            <a 
              href="https://www.instagram.com/groundworkbooks/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center bg-gw-white border-2 border-gw-green-1 text-gw-green-1 px-6 py-3 rounded-full font-semibold hover:bg-gw-green-1 hover:text-gw-white transition-colors"
            >
              <svg
                className="w-5 h-5 mr-2"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="3" y="3" width="18" height="18" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.5" cy="6.5" r="1.25" />
              </svg>
              Follow @groundworkbooks
            </a>
          </div>
        </div>
      </section>

      {/* Visit Us Section */}
      <section className="py-16 bg-gw-green-2">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Left side - Image */}
            <div className="order-2 lg:order-1">
              <div className="aspect-w-4 aspect-h-3 bg-gray-400 rounded-lg overflow-hidden">
                <div className="relative w-full h-80">
                  <Image 
                    src="/images/location/storefront.jpg" 
                    alt="Groundwork Books storefront location"
                    fill={true}
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover rounded-lg"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      target.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                </div>
                <div className="hidden w-full h-80 bg-gray-400 rounded-lg items-center justify-center">
                  <span className="text-gray-600">Add storefront.jpg to /public/images/location/</span>
                </div>
              </div>
            </div>
            
            {/* Right side - Text content */}
            <div className="order-1 lg:order-2 space-y-6">
              <h2 className="text-3xl font-bold text-gw-black">
                Come check us out!
              </h2>
              
              <p className="text-gw-black/80 leading-relaxed">
                Visit us and see our book selection, enjoy our public community space, and meet our staff. We welcome everyone!
              </p>
              
              <button className="hover:cursor-pointer bg-gw-white border-2 border-gw-green-1 text-gw-green-1 px-8 py-3 rounded-full font-semibold hover:bg-gw-green-1 hover:text-gw-white transition-colors">
                View Location Details
              </button>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
