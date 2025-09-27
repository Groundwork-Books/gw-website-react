import { NextResponse } from 'next/server';
import { google } from 'googleapis';

// Fallback data if sheets are unavailable
const fallbackInstagramPosts = [
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

interface InstagramPost {
  postUrl: string;
  altText: string;
  order: number;
  active: boolean;
}

export async function GET() {
  try {
    const sheets = getGoogleSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SHEETS_ID;

    if (!spreadsheetId) {
      console.warn('No Google Sheets ID provided, using fallback data');
      return NextResponse.json(fallbackInstagramPosts);
    }

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Instagram!A2:D50',
    });

    const rows = response.data.values;
    
    if (!rows || rows.length === 0) {
      console.warn('No Instagram data found in sheets, using fallback');
      return NextResponse.json(fallbackInstagramPosts);
    }

    const posts: InstagramPost[] = rows
      .map((row: string[], index: number) => ({
        postUrl: row[0] || '',
        altText: row[1] || `Instagram post ${index + 1}`,
        order: parseInt(row[2]) || index + 1,
        active: row[3]?.toUpperCase() === 'TRUE'
      }))
      .filter((post: InstagramPost) => post.postUrl && post.active)
      .sort((a: InstagramPost, b: InstagramPost) => a.order - b.order);

    return NextResponse.json(posts.length > 0 ? posts : fallbackInstagramPosts);

  } catch (error) {
    console.error('Error fetching Instagram posts from sheets:', error);
    return NextResponse.json(fallbackInstagramPosts);
  }
}