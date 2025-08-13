'use client';

import { useState } from 'react';

interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  description: string;
  image: string;
}

const events: Event[] = [
  {
    id: '1',
    title: 'Bonfire & Books! @La Jolla Cove',
    date: 'Thursday, December 26th, 2024',
    time: '7:30 PM',
    description: 'Join us for an evening of books, fire, and community at La Jolla Cove! Bring a book to share.',
    image: '/images/events/bonfire-books.jpg'
  },
  {
    id: '2', 
    title: 'Dollar Launch Club + Groundwork',
    date: 'Thursday, December 30th, 2024',
    time: '11:00 AM',
    description: 'Coffee, books, and community organizing. Come learn about local activism over a warm drink.',
    image: '/images/events/coffee-meeting.jpg'
  },
  {
    id: '3',
    title: 'Community Book Discussion',
    date: 'Friday, January 3rd, 2025',
    time: '6:00 PM', 
    description: 'Monthly book club meeting. This month we\'re discussing local authors and social justice literature.',
    image: '/images/events/book-discussion.jpg'
  }
];

export default function EventsCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === events.length - 1 ? 0 : prevIndex + 1
    );
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? events.length - 1 : prevIndex - 1
    );
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  return (
    <section className="bg-gw-green-2 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-center text-gw-black mb-12">
          Upcoming Events
        </h2>
        
        <div className="relative">
          {/* Main carousel container */}
          <div className="overflow-hidden rounded-lg">
            <div 
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {events.map((event) => (
                <div key={event.id} className="w-full flex-shrink-0">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                    {/* Event image */}
                    <div className="order-2 lg:order-1">
                      <div className="aspect-w-16 aspect-h-9 bg-gray-300 rounded-lg overflow-hidden">
                        <img 
                          src={event.image} 
                          alt={event.title}
                          className="w-full h-64 object-cover rounded-lg"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            target.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                        <div className="hidden w-full h-64 bg-gray-300 rounded-lg flex items-center justify-center">
                          <span className="text-gray-500">Add {event.image.split('/').pop()}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Event details */}
                    <div className="order-1 lg:order-2 space-y-4">
                      <div className="bg-gw-white p-2 inline-block rounded">
                        <span className="text-gw-green-1 font-bold text-sm">{event.date.split(',')[1]}</span>
                      </div>
                      
                      <h3 className="text-2xl font-bold text-gw-black">
                        {event.title}
                      </h3>
                      
                      <p className="text-gw-black/70">
                        <strong>{event.date} • {event.time}</strong>
                      </p>
                      
                      <p className="text-gw-black/80">
                        {event.description}
                      </p>
                      
                      <button className="bg-gw-white border-2 border-gw-green-1 text-gw-green-1 px-6 py-2 rounded-full font-semibold hover:bg-gw-green-1 hover:text-gw-white transition-colors">
                        Learn More
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation arrows */}
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-gw-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-2 shadow-lg transition-all"
          >
            <svg className="w-6 h-6 text-gw-green-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-gw-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-2 shadow-lg transition-all"
          >
            <svg className="w-6 h-6 text-gw-green-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Dots indicator */}
          <div className="flex justify-center mt-8 space-x-2">
            {events.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index === currentIndex ? 'bg-gw-green-1' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}