import { NextResponse } from 'next/server';
import { getBooks } from '@/lib/square';

export async function GET() {
  try {
    // Debug environment variables
    console.log('SQUARE_ACCESS_TOKEN:', process.env.SQUARE_ACCESS_TOKEN ? 'SET' : 'NOT SET');
    console.log('SQUARE_ENVIRONMENT:', process.env.SQUARE_ENVIRONMENT);
    
    const books = await getBooks();
    return NextResponse.json(books);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch books' },
      { status: 500 }
    );
  }
}