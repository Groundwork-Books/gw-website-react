import { NextRequest, NextResponse } from 'next/server';
import { CartItem, CustomerInfo } from '../../../../lib/square-types';

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

// Create order with Square Orders API (legacy method - keeping for compatibility)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items, customerInfo, locationId } = body;
    
    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'No items in cart' }, { status: 400 });
    }

    if (!customerInfo || !customerInfo.email) {
      return NextResponse.json({ error: 'Customer information required' }, { status: 400 });
    }

    // Use direct fetch API since SDK has auth issues
    const response = await fetch('https://connect.squareupsandbox.com/v2/orders', {
      method: 'POST',
      headers: getSquareHeaders(),
      body: JSON.stringify({
        order: {
          location_id: locationId || process.env.SQUARE_LOCATION_ID,
          line_items: items.map((item: CartItem) => ({
            name: item.book.name,
            quantity: item.quantity.toString(),
            base_price_money: {
              amount: Math.round(item.book.price * 100),
              currency: 'USD'
            }
          })),
          fulfillments: [{
            type: 'PICKUP',
            state: 'PREPARED', // Immediately ready for pickup
            pickup_details: {
              recipient: {
                display_name: customerInfo.name || 'Customer',
                email_address: customerInfo.email,
                phone_number: customerInfo.phone || undefined
              },
              note: 'Please bring a valid ID for pickup verification.'
              // Removed pickup_at - order is immediately ready
            }
          }],
          metadata: {
            source: 'website',
            customerId: customerInfo.userId || undefined
          }
        },
        idempotency_key: `${Date.now()}-${Math.random()}`
      })
    });

    const responseData = await response.json();

    if (response.ok && responseData.order) {
      return NextResponse.json({
        success: true,
        order: responseData.order,
        orderId: responseData.order.id
      });
    } else {
      return NextResponse.json({
        error: 'Failed to create order',
        details: responseData.errors || responseData || 'Unknown error'
      }, { status: 400 });
    }
    
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: String(error)
    }, { status: 500 });
  }
}