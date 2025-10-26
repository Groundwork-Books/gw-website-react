import { NextRequest, NextResponse } from 'next/server';
import { SquareFulfillment } from '@/lib/square-types';

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

// Get order details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    
    // Retrieve order using direct Square Orders API
    const orderResponse = await fetch(`https://connect.squareup.com/v2/orders/${orderId}`, {
      method: 'GET',
      headers: getSquareHeaders(false)
    });

    const orderData = await orderResponse.json();

    if (orderResponse.ok && orderData.order) {
      return NextResponse.json({
        success: true,
        order: orderData.order
      });
    } else {
      return NextResponse.json({ 
        error: 'Order not found',
        details: orderData.errors || orderData || 'Unknown error'
      }, { status: 404 });
    }
    
  } catch (error) {
    console.error('Error retrieving order:', error);
    return NextResponse.json({ 
      error: 'Failed to retrieve order', 
      details: String(error)
    }, { status: 500 });
  }
}

// Update order fulfillment status (legacy endpoint - keeping for compatibility)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const body = await request.json();
    const { fulfillmentId, state } = body; // state: 'PREPARED' or 'COMPLETED'
    
    // First get the current order to get the version
    const orderResponse = await fetch(`https://connect.squareup.com/v2/orders/${orderId}`, {
      method: 'GET',
      headers: getSquareHeaders(false)
    });

    const orderData = await orderResponse.json();
    
    if (!orderResponse.ok || !orderData.order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const currentOrder = orderData.order;
    
    // Update the fulfillment state
    const updatedFulfillments = currentOrder.fulfillments.map((fulfillment: SquareFulfillment) => {
      if (fulfillment.uid === fulfillmentId) {
        return {
          ...fulfillment,
          state: state
        };
      }
      return fulfillment;
    });

    const updateResponse = await fetch(`https://connect.squareup.com/v2/orders/${orderId}`, {
      method: 'PUT',
      headers: getSquareHeaders(),
      body: JSON.stringify({
        order: {
          version: currentOrder.version,
          fulfillments: updatedFulfillments
        }
      })
    });

    const updateData = await updateResponse.json();
    
    if (updateResponse.ok && updateData.order) {
      return NextResponse.json({
        success: true,
        order: updateData.order
      });
    } else {
      return NextResponse.json({ 
        error: 'Failed to update order',
        details: updateData.errors || 'Unknown error'
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Error updating order fulfillment:', error);
    return NextResponse.json({ 
      error: 'Failed to update order fulfillment',
      details: String(error)
    }, { status: 500 });
  }
}