import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Image from 'next/image';

export default function ArchivePage() {
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
              Newspaper Archive
            </h1>
          </div>
        </div>
      </section>


      <section className="flex flex-1 flex-col justify-center items-center w-full min-h-[calc(100vh-260px)]">
        <div className="bg-gw-green-2/90 text-center px-6 py-12 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-gw-green-1 mb-4">Page Under Construction</h2>
          <p className="text-lg text-gw-black">
        We{"'"}re working hard to bring you this archive. Please check back soon!
          </p>
        </div>
      </section>
      <Footer />
    </div>
  )
}