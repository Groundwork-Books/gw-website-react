'use client';

import { useState, useEffect } from 'react';
import { getEvents, type Event } from '@/lib/api';
import Image from 'next/image';

export default function EventsCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const eventsData = await getEvents();
        setEvents(eventsData);
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

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

  if (loading) {
    return (
      <section className="bg-gw-green-2 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gw-black mb-12">
            Upcoming Events
          </h2>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gw-green-1"></div>
          </div>
        </div>
      </section>
    );
  }

  if (events.length === 0) {
    return (
      <section className="bg-gw-green-2 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gw-black mb-12">
            Upcoming Events
          </h2>
          <div className="text-center text-gw-black/70">
            <p>No events currently scheduled. Check back soon!</p>
          </div>
        </div>
      </section>
    );
  }

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
              {events.map((event, index) => (
                <div key={event.eventName + index} className="w-full flex-shrink-0">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                    {/* Event image */}
                    <div className="order-2 lg:order-1">
                      <div className="aspect-w-16 aspect-h-9 bg-gray-300 rounded-lg overflow-hidden">
                        <Image 
                          src={event.imageUrl} 
                          alt={event.eventName}
                          width={800}
                          height={400}
                          className="w-full h-64 object-cover rounded-lg"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            target.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                        <div className="hidden w-full h-64 bg-gray-300 rounded-lg items-center justify-center">
                          <span className="text-gray-500">Add {event.imageUrl.split('/').pop()}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Event details */}
                    <div className="order-1 lg:order-2 space-y-4">
                      <div className="bg-gw-white p-2 inline-block rounded">
                        <span className="text-gw-green-1 font-bold text-sm">
                          {new Date(event.date).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </span>
                      </div>
                      
                      <h3 className="text-2xl font-bold text-gw-black">
                        {event.eventName}
                      </h3>
                      
                      <p className="text-gw-black/70">
                        <strong>
                          {new Date(event.date).toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })} • {event.location}
                        </strong>
                      </p>
                      
                      <p className="text-gw-black/80">
                        {event.description}
                      </p>
                      
                      <a 
                        href={event.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-block bg-gw-white border-2 border-gw-green-1 text-gw-green-1 px-6 py-2 rounded-full font-semibold hover:bg-gw-green-1 hover:text-gw-white transition-colors"
                      >
                        Learn More
                      </a>
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