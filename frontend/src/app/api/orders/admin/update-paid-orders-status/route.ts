import { NextResponse } from 'next/server';
import { SquareOrder } from '../../../../../lib/square-types';

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

// Manual endpoint to update paid orders to PREPARED status
export async function POST() {
  try {
    // Helper function to update order to ready for pickup
    async function updateOrderToReadyForPickup(orderId: string) {
      try {
        // Get current order
        const orderResponse = await fetch(`https://connect.squareup.com/v2/orders/${orderId}`, {
          method: 'GET',
          headers: getSquareHeaders(false)
        });

        const orderData = await orderResponse.json();
        if (!orderResponse.ok || !orderData.order) {
          throw new Error('Order not found');
        }

        const currentOrder = orderData.order;
        const currentFulfillment = currentOrder.fulfillments[0];
        
        // Update to PREPARED
        const updateResponse = await fetch(`https://connect.squareup.com/v2/orders/${orderId}`, {
          method: 'PUT',
          headers: getSquareHeaders(),
          body: JSON.stringify({
            order: {
              version: currentOrder.version,
              fulfillments: [{
                uid: currentFulfillment.uid,
                type: currentFulfillment.type,
                state: 'PREPARED',
                pickup_details: currentFulfillment.pickup_details
              }]
            }
          })
        });

        return updateResponse.ok;
      } catch (error) {
        console.error(`Failed to update order ${orderId}:`, error);
        return false;
      }
    }
    
    // Get recent paid orders
    const searchResponse = await fetch('https://connect.squareup.com/v2/orders/search', {
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
        limit: 50
      })
    });

    const searchData = await searchResponse.json();
    
    if (searchResponse.ok) {
      // Find paid orders with PROPOSED status (legacy orders that need updating)
      const paidProposedOrders = (searchData.orders || []).filter((order: SquareOrder) => {
        const isPaid = order.tenders && order.tenders.length > 0;
        const isProposed = order.fulfillments?.[0]?.state === 'PROPOSED';
        return isPaid && isProposed;
      });

      const updatePromises = paidProposedOrders.map((order: SquareOrder) => 
        updateOrderToReadyForPickup(order.id)
      );

      const results = await Promise.all(updatePromises);
      const successCount = results.filter(result => result !== false).length;

      return NextResponse.json({
        success: true,
        message: `Updated ${successCount} out of ${paidProposedOrders.length} paid orders to PREPARED status`,
        updated_count: successCount,
        total_found: paidProposedOrders.length
      });
    } else {
      return NextResponse.json({
        error: 'Failed to search orders',
        details: searchData.errors || searchData || 'Unknown error'
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Error updating paid orders status:', error);
    return NextResponse.json({ 
      error: 'Failed to update paid orders status', 
      details: String(error)
    }, { status: 500 });
  }
}