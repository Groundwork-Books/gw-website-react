import { NextRequest, NextResponse } from 'next/server';
import { SquareOrder } from '../../../../../lib/square-types';

// Helper function for Square API headers
const getSquareHeaders = (includeContentType = true) => {
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${process.env.SQUARE_ACCESS_TOKEN}`,
    'Accept': 'application/json',
    'Square-Version': '2024-12-18'
  };

  if (includeContentType) {
    headers['Content-Type'] = 'application/json';
  }

  return headers;
};

export async function GET(req: NextRequest) {
  try {
    const locationId = process.env.SQUARE_LOCATION_ID;
    const body = {
      location_ids: locationId ? [locationId] : [],
      limit: 50,
      query: {
        sort: {
          sort_field: 'CREATED_AT',
          sort_order: 'DESC'
        }
      }
    };

    const response = await fetch('https://connect.squareup.com/v2/orders/search', {
      method: 'POST',
      headers: getSquareHeaders(),
      body: JSON.stringify(body)
    });

    const searchData = await response.json();

    if (!response.ok) {
      return NextResponse.json({
        error: 'Failed to fetch recent orders',
        details: searchData.errors || searchData || 'Unknown error'
      }, { status: 400 });
    }

    // Cast the raw array and normalize nullable arrays, no `any`, no `location_id`
    const rawOrders = (searchData.orders || []) as SquareOrder[];
    const orders = rawOrders.map((order) => ({
      ...order,
      line_items: order.line_items || [],
      fulfillments: order.fulfillments || [],
    }));

    return NextResponse.json({ orders });
  } catch (error) {
    console.error('Error fetching recent orders:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch recent orders', 
      details: String(error)
    }, { status: 500 });
  }
}
