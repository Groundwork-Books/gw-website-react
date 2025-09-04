'use client';

import { useState, useEffect } from 'react';
import { getEvents, type Event } from '@/lib/api';
import Image from 'next/image';

export default function EventsGrid() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const eventsData = await getEvents();
        // Limit to 3 events for the grid display
        setEvents(eventsData.slice(0, 3));
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

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
      <>
        <section className="py-16 bg-gw-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center text-gw-black/70">
              <p>No events currently scheduled. Check back soon!</p>
            </div>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <section className="py-16 bg-gw-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {events.map((event, index) => (
              <div key={event.eventName + index} className="text-center space-y-4">
                {/* Event image */}
                <div className="h-64 relative overflow-hidden rounded-lg">
                  <Image 
                    src={event.imageUrl} 
                    alt={event.eventName}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      target.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                  <div className="hidden h-full bg-gray-300 items-center justify-center rounded-lg absolute inset-0">
                    <span className="text-gray-600">Add {event.imageUrl.split('/').pop()}</span>
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
                    day: 'numeric'
                  })} • {event.location}
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
            ))}
          </div>
        </div>
      </section>
    </>
  );
}