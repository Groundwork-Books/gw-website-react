import Header from '@/components/Header';
import Footer from '@/components/Footer';
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
          <div className="flex flex-col md:flex-row items-start justify-center bg-white md:px-8 py-20 gap-12 md:gap-20">
            {/* Left Image */}
            <div className="w-full md:w-2/5 aspect-[5/3] relative shadow-md overflow-hidden">
              <Image
                src="/images/location/storefront-sign.png"
                alt="Groundwork Books storefront sign"
                fill
                className="object-cover object-top"
                sizes="(max-width: 768px) 100vw, 40vw"
                priority
              />
            </div>

            {/* Right Content */}
            <div className="flex flex-col items-start gap-6 md:gap-8 w-full md:w-3/5">
              <h2 className="font-calluna font-black text-3xl md:text-[35px] leading-[110%] text-gw-green-1">
                Groundwork Books Collective
              </h2>

              <div className="flex flex-col gap-6 text-gw-black text-base leading-[140%]">
                <p>
                  Founded in <strong>1973</strong> by UCSD students, Groundwork Books is a leftist, non-hierarchical, non-profit, volunteer-run cooperative bookstore and community space in San Diego.
                  We are collectively owned and operated, with no bosses or managers, every volunteer has an equal voice in shaping our direction.
                </p>

                <p>
                  Our mission is to make radical literature and ideas accessible while fostering a safe, inclusive, and community-driven space.
                  We offer affordable books on philosophy, political theory, feminism, art, and cultural critique, alongside free zines, pamphlets, and materials from activist groups.
                </p>

                <p>
                  Groundwork is more than a bookstore; it{"'"}s a hub for organizing, learning, and connection. We host teach-ins, support groups like Students for Justice in Palestine
                  (SJP) and Cops Off Campus, and run projects like Books Through Bars, which sends books to incarcerated people.
                </p>

                <p>
                  The store is staffed entirely by volunteers from UCSD and the wider San Diego community. Whether you want to study, browse, or get involved,
                  you{"'"}re welcome here. Volunteers help with everything from running the register and stocking books to outreach, accounting, and community events.
                </p>

                <p>
                  Groundwork exists to challenge oppression and build alternatives, rooted in solidarity, education, and collective care.
                  Come visit, get involved, and be part of our cooperative effort!
                </p>
              </div>
            </div>
          </div>
        </section>

       {/* Info Sections */}
        <section className="bg-gw-green-2 px-6 py-20 w-full z-30">
          <div className="flex flex-col gap-20 w-full max-w-[1568px] mx-auto">
            
            <div className="grid grid-cols-[34px_1fr] md:grid-cols-[34px_320px_minmax(0,600px)] gap-4 md:gap-8 items-start mx-auto">
              <svg width="34" height="35" viewBox="0 0 34 35" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M28.0513 8.30153H25.5232V5.53228C25.522 4.40782 25.2084 3.31038 24.6241 2.38587C24.0397 1.46136 23.2123 0.753572 22.2518 0.356608C21.2913 -0.0403559 20.2433 -0.10769 19.247 0.163559C18.2508 0.434809 17.3535 1.03179 16.6745 1.87513C16.0273 1.07174 15.1814 0.491181 14.2391 0.203817C13.2968 -0.0835465 12.2986 -0.065378 11.3656 0.256121C10.4325 0.577619 9.60464 1.18865 8.98224 2.01515C8.35985 2.84165 7.96966 3.84815 7.85898 4.91266C7.09101 4.41845 6.2175 4.1552 5.32681 4.14956C4.43613 4.14393 3.5599 4.3961 2.78677 4.88056C2.01365 5.36502 1.37107 6.06458 0.924071 6.90844C0.477069 7.75231 0.241503 8.71054 0.241211 9.68616V16.6093C0.241211 21.3832 1.97257 25.9616 5.0544 29.3373C8.13624 32.713 12.3161 34.6094 16.6745 34.6094C21.0328 34.6094 25.2127 32.713 28.2945 29.3373C31.3764 25.9616 33.1077 21.3832 33.1077 16.6093V13.84C33.1077 12.3711 32.575 10.9624 31.6268 9.92373C30.6785 8.88505 29.3924 8.30153 28.0513 8.30153ZM20.4668 2.76303C21.1373 2.76303 21.7803 3.05479 22.2545 3.57412C22.7286 4.09346 22.995 4.79783 22.995 5.53228V8.30153H17.9386V5.53228C17.9386 4.79783 18.2049 4.09346 18.6791 3.57412C19.1532 3.05479 19.7962 2.76303 20.4668 2.76303ZM10.354 5.53228C10.354 4.79783 10.6204 4.09346 11.0945 3.57412C11.5686 3.05479 12.2117 2.76303 12.8822 2.76303C13.5527 2.76303 14.1958 3.05479 14.6699 3.57412C15.144 4.09346 15.4104 4.79783 15.4104 5.53228V12.4554C15.4104 13.1899 15.144 13.8942 14.6699 14.4136C14.1958 14.9329 13.5527 15.2247 12.8822 15.2247C12.2117 15.2247 11.5686 14.9329 11.0945 14.4136C10.6204 13.8942 10.354 13.1899 10.354 12.4554V5.53228ZM2.76941 9.68616C2.76941 8.95171 3.03577 8.24734 3.5099 7.728C3.98402 7.20867 4.62708 6.91691 5.2976 6.91691C5.96812 6.91691 6.61117 7.20867 7.0853 7.728C7.55943 8.24734 7.82579 8.95171 7.82579 9.68616V12.4554C7.82579 13.1899 7.55943 13.8942 7.0853 14.4136C6.61117 14.9329 5.96812 15.2247 5.2976 15.2247C4.62708 15.2247 3.98402 14.9329 3.5099 14.4136C3.03577 13.8942 2.76941 13.1899 2.76941 12.4554V9.68616ZM30.5795 16.6093C30.5795 20.5925 29.1548 24.4172 26.611 27.2636C24.0671 30.11 20.6065 31.7516 16.9708 31.8365C13.3351 31.9214 9.81379 30.4428 7.1615 27.7177C4.50921 24.9927 2.93707 21.2379 2.78205 17.2583C3.79246 17.8949 4.97292 18.1286 6.12283 17.9197C7.27273 17.7108 8.32114 17.0723 9.08989 16.1126C9.9611 17.1999 11.1868 17.8697 12.5039 17.9781C13.8209 18.0865 15.1243 17.6249 16.1341 16.6924C16.5888 17.5179 17.2312 18.2001 17.9986 18.6724C17.1853 19.4506 16.5335 20.4106 16.0871 21.4877C15.6406 22.5648 15.4099 23.7341 15.4104 24.9171C15.4104 25.2843 15.5436 25.6365 15.7806 25.8961C16.0177 26.1558 16.3392 26.3017 16.6745 26.3017C17.0097 26.3017 17.3313 26.1558 17.5683 25.8961C17.8054 25.6365 17.9386 25.2843 17.9386 24.9171C17.9386 23.4482 18.4713 22.0394 19.4196 21.0007C20.3678 19.9621 21.6539 19.3785 22.995 19.3785C23.3302 19.3785 23.6517 19.2327 23.8888 18.973C24.1259 18.7133 24.2591 18.3611 24.2591 17.9939C24.2591 17.6267 24.1259 17.2745 23.8888 17.0148C23.6517 16.7552 23.3302 16.6093 22.995 16.6093H20.4668C19.7962 16.6093 19.1532 16.3175 18.6791 15.7982C18.2049 15.2789 17.9386 14.5745 17.9386 13.84V11.0708H28.0513C28.7219 11.0708 29.3649 11.3625 29.8391 11.8819C30.3132 12.4012 30.5795 13.1056 30.5795 13.84V16.6093Z" fill="#1D4825"/>
              </svg>

              <h2 className="font-calluna font-black text-[28px] md:text-[35px] leading-[110%] text-gw-green-1">
                Leftist
              </h2>
              <p className="font-helvetica font-normal  leading-[140%] text-gw-black">
                Groundwork Books is proudly rooted in radical left-wing values. We believe in creating a welcoming space for people of all identities while rejecting systems 
                of oppression like capitalism, racism, sexism, homophobia, and transphobia. 
                Our mission is to cultivate solidarity and empower communities through education, dialogue, and collective action.
              </p>
            </div>

            <div className="grid grid-cols-[34px_1fr] md:grid-cols-[34px_320px_minmax(0,600px)] gap-4 md:gap-8 items-start mx-auto">
              <svg width="35" height="35" viewBox="0 0 35 35" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.7773 19.0342H12.6113C12.1619 19.0342 11.731 19.2165 11.4132 19.541C11.0955 19.8655 10.917 20.3057 10.917 20.7646C10.917 21.2235 11.0955 21.6636 11.4132 21.9882C11.731 22.3127 12.1619 22.495 12.6113 22.495H22.7773C23.2267 22.495 23.6576 22.3127 23.9754 21.9882C24.2931 21.6636 24.4716 21.2235 24.4716 20.7646C24.4716 20.3057 24.2931 19.8655 23.9754 19.541C23.6576 19.2165 23.2267 19.0342 22.7773 19.0342ZM22.7773 12.1127H12.6113C12.1619 12.1127 11.731 12.295 11.4132 12.6195C11.0955 12.944 10.917 13.3841 10.917 13.8431C10.917 14.302 11.0955 14.7421 11.4132 15.0666C11.731 15.3911 12.1619 15.5734 12.6113 15.5734H22.7773C23.2267 15.5734 23.6576 15.3911 23.9754 15.0666C24.2931 14.7421 24.4716 14.302 24.4716 13.8431C24.4716 13.3841 24.2931 12.944 23.9754 12.6195C23.6576 12.295 23.2267 12.1127 22.7773 12.1127ZM17.6943 0C14.3432 0 11.0674 1.01485 8.2811 2.91622C5.49479 4.81759 3.32312 7.52008 2.04072 10.6819C0.758318 13.8438 0.422783 17.323 1.07655 20.6796C1.73031 24.0362 3.344 27.1195 5.71357 29.5395C8.08314 31.9595 11.1022 33.6075 14.3888 34.2752C17.6755 34.9428 21.0823 34.6002 24.1782 33.2905C27.2742 31.9808 29.9204 29.7629 31.7822 26.9173C33.6439 24.0717 34.6376 20.7262 34.6376 17.3038C34.6376 15.0315 34.1994 12.7813 33.3479 10.6819C32.4964 8.58254 31.2484 6.67498 29.6751 5.06817C28.1017 3.46136 26.2339 2.18677 24.1782 1.31718C22.1226 0.447577 19.9193 0 17.6943 0ZM17.6943 31.1469C15.0135 31.1469 12.3928 30.335 10.1637 28.8139C7.93469 27.2928 6.19736 25.1308 5.17144 22.6013C4.14552 20.0718 3.87709 17.2885 4.4001 14.6032C4.92311 11.9179 6.21407 9.45129 8.10972 7.5153C10.0054 5.57932 12.4206 4.26089 15.0499 3.72676C17.6793 3.19262 20.4047 3.46676 22.8815 4.51451C25.3582 5.56225 27.4752 7.33655 28.9646 9.61303C30.454 11.8895 31.249 14.5659 31.249 17.3038C31.249 20.9752 29.8209 24.4963 27.2789 27.0923C24.7369 29.6884 21.2892 31.1469 17.6943 31.1469Z" fill="#1D4825"/>
              </svg>
              <h2 className="font-calluna font-black text-[28px] md:text-[35px] leading-[110%] text-gw-green-1">
                Non-hierarchical
              </h2>

              <p className="font-helvetica font-normal leading-[140%] text-gw-black">
                At Groundwork, there are no bosses or managers; just people working together as equals. Every worker has an equal voice and the freedom
                to choose how they contribute. 
                This ensures that our store remains a space where collaboration, respect, and autonomy guide the way we operate.
              </p>
            </div>

            <div className="grid grid-cols-[34px_1fr] md:grid-cols-[34px_320px_minmax(0,600px)] gap-4 md:gap-8 items-start mx-auto">
              <svg width="41" height="39" viewBox="0 0 41 39" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M33.3733 23.1491C36.1086 20.3421 38.8806 16.9774 38.8806 12.5746C38.8806 9.77001 37.8169 7.08033 35.9234 5.09722C34.0298 3.1141 31.4617 2 28.7839 2C25.5529 2 23.2765 2.96132 20.5228 5.8453C17.7692 2.96132 15.4928 2 12.2618 2C9.584 2 7.01584 3.1141 5.12232 5.09722C3.22881 7.08033 2.16504 9.77001 2.16504 12.5746C2.16504 16.9967 4.91871 20.3613 7.67238 23.1491L20.5228 36.6077L33.3733 23.1491Z" stroke="#1D4825" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M20.5231 5.84534L15.0892 11.5364C14.7162 11.9242 14.4201 12.3855 14.2181 12.8936C14.0161 13.4018 13.9121 13.9468 13.9121 14.4973C13.9121 15.0477 14.0161 15.5927 14.2181 16.1009C14.4201 16.609 14.7162 17.0703 15.0892 17.4581C16.5945 19.0347 18.9994 19.0924 20.5965 17.5927L24.3966 13.9397C25.3491 13.0345 26.5892 12.5331 27.8754 12.5331C29.1616 12.5331 30.4017 13.0345 31.3542 13.9397L36.7881 19.0539M31.5378 25.0718L27.8662 21.2265M26.0304 30.8398L22.3589 26.9945" stroke="#1D4825" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>


              <h2 className="font-calluna font-black text-[28px] md:text-[35px] leading-[110%] text-gw-green-1">
                Non-profit
              </h2>
              <p className="font-helvetica font-normal leading-[140%] text-gw-black">
                We do not seek profit for personal gain. Every dollar earned is reinvested into our stock and community initiatives, such as our Books Through Bars program,
                 which provides books to incarcerated people. By keeping money in service of the community, we prioritize purpose over profit.
              </p>
            </div>

            <div className="grid grid-cols-[34px_1fr] md:grid-cols-[34px_320px_minmax(0,600px)] gap-4 md:gap-8 items-start mx-auto">
              <svg width="48" height="30" viewBox="0 0 48 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14.3322 27.5796V25.4479C14.3322 22.6212 15.371 19.9103 17.2201 17.9115C19.0693 15.9127 21.5772 14.7898 24.1923 14.7898M24.1923 14.7898C26.8074 14.7898 29.3154 15.9127 31.1645 17.9115C33.0136 19.9103 34.0525 22.6212 34.0525 25.4479V27.5796M24.1923 14.7898C25.7614 14.7898 27.2661 14.116 28.3756 12.9168C29.4851 11.7175 30.1084 10.0909 30.1084 8.39489C30.1084 6.69886 29.4851 5.0723 28.3756 3.87302C27.2661 2.67375 25.7614 2 24.1923 2C22.6233 2 21.1185 2.67375 20.009 3.87302C18.8995 5.0723 18.2762 6.69886 18.2762 8.39489C18.2762 10.0909 18.8995 11.7175 20.009 12.9168C21.1185 14.116 22.6233 14.7898 24.1923 14.7898ZM2.5 27.5796V25.4479C2.5 23.7519 3.1233 22.1253 4.23278 20.9261C5.34226 19.7268 6.84704 19.053 8.41609 19.053M8.41609 19.053C9.46212 19.053 10.4653 18.6039 11.205 17.8044C11.9446 17.0049 12.3601 15.9205 12.3601 14.7898C12.3601 13.6591 11.9446 12.5747 11.205 11.7752C10.4653 10.9757 9.46212 10.5265 8.41609 10.5265C7.37006 10.5265 6.36687 10.9757 5.62722 11.7752C4.88756 12.5747 4.47203 13.6591 4.47203 14.7898C4.47203 15.9205 4.88756 17.0049 5.62722 17.8044C6.36687 18.6039 7.37006 19.053 8.41609 19.053ZM45.8846 27.5796V25.4479C45.8846 23.7519 45.2613 22.1253 44.1519 20.9261C43.0424 19.7268 41.5376 19.053 39.9686 19.053M39.9686 19.053C41.0146 19.053 42.0178 18.6039 42.7574 17.8044C43.4971 17.0049 43.9126 15.9205 43.9126 14.7898C43.9126 13.6591 43.4971 12.5747 42.7574 11.7752C42.0178 10.9757 41.0146 10.5265 39.9686 10.5265C38.9225 10.5265 37.9193 10.9757 37.1797 11.7752C36.44 12.5747 36.0245 13.6591 36.0245 14.7898C36.0245 15.9205 36.44 17.0049 37.1797 17.8044C37.9193 18.6039 38.9225 19.053 39.9686 19.053Z" stroke="#1D4825" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>

              <h2 className="font-calluna font-black text-[28px] md:text-[35px] leading-[110%] text-gw-green-1">
                Cooperative
              </h2>
              <p className="font-helvetica font-normal leading-[140%] text-gw-black">
                Groundwork is collectively owned and operated by the people who keep it alive. Decisions are made democratically, 
                with every worker having a say in shaping the direction of the store. 
                This cooperative model ensures shared responsibility, collective ownership, and true community-driven work.
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
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
              <div className="order-1 lg:order-2 space-y-6 lg:pl-4">
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
      <Footer />
    </div>
  );
}
