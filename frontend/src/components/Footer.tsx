import React from "react";
import Link from 'next/link';

const Footer = () => (
<footer className="bg-gw-green-1 text-gw-white py-12">
<div className="w-full px-7">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left side - Contact info */}
        <div className="space-y-4">
          <h3 className="text-2xl font-bold font-calluna">Groundwork Books</h3>
          <div className="space-y-2 text-base">
            <p>
                <a
                    href="https://maps.app.goo.gl/4C3g3gH6V6hjmvGBA"
                    target="_blank"
                    rel="noopener noreferrer"
                    className=" hover:text-gw-green-2 transition-colors"
                >
                    0323 UCSD Old Student Center, La Jolla, CA 92037
                </a>
                </p>
                    <p>
                          <a
                            href="mailto:groundworkbookscollective@gmail.com"
                            className="hover:text-gw-green-2 transition-colors"
                          >
                            groundworkbookscollective@gmail.com
                          </a>
                    </p>

            <p>
              <a
                href="tel:8582242614"
                className="font-bold hover:text-gw-green-2 transition-colors"
              >
                (858) 224-2614
              </a>
            </p>
          </div>
        </div>
        {/* Right side - Navigation */}
        <div className="flex flex-col items-end justify-between h-full">
          <nav className="flex flex-wrap gap-8 text-lg font-normal">
            <Link href="/" className="hover:text-gw-green-2 transition-colors">HOME</Link>
            <Link href="/store" className="hover:text-gw-green-2 transition-colors">STORE</Link>
            {/* <Link href="/archive" className="hover:text-gw-green-2 transition-colors">ARCHIVE</Link> */}
            <Link href="/community" className="hover:text-gw-green-2 transition-colors">COMMUNITY</Link>
            <Link href="/about" className="hover:text-gw-green-2 transition-colors">ABOUT</Link>
          </nav>
        </div>
      </div>
      {/* Bottom section */}
      <div className="mt-8 pt-8 border-t border-gw-white/70 flex flex-col md:flex-row justify-between items-center">
        <p className="text-base text-gw-white">
          Groundwork Books Collective @ {new Date().getFullYear()}
        </p>
        {/* Social Icons */}
        <div className="flex space-x-6 mt-4 md:mt-0">
          <a href="https://twitter.com/groundworkbooks" className="hover:text-gw-green-2 transition-colors" aria-label="Twitter">
            {/* Twitter icon */}
            <svg fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6">
              <path d="M13.1926 9.78269L21.4449 0.395874H19.489L12.3255 8.54599L6.60119 0.395874H0L8.65489 12.7216L0 22.5645H1.95591L9.52201 13.9567L15.5674 22.5645H22.1686L13.1926 9.78269ZM2.66003 1.83683H5.66398L19.4906 21.19H16.4867L2.66003 1.83683Z" fill="currentColor"/>
            </svg>
          </a>
          <a href="https://www.instagram.com/groundworkbooks/" className="hover:text-gw-green-2 transition-colors" aria-label="Instagram">
            {/* Instagram icon */}
            <svg fill="none" xmlns="http://www.w3.org/2000/svg" className="w-7 h-7">
              <path d="M12.3922 0.395874C13.6391 0.399199 14.272 0.40585 14.8185 0.421367L15.0335 0.429126C15.2818 0.437993 15.5267 0.449077 15.8226 0.462378C17.0019 0.517798 17.8066 0.70401 18.5127 0.977786C19.2442 1.25932 19.8604 1.64061 20.4767 2.25577C21.0403 2.80986 21.4764 3.4801 21.7546 4.21987C22.0284 4.92592 22.2146 5.73062 22.27 6.91107C22.2833 7.2059 22.2944 7.45086 22.3033 7.70025L22.3099 7.91528C22.3266 8.46062 22.3332 9.09351 22.3354 10.3405L22.3365 11.1673V12.6193C22.3393 13.4278 22.3308 14.2363 22.3111 15.0445L22.3044 15.2596C22.2955 15.509 22.2845 15.7539 22.2712 16.0487C22.2157 17.2292 22.0273 18.0328 21.7546 18.7399C21.4772 19.4801 21.041 20.1505 20.4767 20.704C19.9225 21.2675 19.2523 21.7035 18.5127 21.982C17.8066 22.2558 17.0019 22.442 15.8226 22.4974C15.5596 22.5098 15.2966 22.5209 15.0335 22.5307L14.8185 22.5373C14.272 22.5529 13.6391 22.5606 12.3922 22.5628L11.5654 22.5639H10.1145C9.3057 22.5667 8.49688 22.5582 7.68829 22.5384L7.47327 22.5318C7.21015 22.5218 6.9471 22.5104 6.68411 22.4974C5.5048 22.442 4.70012 22.2558 3.99298 21.982C3.25333 21.7042 2.58337 21.268 2.03005 20.704C1.46594 20.1502 1.02944 19.4799 0.750992 18.7399C0.477224 18.0339 0.291017 17.2292 0.235599 16.0487C0.22325 15.7857 0.212166 15.5227 0.202348 15.2596L0.196806 15.0445C0.176381 14.2363 0.167144 13.4278 0.169097 12.6193V10.3405C0.166003 9.532 0.174132 8.72353 0.193481 7.91528L0.201239 7.70025C0.210106 7.45086 0.22119 7.2059 0.234491 6.91107C0.289909 5.73062 0.476116 4.92703 0.749884 4.21987C1.02821 3.47935 1.46558 2.80889 2.03116 2.25577C2.58434 1.69212 3.25386 1.25598 3.99298 0.977786C4.70012 0.70401 5.50369 0.517798 6.68411 0.462378C6.97894 0.449077 7.22499 0.437993 7.47327 0.429126L7.68829 0.422476C8.49651 0.402782 9.30496 0.394284 10.1134 0.396982L12.3922 0.395874ZM11.2528 5.93789C9.78303 5.93789 8.37343 6.52178 7.33413 7.56111C6.29483 8.60044 5.71096 10.0101 5.71096 11.4799C5.71096 12.9497 6.29483 14.3594 7.33413 15.3987C8.37343 16.438 9.78303 17.0219 11.2528 17.0219C12.7226 17.0219 14.1322 16.438 15.1715 15.3987C16.2108 14.3594 16.7947 12.9497 16.7947 11.4799C16.7947 10.0101 16.2108 8.60044 15.1715 7.56111C14.1322 6.52178 12.7226 5.93789 11.2528 5.93789ZM11.2528 8.1547C11.6895 8.15462 12.1219 8.24056 12.5253 8.4076C12.9288 8.57464 13.2954 8.81951 13.6042 9.12824C13.913 9.43696 14.158 9.80349 14.3252 10.2069C14.4923 10.6103 14.5784 11.0427 14.5785 11.4794C14.5786 11.916 14.4926 12.3484 14.3256 12.7519C14.1586 13.1554 13.9137 13.522 13.605 13.8308C13.2963 14.1396 12.9297 14.3846 12.5264 14.5518C12.123 14.719 11.6906 14.805 11.2539 14.8051C10.3721 14.8051 9.5263 14.4548 8.90272 13.8312C8.27913 13.2076 7.92881 12.3618 7.92881 11.4799C7.92881 10.598 8.27913 9.75223 8.90272 9.12863C9.5263 8.50503 10.3721 8.1547 11.2539 8.1547M17.0729 4.27529C16.7054 4.27529 16.353 4.42126 16.0932 4.68109C15.8334 4.94092 15.6874 5.29333 15.6874 5.66079C15.6874 6.02825 15.8334 6.38066 16.0932 6.64049C16.353 6.90032 16.7054 7.04629 17.0729 7.04629C17.4403 7.04629 17.7927 6.90032 18.0526 6.64049C18.3124 6.38066 18.4583 6.02825 18.4583 5.66079C18.4583 5.29333 18.3124 4.94092 18.0526 4.68109C17.7927 4.42126 17.4403 4.27529 17.0729 4.27529Z" fill="currentColor"/>
            </svg>
          </a>
          <a href="https://www.facebook.com/ucsdgroundworkbooks/" className="hover:text-gw-green-2 transition-colors" aria-label="Facebook">
            {/* Facebook icon */}
            <svg fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8">
              <path d="M24.0895 11.5089C24.0895 5.156 18.769 0 12.2134 0C5.65786 0 0.337402 5.156 0.337402 11.5089C0.337402 17.0793 4.42276 21.7174 9.83822 22.7877V14.9616H7.46302V11.5089H9.83822V8.6317C9.83822 6.41047 11.7028 4.60357 13.9948 4.60357H16.9638V8.05625H14.5886C13.9355 8.05625 13.401 8.57415 13.401 9.20714V11.5089H16.9638V14.9616H13.401V22.9603C19.3984 22.3849 24.0895 17.4821 24.0895 11.5089Z" fill="currentColor"/>
            </svg>
          </a>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;