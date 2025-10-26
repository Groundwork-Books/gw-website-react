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

// Update order pickup status (mark as picked up)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const body = await request.json();
    const { status, notes } = body; // status: 'COMPLETED' (picked up) or 'PREPARED' (ready)
    
    // First get the current order
    const orderResponse = await fetch(`https://connect.squareup.com/v2/orders/${orderId}`, {
      method: 'GET',
      headers: getSquareHeaders(false)
    });

    const orderData = await orderResponse.json();
    
    if (!orderResponse.ok || !orderData.order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const currentOrder = orderData.order;
    const currentFulfillment = currentOrder.fulfillments[0];
    
    // Update the fulfillment status
    const updateResponse = await fetch(`https://connect.squareup.com/v2/orders/${orderId}`, {
      method: 'PUT',
      headers: getSquareHeaders(),
      body: JSON.stringify({
        order: {
          version: currentOrder.version,
          fulfillments: [{
            uid: currentFulfillment.uid,
            type: currentFulfillment.type,
            state: status, // 'COMPLETED' or 'PREPARED'
            pickup_details: {
              ...currentFulfillment.pickup_details,
              note: notes ? `${currentFulfillment.pickup_details.note} | Staff note: ${notes}` : currentFulfillment.pickup_details.note
            }
          }]
        }
      })
    });

    const updateData = await updateResponse.json();
    
    if (updateResponse.ok && updateData.order) {
      return NextResponse.json({
        success: true,
        order: updateData.order,
        message: status === 'COMPLETED' ? 'Order marked as picked up' : 'Order marked as ready for pickup',
        updated_status: status
      });
    } else {
      console.log('❌ Failed to update order status:', updateData);
      return NextResponse.json({
        error: 'Failed to update pickup status',
        details: updateData.errors || updateData || 'Unknown error'
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Error updating pickup status:', error);
    return NextResponse.json({ 
      error: 'Failed to update pickup status',
      details: String(error)
    }, { status: 500 });
  }
}