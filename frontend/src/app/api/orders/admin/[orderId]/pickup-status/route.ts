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

type AdminStatus = 'processed' | 'ready' | 'picked_up' | 'PREPARED' | 'COMPLETED' | 'RESERVED';

function mapStatus(status: AdminStatus) {
  // Accept both admin-friendly strings and Square states
  if (status === 'processed' || status === 'RESERVED') {
    return { fulfillment: 'RESERVED', order: 'OPEN' };
  }
  if (status === 'ready' || status === 'PREPARED') {
    return { fulfillment: 'PREPARED', order: 'OPEN' };
  }
  // picked_up or COMPLETED
  return { fulfillment: 'COMPLETED', order: 'COMPLETED' };
}

export async function PUT(req: NextRequest, { params }: { params: { orderId: string } }) {
  try {
    const { orderId } = params;
    const body = await req.json();
    const status: AdminStatus = body.status;

    if (!status) {
      return NextResponse.json({ error: 'Missing status' }, { status: 400 });
    }

    // 1) Retrieve the order to get version and fulfillment uid
    const orderResponse = await fetch(`https://connect.squareup.com/v2/orders/${orderId}`, {
      method: 'GET',
      headers: getSquareHeaders(false)
    });

    const orderData = await orderResponse.json();

    if (!orderResponse.ok || !orderData.order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const order = orderData.order;
    const fulfillment = (order.fulfillments || [])[0];

    if (!fulfillment) {
      return NextResponse.json({ error: 'Order has no pickup fulfillment' }, { status: 400 });
    }

    const target = mapStatus(status);

    // 2) Update the order with new fulfillment state and (when completed) set order.state to COMPLETED
    const updateBody = {
      idempotency_key: `update_${Date.now()}_${Math.random()}`,
      order: {
        version: order.version,
        location_id: order.location_id,
        state: target.order,
        fulfillments: [
          {
            uid: fulfillment.uid,
            type: fulfillment.type,
            state: target.fulfillment
          }
        ]
      }
    };

    const updateRes = await fetch(`https://connect.squareup.com/v2/orders/${orderId}`, {
      method: 'PUT',
      headers: getSquareHeaders(),
      body: JSON.stringify(updateBody)
    });

    const updateData = await updateRes.json();

    if (!updateRes.ok) {
      console.log('❌ Failed to update order status:', updateData);
      return NextResponse.json({
        error: 'Failed to update pickup status',
        details: updateData.errors || updateData || 'Unknown error'
      }, { status: 400 });
    }

    return NextResponse.json({ success: true, order: updateData.order });
  } catch (error) {
    console.error('Error updating pickup status:', error);
    return NextResponse.json({ 
      error: 'Failed to update pickup status',
      details: String(error)
    }, { status: 500 });
  }
}
