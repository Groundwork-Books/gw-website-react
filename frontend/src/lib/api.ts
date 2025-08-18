// Client-side API functions to fetch data from our Next.js API routes

export interface InstagramPost {
  postUrl: string;
  altText: string;
  order: number;
  active: boolean;
}

export interface Event {
  eventName: string;
  date: string;
  description: string;
  imageUrl: string;
  location: string;
  link: string;
  active: boolean;
}

export async function getInstagramPosts(): Promise<InstagramPost[]> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/instagram`);
    if (!response.ok) {
      throw new Error('Failed to fetch Instagram posts');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching Instagram posts:', error);
    // Return fallback data if API fails
    return [
      {
        postUrl: 'https://www.instagram.com/p/C3CYLGrLK8F/',
        altText: 'Groundwork Books community post',
        order: 1,
        active: true
      },
      {
        postUrl: 'https://www.instagram.com/p/DKaqRZjS--b/',
        altText: 'Recent book arrivals and displays',
        order: 2,
        active: true
      },
      {
        postUrl: 'https://www.instagram.com/p/DIIVR-ERxFf/',
        altText: 'Community gathering and events',
        order: 3,
        active: true
      },
      {
        postUrl: 'https://www.instagram.com/p/DGOZRmAShAR/',
        altText: 'Book selection and recommendations',
        order: 4,
        active: true
      },
      {
        postUrl: 'https://www.instagram.com/p/DGHx5T-OJe6/?img_index=1',
        altText: 'Store interior and atmosphere',
        order: 5,
        active: true
      },
      {
        postUrl: 'https://www.instagram.com/p/DF_ggzDS0w0/',
        altText: 'Local authors and book highlights',
        order: 6,
        active: true
      },
      {
        postUrl: 'https://www.instagram.com/p/DF_CfnmSMWk/?img_index=1',
        altText: 'Community organizing and activism',
        order: 7,
        active: true
      },
      {
        postUrl: 'https://www.instagram.com/p/DF6ewBOPtxP/',
        altText: 'Book club and discussion events',
        order: 8,
        active: true
      }
    ];
  }
}

export async function getEvents(): Promise<Event[]> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/events`);
    if (!response.ok) {
      throw new Error('Failed to fetch events');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching events:', error);
    // Return fallback data if API fails
    return [
      {
        eventName: 'Bonfire & Books',
        date: '2025-02-15',
        description: 'Join us for an evening of reading and discussion around the campfire',
        imageUrl: '/images/events/bonfire-books.jpg',
        location: 'Outdoor Patio',
        link: 'https://eventbrite.com/bonfire-books',
        active: true
      },
      {
        eventName: 'Dollar Launch Club',
        date: '2025-02-20',
        description: 'Coffee, community, and conversations about local organizing',
        imageUrl: '/images/events/coffee-meeting.jpg',
        location: 'Main Reading Room',
        link: 'https://eventbrite.com/dollar-launch',
        active: true
      },
      {
        eventName: 'Book Discussion Circle',
        date: '2025-02-25',
        description: 'Weekly book club featuring radical literature and community voices',
        imageUrl: '/images/events/book-discussion.jpg',
        location: 'Community Space',
        link: 'https://eventbrite.com/book-discussion',
        active: true
      }
    ];
  }
}