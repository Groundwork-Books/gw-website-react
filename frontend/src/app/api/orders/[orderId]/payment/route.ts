import { NextRequest, NextResponse } from 'next/server';

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

// Process payment using Square Payments API
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const body = await request.json();
    const { sourceId, amount, customerInfo } = body;

    if (!sourceId) {
      return NextResponse.json({ error: 'Payment source required' }, { status: 400 });
    }

    // Process payment with direct Square Payments API
    const paymentResponse = await fetch('https://connect.squareupsandbox.com/v2/payments', {
      method: 'POST',
      headers: getSquareHeaders(),
      body: JSON.stringify({
        source_id: sourceId,
        amount_money: {
          amount: amount,
          currency: 'USD'
        },
        buyer_email_address: customerInfo?.email,
        note: `Order ${orderId} - BOPIS (Buy Online, Pickup In Store)`,
        idempotency_key: `${orderId}_${Date.now()}`,
        location_id: process.env.SQUARE_LOCATION_ID
      })
    });

    const paymentData = await paymentResponse.json();

    if (paymentResponse.ok && paymentData.payment) {
      return NextResponse.json({
        success: true,
        payment: paymentData.payment,
        paymentId: paymentData.payment.id,
        status: 'PAID',
        message: 'Payment successful! Your order is ready for pickup.'
      });
    } else {
      return NextResponse.json({
        error: 'Payment failed',
        details: paymentData.errors || paymentData || 'Unknown error'
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Error processing payment:', error);
    return NextResponse.json({
      error: 'Payment processing failed',
      details: String(error)
    }, { status: 500 });
  }
}