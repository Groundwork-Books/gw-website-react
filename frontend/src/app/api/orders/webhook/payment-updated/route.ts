import { NextRequest, NextResponse } from 'next/server';

// WEBHOOK ENDPOINT FOR PAYMENT NOTIFICATIONS
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, data } = body;
    
    if (type === 'payment.updated') {
      const payment = data.object.payment;
      const orderId = payment.order_id;
      
      console.log(`💳 Payment updated for order ${orderId}:`, payment.status);
      
      if (payment.status === 'COMPLETED') {
        // Handle completed payment logic here if needed
        console.log(`✅ Payment completed for order ${orderId}`);
      }
    }
    
    // Always respond with 200 to acknowledge receipt
    return NextResponse.json({ received: true });
    
  } catch (error) {
    console.error('Error processing webhook:', error);
    // Still acknowledge to avoid retries
    return NextResponse.json({ received: true });
  }
}