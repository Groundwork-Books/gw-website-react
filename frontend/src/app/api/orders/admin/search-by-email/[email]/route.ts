import { NextRequest, NextResponse } from 'next/server';
import { SquareOrder } from '../../../../../../lib/square-types';

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

// Search orders by customer email (for staff)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ email: string }> }
) {
  try {
    const { email } = await params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    
    // Search all orders and filter by customer email
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
        limit: 100 // Get more orders to filter locally
      })
    });

    const searchData = await searchResponse.json();
    
    if (searchResponse.ok) {
      // Filter orders by customer email in pickup details AND only show paid orders
      const emailOrders = (searchData.orders || []).filter((order: SquareOrder) => {
        const pickupDetails = order.fulfillments?.[0]?.pickup_details;
        const hasEmail = pickupDetails?.recipient?.email_address?.toLowerCase() === email.toLowerCase();
        const isPaid = order.tenders && order.tenders.length > 0;
        const isCompleted = order.state === 'COMPLETED' || order.state === 'CLOSED';
        
        return hasEmail && (isPaid || isCompleted);
      });

      return NextResponse.json({
        success: true,
        email: email,
        orders: emailOrders.slice(0, limit),
        total_found: emailOrders.length,
        showing_paid_only: true
      });
    } else {
      return NextResponse.json({
        error: 'Failed to search orders',
        details: searchData.errors || searchData || 'Unknown error'
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Error searching orders by email:', error);
    return NextResponse.json({ 
      error: 'Failed to search orders by email', 
      details: String(error)
    }, { status: 500 });
  }
}