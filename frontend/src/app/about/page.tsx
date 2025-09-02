import Header from '@/components/Header';
import Link from 'next/link';
import Image from 'next/image';

export default function AboutUs() {
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
        {/* Optional overlay for readability */}
        <div className="absolute inset-0 bg-gw-green-1/40" />

        {/* Content */}
        <div className="relative z-10 w-full px-4">
          <div className="mx-auto max-w-3xl bg-white/80 py-10 px-6 md:px-12 rounded-xl text-center">
            <h1 className="font-calluna font-black text-4xl md:text-5xl lg:text-[56px] leading-[110%] text-gw-green-1">
              About Us
            </h1>
          </div>
        </div>
      </section>

      {/* Main Content (no global container here) */}
      <main>
        {/* About Section (constrained content) */}
        <section className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-center bg-white md:px-20 py-20 gap-12 md:gap-20">
            {/* Left Image */}
            <div className="w-full md:w-[600px] h-[300px] md:h-[400px] relative shadow-md overflow-hidden">
              <Image
                src="/images/location/storefront-sign.jpg"
                alt="Groundwork Books storefront sign"
                fill
                className="object-cover object-top"
                sizes="(max-width: 768px) 100vw, 600px"
                priority
              />
            </div>

            {/* Right Content */}
            <div className="flex flex-col items-start gap-6 md:gap-8 w-full md:w-[546px]">
              <h2 className="font-calluna font-black text-3xl md:text-[35px] leading-[110%] text-gw-green-1">
                Groundwork Books Collective
              </h2>

              <div className="flex flex-col gap-6 text-gw-black text-base md:text-lg leading-[140%]">
                <p>
                  Since <strong>1973</strong>, we at the Groundwork Books Collective are a leftist,
                  non-hierarchical, non-profit, workers’ cooperative that works to aid our community
                  and sell leftist literature. You don’t have to be a volunteer at Groundwork to enjoy
                  our space. Come sit, study, relax, or even chat with friends at our public community
                  space!
                </p>
                <p>
                  Groundwork Books is both a bookstore and community space at UCSD, offering
                  affordable books on philosophy, political theory, feminist theory, art, and more. We
                  provide free zines and pamphlets from activist groups and host organizations like
                  SJP, USAS, and Cops Off Campus. The store fosters radical pedagogy through teach-ins
                  on topics like feminism, inequity in academia, and Palestinian history. Come visit
                  or volunteer!
                </p>
              </div>
            </div>
          </div>
        </section>

       {/* Info Sections */}
        <section className="bg-gw-green-2 px-6 py-20 w-full z-30">
          <div className="flex flex-col gap-20 w-full max-w-[1568px] mx-auto">
            <div className="grid grid-cols-[270px_minmax(0,700px)] gap-12 mx-auto">
              <h2 className="font-calluna font-black text-[35px] leading-[110%] text-gw-green-1">
                Leftist
              </h2>
              <p className="font-helvetica font-normal text-[18px] leading-[140%] text-gw-black">
                We embrace radical left-wing values, fostering an inclusive and safe
                environment while actively working to dismantle oppressive systems like
                capitalism.
              </p>
            </div>

            <div className="grid grid-cols-[270px_minmax(0,700px)] gap-12 mx-auto">
              <h2 className="font-calluna font-black text-[35px] leading-[110%] text-gw-green-1">
                Non-hierarchical
              </h2>
              <p className="font-helvetica font-normal text-[18px] leading-[140%] text-gw-black">
                Groundwork operates without bosses or managers, ensuring equal footing
                for all workers, who choose how they want to contribute.
              </p>
            </div>

            <div className="grid grid-cols-[270px_minmax(0,700px)] gap-12 mx-auto">
              <h2 className="font-calluna font-black text-[35px] leading-[110%] text-gw-green-1">
                Non-profit
              </h2>
              <p className="font-helvetica font-normal text-[18px] leading-[140%] text-gw-black">
                All our profits are reinvested into community-building projects and
                replenishing our stock, with no funds taken for personal gain.
              </p>
            </div>

            <div className="grid grid-cols-[270px_minmax(0,700px)] gap-12 mx-auto">
              <h2 className="font-calluna font-black text-[35px] leading-[110%] text-gw-green-1">
                Cooperative
              </h2>
              <p className="font-helvetica font-normal text-[18px] leading-[140%] text-gw-black">
                Groundwork Books is collectively owned and operated by all workers, with
                all decisions made democratically to guide the store’s direction.
              </p>
            </div>
          </div>
        </section>

        {/* Contact Us Section */}
        <section className="bg-white">
          <div className="container mx-auto flex flex-col md:flex-row items-start justify-between gap-12 py-16 px-8">
            
            {/* Left side - Info */}
            <div className="flex-1">
              <h2 className="text-3xl font-calluna font-bold text-gw-green-1">Contact Us</h2>

              <p className="pt-8 pb-2 font-helvetica text-gw-black">
                <strong>Phone:</strong> <a href="tel:18582242614" className="underline">(858) 224-2614</a>
              </p>

              <p className="py-2 font-helvetica text-gw-black">
                <strong>Email:</strong> <a href="mailto:groundworkbookscollective@gmail.com" className="underline">groundworkbookscollective@gmail.com</a>
              </p>

              <p className="py-2 font-helvetica text-gw-black">
                <strong>Address:</strong> <span className="underline">0323 UCSD Old Student Center, La Jolla, CA</span>
              </p>

              <h3 className="text-2xl font-calluna text-gw-green-1 font-bold pt-6 pb-2">
                Hours
              </h3>

              <ul className="font-helvetica text-gw-black space-y-2">
                <li className="flex justify-between w-64">
                  <span>Monday</span> <span>10:00am - 5:00pm</span>
                </li>
                <li className="flex justify-between w-64">
                  <span>Tuesday</span> <span>10:00am - 5:00pm</span>
                </li>
                <li className="flex justify-between w-64">
                  <span>Wednesday</span> <span>10:00am - 5:00pm</span>
                </li>
                <li className="flex justify-between w-64">
                  <span>Thursday</span> <span>10:00am - 5:00pm</span>
                </li>
                <li className="flex justify-between w-64">
                  <span>Friday</span> <span>10:00am - 5:00pm</span>
                </li>
                <li className="flex justify-between w-64">
                  <span>Saturday</span> <span>Closed</span>
                </li>
                <li className="flex justify-between w-64">
                  <span>Sunday</span> <span>Closed</span>
                </li>
              </ul>

              <p className="text-sm text-gw-black mt-6">
                *Hours listed may vary during the summer and holidays. Feel free to email or call if you have any questions. :)
              </p>
            </div>

            {/* Right side - Map image */}
            <div className="flex-1">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3350.7915787518186!2d-117.24267792381141!3d32.87723347885692!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x80dc06c53e2ac649%3A0xb7b1534d806dc5aa!2sGroundwork%20Bookstore!5e0!3m2!1sen!2sus!4v1756238000737!5m2!1sen!2sus"
                className="w-full h-[450px] rounded-lg shadow-md border-0"
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
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
      </main>

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
