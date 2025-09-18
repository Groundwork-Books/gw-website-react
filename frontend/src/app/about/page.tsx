import Header from '@/components/Header';
import Link from 'next/link';
import Image from 'next/image';

export default function AboutUs() {
  return (
    <div className="min-h-screen bg-gw-white font-helvetica text-gw-black">
      {/* Header */}
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
            
            <div className="grid grid-cols-[34px_1fr] md:grid-cols-[34px_236px_minmax(0,700px)] gap-4 md:gap-6 items-start mx-auto">
              <svg width="34" height="35" viewBox="0 0 34 35" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M28.0513 8.30153H25.5232V5.53228C25.522 4.40782 25.2084 3.31038 24.6241 2.38587C24.0397 1.46136 23.2123 0.753572 22.2518 0.356608C21.2913 -0.0403559 20.2433 -0.10769 19.247 0.163559C18.2508 0.434809 17.3535 1.03179 16.6745 1.87513C16.0273 1.07174 15.1814 0.491181 14.2391 0.203817C13.2968 -0.0835465 12.2986 -0.065378 11.3656 0.256121C10.4325 0.577619 9.60464 1.18865 8.98224 2.01515C8.35985 2.84165 7.96966 3.84815 7.85898 4.91266C7.09101 4.41845 6.2175 4.1552 5.32681 4.14956C4.43613 4.14393 3.5599 4.3961 2.78677 4.88056C2.01365 5.36502 1.37107 6.06458 0.924071 6.90844C0.477069 7.75231 0.241503 8.71054 0.241211 9.68616V16.6093C0.241211 21.3832 1.97257 25.9616 5.0544 29.3373C8.13624 32.713 12.3161 34.6094 16.6745 34.6094C21.0328 34.6094 25.2127 32.713 28.2945 29.3373C31.3764 25.9616 33.1077 21.3832 33.1077 16.6093V13.84C33.1077 12.3711 32.575 10.9624 31.6268 9.92373C30.6785 8.88505 29.3924 8.30153 28.0513 8.30153ZM20.4668 2.76303C21.1373 2.76303 21.7803 3.05479 22.2545 3.57412C22.7286 4.09346 22.995 4.79783 22.995 5.53228V8.30153H17.9386V5.53228C17.9386 4.79783 18.2049 4.09346 18.6791 3.57412C19.1532 3.05479 19.7962 2.76303 20.4668 2.76303ZM10.354 5.53228C10.354 4.79783 10.6204 4.09346 11.0945 3.57412C11.5686 3.05479 12.2117 2.76303 12.8822 2.76303C13.5527 2.76303 14.1958 3.05479 14.6699 3.57412C15.144 4.09346 15.4104 4.79783 15.4104 5.53228V12.4554C15.4104 13.1899 15.144 13.8942 14.6699 14.4136C14.1958 14.9329 13.5527 15.2247 12.8822 15.2247C12.2117 15.2247 11.5686 14.9329 11.0945 14.4136C10.6204 13.8942 10.354 13.1899 10.354 12.4554V5.53228ZM2.76941 9.68616C2.76941 8.95171 3.03577 8.24734 3.5099 7.728C3.98402 7.20867 4.62708 6.91691 5.2976 6.91691C5.96812 6.91691 6.61117 7.20867 7.0853 7.728C7.55943 8.24734 7.82579 8.95171 7.82579 9.68616V12.4554C7.82579 13.1899 7.55943 13.8942 7.0853 14.4136C6.61117 14.9329 5.96812 15.2247 5.2976 15.2247C4.62708 15.2247 3.98402 14.9329 3.5099 14.4136C3.03577 13.8942 2.76941 13.1899 2.76941 12.4554V9.68616ZM30.5795 16.6093C30.5795 20.5925 29.1548 24.4172 26.611 27.2636C24.0671 30.11 20.6065 31.7516 16.9708 31.8365C13.3351 31.9214 9.81379 30.4428 7.1615 27.7177C4.50921 24.9927 2.93707 21.2379 2.78205 17.2583C3.79246 17.8949 4.97292 18.1286 6.12283 17.9197C7.27273 17.7108 8.32114 17.0723 9.08989 16.1126C9.9611 17.1999 11.1868 17.8697 12.5039 17.9781C13.8209 18.0865 15.1243 17.6249 16.1341 16.6924C16.5888 17.5179 17.2312 18.2001 17.9986 18.6724C17.1853 19.4506 16.5335 20.4106 16.0871 21.4877C15.6406 22.5648 15.4099 23.7341 15.4104 24.9171C15.4104 25.2843 15.5436 25.6365 15.7806 25.8961C16.0177 26.1558 16.3392 26.3017 16.6745 26.3017C17.0097 26.3017 17.3313 26.1558 17.5683 25.8961C17.8054 25.6365 17.9386 25.2843 17.9386 24.9171C17.9386 23.4482 18.4713 22.0394 19.4196 21.0007C20.3678 19.9621 21.6539 19.3785 22.995 19.3785C23.3302 19.3785 23.6517 19.2327 23.8888 18.973C24.1259 18.7133 24.2591 18.3611 24.2591 17.9939C24.2591 17.6267 24.1259 17.2745 23.8888 17.0148C23.6517 16.7552 23.3302 16.6093 22.995 16.6093H20.4668C19.7962 16.6093 19.1532 16.3175 18.6791 15.7982C18.2049 15.2789 17.9386 14.5745 17.9386 13.84V11.0708H28.0513C28.7219 11.0708 29.3649 11.3625 29.8391 11.8819C30.3132 12.4012 30.5795 13.1056 30.5795 13.84V16.6093Z" fill="#1D4825"/>
              </svg>

              <h2 className="font-calluna font-black text-[28px] md:text-[35px] leading-[110%] text-gw-green-1">
                Leftist
              </h2>
              <p className="font-helvetica font-normal text-[16px] md:text-[18px] leading-[140%] text-gw-black">
                We embrace radical left-wing values, fostering an inclusive and safe
                environment while actively working to dismantle oppressive systems like
                capitalism.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[270px_minmax(0,700px)] gap-6 md:gap-12 mx-auto">
              <h2 className="font-calluna font-black text-[28px] md:text-[35px] leading-[110%] text-gw-green-1">
                Non-hierarchical
              </h2>
              <p className="font-helvetica font-normal text-[16px] md:text-[18px] leading-[140%] text-gw-black">
                Groundwork operates without bosses or managers, ensuring equal footing
                for all workers, who choose how they want to contribute.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[270px_minmax(0,700px)] gap-6 md:gap-12 mx-auto">
              <h2 className="font-calluna font-black text-[28px] md:text-[35px] leading-[110%] text-gw-green-1">
                Non-profit
              </h2>
              <p className="font-helvetica font-normal text-[16px] md:text-[18px] leading-[140%] text-gw-black">
                All our profits are reinvested into community-building projects and
                replenishing our stock, with no funds taken for personal gain.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[270px_minmax(0,700px)] gap-6 md:gap-12 mx-auto">
              <h2 className="font-calluna font-black text-[28px] md:text-[35px] leading-[110%] text-gw-green-1">
                Cooperative
              </h2>
              <p className="font-helvetica font-normal text-[16px] md:text-[18px] leading-[140%] text-gw-black">
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
                <Link href="/store" className="hover:text-gw-green-2 transition-colors">STORE</Link>
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
