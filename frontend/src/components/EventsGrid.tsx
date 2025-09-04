'use client';

import { useState, useEffect } from 'react';
import { getEvents, type Event } from '@/lib/api';
import Image from 'next/image';

export default function EventsGridCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  const itemsPerPage = 3; // show 3 events at a time
  const maxEvents = 20;   // cap at 20

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const eventsData = await getEvents();
        setEvents(eventsData.slice(0, maxEvents)); // cap to 20
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const totalPages = Math.ceil(events.length / itemsPerPage);

  const nextSlide = () => {
    if (events.length === 0) return;
    setCurrentIndex((prevIndex) =>
      (prevIndex + itemsPerPage) % events.length
    );
  };

  const prevSlide = () => {
    if (events.length === 0) return;
    setCurrentIndex((prevIndex) =>
      (prevIndex - itemsPerPage + events.length) % events.length
    );
  };

  const goToSlide = (pageIndex: number) => {
    if (events.length === 0) return;
    setCurrentIndex((pageIndex * itemsPerPage) % events.length);
  };

  if (loading) {
    return (
      <section className="py-16 bg-gw-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gw-green-1"></div>
          </div>
        </div>
      </section>
    );
  }

  if (events.length === 0) {
    return (
      <section className="py-16 bg-gw-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-gw-black/70">
            <p>No events currently scheduled. Check back soon!</p>
          </div>
        </div>
      </section>
    );
  }

  // Handle looping slice
  const visibleEvents =
    currentIndex + itemsPerPage <= events.length
      ? events.slice(currentIndex, currentIndex + itemsPerPage)
      : [
          ...events.slice(currentIndex),
          ...events.slice(0, (currentIndex + itemsPerPage) % events.length),
        ];

  const currentPage = totalPages
    ? (Math.floor(currentIndex / itemsPerPage)) % totalPages
    : 0;

  return (
    <section className="py-16 bg-gw-white relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {visibleEvents.map((event, index) => {
            const fileName = event.imageUrl
              ? event.imageUrl.split('/').pop()
              : 'image';

            return (
              <div key={event.eventName + index} className="text-center space-y-4">
                {/* Event image */}
                <div className="h-64 relative overflow-hidden rounded-lg">
                  {event.imageUrl ? (
                    <Image
                      src={event.imageUrl}
                      alt={event.eventName}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw,
                             (max-width: 1200px) 50vw,
                             33vw"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  ) : null}
                  <div className="hidden absolute inset-0 bg-gray-300 items-center justify-center rounded-lg">
                    <span className="text-gray-600">Add {fileName}</span>
                  </div>
                </div>

                {/* Event title */}
                <h3 className="text-2xl font-calluna font-bold text-gw-green-1">
                  {event.eventName}
                </h3>

                {/* Event date and location */}
                <h4 className="font-helvetica text-gw-green-1 font-bold">
                  {new Date(event.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}{' '}
                  • {event.location}
                </h4>

                {/* Event description */}
                <p className="font-helvetica text-gw-black/80 leading-relaxed">
                  {event.description}
                </p>

                {/* Learn more button */}
                <button
                  onClick={() => window.open(event.link, '_blank')}
                  className="bg-gw-white border-2 border-gw-green-1 text-gw-green-1 px-6 py-2 rounded-full font-semibold hover:bg-gw-green-1 hover:text-gw-white transition-colors"
                >
                  Learn More
                </button>
              </div>
            );
          })}
        </div>

        {/* Navigation buttons */}
        <button
          onClick={prevSlide}
          aria-label="Previous events"
          className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-gw-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-2 shadow-lg transition-all"
        >
          <svg
            className="w-6 h-6 text-gw-green-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        <button
          onClick={nextSlide}
          aria-label="Next events"
          className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-gw-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-2 shadow-lg transition-all"
        >
          <svg
            className="w-6 h-6 text-gw-green-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>

        {/* Dots indicator */}
        <div className="flex justify-center mt-8 space-x-2">
          {Array.from({ length: totalPages }).map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              aria-label={`Go to page ${index + 1}`}
              className={`w-3 h-3 rounded-full transition-colors ${
                index === currentPage ? 'bg-gw-green-1' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
