const express = require('express');
const { google } = require('googleapis');
const router = express.Router();

// Fallback data if sheets are unavailable
const fallbackEvents = [
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

function getGoogleSheetsClient() {
  const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!serviceAccountEmail || !privateKey) {
    throw new Error('Missing Google Sheets credentials');
  }

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: serviceAccountEmail,
      private_key: privateKey,
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  return google.sheets({ version: 'v4', auth });
}

// GET /api/events
router.get('/', async (req, res) => {
  try {
    const sheets = getGoogleSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SHEETS_ID;

    if (!spreadsheetId) {
      console.warn('No Google Sheets ID provided, using fallback data');
      return res.json(fallbackEvents);
    }

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Events!A2:G50',
    });

    const rows = response.data.values;
    
    if (!rows || rows.length === 0) {
      console.warn('No Events data found in sheets, using fallback');
      return res.json(fallbackEvents);
    }

    const events = rows
      .map(row => ({
        eventName: row[0] || 'Unnamed Event',
        date: row[1] || '',
        description: row[2] || '',
        imageUrl: row[3] || '/images/events/default.jpg',
        location: row[4] || 'TBD',
        link: row[5] || '#',
        active: row[6]?.toUpperCase() === 'TRUE'
      }))
      .filter(event => event.eventName && event.active);

    res.json(events.length > 0 ? events : fallbackEvents);

  } catch (error) {
    console.error('Error fetching events from sheets:', error);
    res.json(fallbackEvents);
  }
});

module.exports = router;