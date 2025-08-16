'use client';

import { useAuth } from '@/lib/AuthContext';
import Header from '@/components/Header';
import EventsCarousel from '@/components/EventsCarousel';
import Link from 'next/link';

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gw-white">
      {/* Header */}
      <Header />
      
      {/* Hero Section */}
      <section className="relative h-screen bg-gw-black flex items-center justify-center">
        {/* Background collage */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/40 z-10"></div>
        <div className="absolute inset-0">
          <img 
            src="/images/hero/book-collage.jpg" 
            alt="Book collage background"
            className="w-full h-full object-cover opacity-60"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              target.nextElementSibling?.classList.remove('hidden');
            }}
          />
          <div className="hidden w-full h-full bg-gray-600 flex items-center justify-center">
            <span className="text-white text-lg">Add book-collage.jpg to /public/images/hero/</span>
          </div>
        </div>
        
        {/* Hero content */}
        <div className="relative z-20 text-center text-white px-4">
          <div className="bg-white/40 backdrop-blur-sm rounded-2xl p-8 max-w-4xl mx-auto">
            <h1 className="font-calluna text-4xl md:text-6xl font-black mb-8 leading-tight text-gw-green-1">
              A bookstore, organizing space, and community hub.
            </h1>
            <button className="font-helvetica bg-gw-white border-2 border-gw-green-1 text-gw-green-1 px-8 py-3 rounded-full font-semibold text-lg hover:bg-gw-green-1 hover:text-gw-white transition-colors">
              Check us out
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
                <img 
                  src="/images/community/bookshelves.jpg" 
                  alt="Bookstore interior with shelves"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.nextElementSibling?.classList.remove('hidden');
                  }}
                />
                <div className="hidden h-full bg-gray-300 flex items-center justify-center rounded-lg">
                  <span className="text-gray-600">Add bookshelves.jpg</span>
                </div>
              </div>
              <h3 className="font-calluna text-2xl font-bold text-gw-black">Great Books</h3>
              <p className="font-helvetica text-gw-black/80 leading-relaxed">
                Browse our collection of diverse book selections, local authors, zines, and unique finds. We curate books that inspire, educate, and challenge.
              </p>
              <button className="bg-gw-white border-2 border-gw-green-1 text-gw-green-1 px-6 py-2 rounded-full font-semibold hover:bg-gw-green-1 hover:text-gw-white transition-colors">
                Books
              </button>
            </div>
            
            {/* Local Activism */}
            <div className="text-center space-y-4">
              <div className="h-64 relative overflow-hidden rounded-lg">
                <img 
                  src="/images/community/mural.jpg" 
                  alt="Community mural and artwork"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.nextElementSibling?.classList.remove('hidden');
                  }}
                />
                <div className="hidden h-full bg-gray-400 flex items-center justify-center rounded-lg">
                  <span className="text-gray-600">Add mural.jpg</span>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gw-black">Local Activism</h3>
              <p className="text-gw-black/80 leading-relaxed">
                Connect with local organizing efforts and community events. We host discussions, workshops, and events that bring people together for social change.
              </p>
              <button className="bg-gw-white border-2 border-gw-green-1 text-gw-green-1 px-6 py-2 rounded-full font-semibold hover:bg-gw-green-1 hover:text-gw-white transition-colors">
                Community
              </button>
            </div>
            
            {/* Community Space */}
            <div className="text-center space-y-4">
              <div className="h-64 relative overflow-hidden rounded-lg">
                <img 
                  src="/images/community/community-gathering.jpg" 
                  alt="Community gathering in the space"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.nextElementSibling?.classList.remove('hidden');
                  }}
                />
                <div className="hidden h-full bg-gray-300 flex items-center justify-center rounded-lg">
                  <span className="text-gray-600">Add community-gathering.jpg</span>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gw-black">Community Space</h3>
              <p className="text-gw-black/80 leading-relaxed">
                Our space is available for community meetings, book clubs, and grassroots organizing. Come work, learn, and connect with others.
              </p>
              <button className="bg-gw-white border-2 border-gw-green-1 text-gw-green-1 px-6 py-2 rounded-full font-semibold hover:bg-gw-green-1 hover:text-gw-white transition-colors">
                About
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Events Carousel */}
      <EventsCarousel />

      {/* Social Media Grid */}
      <section className="py-16 bg-gw-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gw-black mb-12">
            Follow Our Socials
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(8)].map((_, index) => (
              <div key={index} className="aspect-square relative overflow-hidden rounded-lg">
                <img 
                  src={`/images/social/post-${index + 1}.jpg`} 
                  alt={`Social media post ${index + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.nextElementSibling?.classList.remove('hidden');
                  }}
                />
                <div className="hidden aspect-square bg-gray-300 rounded-lg flex items-center justify-center">
                  <span className="text-gray-500 text-sm">post-{index + 1}.jpg</span>
                </div>
              </div>
            ))}
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
                <img 
                  src="/images/location/storefront.jpg" 
                  alt="Groundwork Books storefront location"
                  className="w-full h-80 object-cover rounded-lg"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.nextElementSibling?.classList.remove('hidden');
                  }}
                />
                <div className="hidden w-full h-80 bg-gray-400 rounded-lg flex items-center justify-center">
                  <span className="text-gray-600">Add storefront.jpg to /public/images/location/</span>
                </div>
              </div>
            </div>
            
            {/* Right side - Text content */}
            <div className="order-1 lg:order-2 space-y-6">
              <h2 className="text-3xl font-bold text-gw-black">
                Lorem ipsum dolor sit amet, contur adipiscing elit. Come check us out!
              </h2>
              
              <p className="text-gw-black/80 leading-relaxed">
                Rhoncus morbi et augue nec, in id ullamcorper ut sit. Condimentum. Visit us and see our book selection, enjoy our public community space, and meet our staff. We welcome everyone!
              </p>
              
              <button className="bg-gw-white border-2 border-gw-green-1 text-gw-green-1 px-8 py-3 rounded-full font-semibold hover:bg-gw-green-1 hover:text-gw-white transition-colors">
                View Location Details
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gw-green-1 text-gw-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left side - Contact info */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold">Groundwork Books</h3>
              <div className="space-y-2 text-sm">
                <p>0323 UCSD Old Student Center, La Jolla, CA 92037</p>
                <p>groundworkbookscollective@gmail.com</p>
                <p>(858) 224-2814</p>
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
            <p className="text-sm text-gw-green-2">
              Groundwork Books Collective © 2025
            </p>
            
            {/* Social Icons */}
            <div className="flex space-x-4 mt-4 md:mt-0">
              <a href="#" className="hover:text-gw-green-2 transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              <a href="#" className="hover:text-gw-green-2 transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.024-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.097.118.112.221.085.339-.09.375-.293 1.199-.334 1.363-.053.225-.174.271-.402.162-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.357-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24.009c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001.012.001z"/>
                </svg>
              </a>
              <a href="#" className="hover:text-gw-green-2 transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
