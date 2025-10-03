import { NextRequest, NextResponse } from 'next/server';
import { SquareOrder, SquareOrdersSearchResponse } from '../../../../../lib/square-types';

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

// Get all recent orders for staff overview
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const status = searchParams.get('status'); // status: 'PREPARED', 'COMPLETED', etc.
    const showUnpaid = searchParams.get('show_unpaid') === 'true';
    
    const searchResponse = await fetch('https://connect.squareupsandbox.com/v2/orders/search', {
      method: 'POST',
      headers: getSquareHeaders(),
      body: JSON.stringify({
        location_ids: [process.env.SQUARE_LOCATION_ID],
        query: {
          sort: {
            sort_field: 'CREATED_AT',
            sort_order: 'DESC'
          }
        },
        limit: limit
      })
    });

    const searchData = await searchResponse.json();
    
    if (searchResponse.ok) {
      let orders = searchData.orders || [];
      
      // Filter to paid orders only (unless explicitly requested to show unpaid)
      if (!showUnpaid) {
        orders = orders.filter((order: SquareOrder) => {
          const isPaid = order.tenders && order.tenders.length > 0;
          const isCompleted = order.state === 'COMPLETED' || order.state === 'CLOSED';
          return isPaid || isCompleted;
        });
      }
      
      // Filter by fulfillment status if specified
      if (status) {
        orders = orders.filter((order: SquareOrder) => {
          const fulfillmentState = order.fulfillments?.[0]?.state;
          return fulfillmentState === status;
        });
      }

      return NextResponse.json({
        success: true,
        orders: orders,
        total_found: orders.length,
        filtered_by_status: status || null,
        showing_paid_only: !showUnpaid
      });
    } else {
      return NextResponse.json({
        error: 'Failed to fetch recent orders',
        details: searchData.errors || searchData || 'Unknown error'
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Error fetching recent orders:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch recent orders', 
      details: String(error)
    }, { status: 500 });
  }
}