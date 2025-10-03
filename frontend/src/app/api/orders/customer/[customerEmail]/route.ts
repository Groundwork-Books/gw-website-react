import { NextRequest, NextResponse } from 'next/server';
import { SquareOrder } from '@/lib/square-types';

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

// Get orders for a customer using direct Square API
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ customerEmail: string }> }
) {
  try {
    const { customerEmail } = await params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    
    // Search orders using direct Square Orders API
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
      const customerOrders = (searchData.orders || []).filter((order: SquareOrder) => {
        const pickupDetails = order.fulfillments?.[0]?.pickup_details;
        const orderEmail = pickupDetails?.recipient?.email_address?.toLowerCase();
        const searchEmail = decodeURIComponent(customerEmail).toLowerCase();
        const hasCustomerEmail = orderEmail === searchEmail;
        const isPaid = !!(order.tenders && order.tenders.length > 0); // Has payment tenders
        
        // Show all paid orders regardless of fulfillment status
        // This includes orders that are processing, ready for pickup, or completed
        return hasCustomerEmail && isPaid;
      });

      return NextResponse.json({
        success: true,
        orders: customerOrders.slice(0, limit), // Apply limit after filtering
        cursor: searchData.cursor
      });
    } else {
      return NextResponse.json({
        error: 'Failed to retrieve customer orders',
        details: searchData.errors || searchData || 'Unknown error'
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Error retrieving customer orders:', error);
    return NextResponse.json({ 
      error: 'Failed to retrieve customer orders', 
      details: String(error)
    }, { status: 500 });
  }
}