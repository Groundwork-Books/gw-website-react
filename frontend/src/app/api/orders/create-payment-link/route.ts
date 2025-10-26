import { NextRequest, NextResponse } from 'next/server';
import { CartItem } from '../../../../lib/square-types';

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

// Create Payment Link for checkout (preferred method)
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

    // First create the order (for tracking purposes)
    const orderResponse = await fetch('https://connect.squareup.com/v2/orders', {
      method: 'POST',
      headers: getSquareHeaders(),
      body: JSON.stringify({
        order: {
          location_id: locationId || process.env.SQUARE_LOCATION_ID,
          line_items: items.map((item: CartItem) => ({
            name: item.book.name,
            quantity: (item.quantity || 1).toString(),
            base_price_money: {
              amount: Math.round(item.book.price * 100),
              currency: 'USD'
            }
          })),
          fulfillments: [{
            type: 'PICKUP',
            state: 'PROPOSED', // Required initial state by Square API
            pickup_details: {
              recipient: {
                display_name: customerInfo.name || 'Customer',
                email_address: customerInfo.email,
                phone_number: customerInfo.phone || undefined
              },
              note: 'Your order will be ready for pickup after payment! Please bring a valid ID.',
              pickup_at: new Date().toISOString() // Available immediately
            }
          }],
          metadata: {
            source: 'website',
            customerId: customerInfo.userId || undefined
          }
        },
        idempotency_key: `order_${Date.now()}_${Math.random()}`
      })
    });

    const orderData = await orderResponse.json();
    
    if (!orderResponse.ok || !orderData.order) {
      return NextResponse.json({
        error: 'Failed to create order',
        details: orderData.errors || orderData || 'Unknown error'
      }, { status: 400 });
    }

    const orderId = orderData.order.id;

    // Now create Payment Link for this order
    const paymentLinkResponse = await fetch('https://connect.squareup.com/v2/online-checkout/payment-links', {
      method: 'POST',
      headers: getSquareHeaders(),
      body: JSON.stringify({
        idempotency_key: `payment_link_${Date.now()}_${Math.random()}`,
        order: {
          location_id: locationId || process.env.SQUARE_LOCATION_ID,
          line_items: items.map((item: CartItem) => ({
            name: item.book.name,
            quantity: (item.quantity || 1).toString(),
            base_price_money: {
              amount: Math.round(item.book.price * 100),
              currency: 'USD'
            }
          })),
          fulfillments: [{
            type: 'PICKUP',
            state: 'PROPOSED',
            pickup_details: {
              recipient: {
                display_name: customerInfo.name || 'Customer',
                email_address: customerInfo.email,
                phone_number: customerInfo.phone || undefined
              },
              note: 'Your order will be ready for pickup after payment! Please bring a valid ID.',
              pickup_at: new Date().toISOString()
            }
          }],
          metadata: {
            source: 'website',
            customerId: customerInfo.userId || undefined,
            original_order_id: orderId  // Reference to our tracking order
          }
        },
        checkout_options: {
          ask_for_shipping_address: false,
          redirect_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/order-confirmation?orderId=${orderId}`,
          accepted_payment_methods: {
            apple_pay: true,
            google_pay: true
          }
        },
        payment_note: `Bookstore Order ${orderId} - BOPIS (Buy Online, Pickup In Store)`
      })
    });

    const paymentLinkData = await paymentLinkResponse.json();
    
    if (paymentLinkResponse.ok && paymentLinkData.payment_link) {
      
      // Note: Order created as PROPOSED, will be auto-updated to PREPARED by scheduled task
      
      return NextResponse.json({
        success: true,
        order_id: orderId,
        payment_link_url: paymentLinkData.payment_link.url,
        payment_link_id: paymentLinkData.payment_link.id
      });
    } else {
      return NextResponse.json({
        error: 'Failed to create Payment Link',
        details: paymentLinkData.errors || paymentLinkData || 'Unknown error'
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Error creating Payment Link:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: String(error)
    }, { status: 500 });
  }
}