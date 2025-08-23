import Header from '@/components/Header';

export default function AboutUs() {
  return (
    <div className="min-h-screen bg-gw-white font-helvetica text-gw-black">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        {/* Banner Section */}
        <div className="w-full flex flex-col justify-center items-center px-4 md:px-0 py-20 gap-2 h-[302px] bg-[url('/images/hero/book-collage.jpg')] bg-cover bg-center mb-12">
          <div className="flex flex-col justify-center items-center py-10 px-0 gap-8 w-full md:w-[800px] h-[142px] bg-white/80">
            <h1 className="font-calluna font-black text-4xl md:text-5xl lg:text-[56px] leading-[110%] text-center text-gw-green-1">
              About Us
            </h1>
          </div>
        </div>

        <section className="flex flex-col md:flex-row items-center justify-center bg-white px-6 md:px-20 py-20 gap-12 md:gap-20">
          {/* Left Image */}
          <div className="w-full md:w-[600px] h-[300px] md:h-[400px] bg-[url('/images/location/storefront-sign.jpg')] bg-top shadow-md bg-[length:120%]" />

          {/* Right Content */}
          <div className="flex flex-col items-start gap-6 md:gap-8 w-full md:w-[546px]">
            {/* Headline */}
            <h2 className="font-calluna font-black text-3xl md:text-[35px] leading-[110%] text-gw-green-1">
              Groundwork Books Collective
            </h2>

            {/* Paragraphs */}
            <div className="flex flex-col gap-6 text-gw-black text-base md:text-lg leading-[140%]">
              <p>
                Since <strong>1973</strong>, we at the Groundwork Books Collective are a leftist, non-hierarchical, non-profit, workers’ cooperative that works to aid our community and sell leftist literature. You don’t have to be a volunteer at Groundwork to enjoy our space. Come sit, study, relax, or even chat with friends at our public community space!
              </p>
              <p>
                Groundwork Books is both a bookstore and community space at UCSD, offering affordable books on philosophy, political theory, feminist theory, art, and more. We provide free zines and pamphlets from activist groups and host organizations like SJP, USAS, and Cops Off Campus. The store fosters radical pedagogy through teach-ins on topics like feminism, inequity in academia, and Palestinian history. Come visit or volunteer!
              </p>
            </div>
          </div>
        </section>


        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 mb-16">
            <div className="space-y-6">
              <h3 className="text-2xl font-calluna font-bold text-gw-green-1">GROUNDWORK BOOKS</h3>
              <p className="text-lg leading-relaxed">
                We are an independent bookstore committed to fostering community through literature. 
                Our curated selection focuses on diverse voices, independent publishers, and works 
                that challenge and inspire.
              </p>
            </div>
            
            <div className="bg-gw-green-2 rounded-lg h-64 md:h-auto flex items-center justify-center">
              <span className="text-gw-green-1 font-calluna italic">Bookstore Image</span>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-12 mb-16">
            <div className="bg-gw-green-2 rounded-lg h-64 md:h-auto flex items-center justify-center order-2 md:order-1">
              <span className="text-gw-green-1 font-calluna italic">Community Space Image</span>
            </div>
            
            <div className="space-y-6 order-1 md:order-2">
              <h3 className="text-2xl font-calluna font-bold text-gw-green-1">Leftist</h3>
              <p className="text-lg leading-relaxed">
                We embrace radical left-wing values, fostering an inclusive and safe enviroment while actively working to dismantle oppressive systems like capitalism.
              </p>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-12 mb-16">
            <div className="space-y-6">
              <h3 className="text-2xl font-calluna font-bold text-gw-green-1">Non-hierarchical</h3>
              <p className="text-lg leading-relaxed">
                Groundwork operates without bosses or managers, ensuring equal footing for all workers, who choose how they ant to contribute.
              </p>
            </div>
            
            <div className="bg-gw-green-2 rounded-lg h-64 md:h-auto flex items-center justify-center">
              <span className="text-gw-green-1 font-calluna italic">Team Image</span>
            </div>
          </div>
        </div>
        
        {/* Call to Action */}
        <section className="bg-gw-green-2 p-8 md:p-12  mx-auto text-center mb-16">
          <h3 className="text-2xl md:text-3xl font-calluna font-bold text-gw-green-1 mb-6">
            Interested in Volunteering?
          </h3>
          <p className="text-lg mb-6">
            Join our community of book lovers and help us create meaningful literary experiences.
          </p>
          <button className="bg-gw-green-1 text-gw-white px-6 py-3 rounded-lg font-medium hover:bg-opacity-90 transition">
            Get Involved
          </button>
        </section>
        
        {/* Contact Section */}
        <div className="text-center mb-16">
          <h3 className="text-2xl md:text-3xl font-calluna font-bold text-gw-green-1 mb-6">
            Contact Us
          </h3>
          <p className="text-lg mb-4">info@groundworkbooks.com</p>
          <p className="text-lg">123 Book Lane, Literary City, LC 12345</p>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gw-green-1 text-gw-white py-8 px-6">
        <div className="container mx-auto text-center">
          <p className="text-xl font-bold mb-4">Crowdwork Books</p>
          <p className="text-gw-green-2">© {new Date().getFullYear()} Groundwork Books. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}