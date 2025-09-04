const express = require('express');
const { SquareClient, SquareEnvironment } = require('square');
const router = express.Router();


// Initialize Square client
const client = new SquareClient({
  accessToken: process.env.SQUARE_ACCESS_TOKEN,
  environment: process.env.SQUARE_ENVIRONMENT === 'production' 
    ? SquareEnvironment.Production 
    : SquareEnvironment.Sandbox,
  squareVersion: '2024-12-18'
});


// Initialize Square APIs
const ordersApi = client.orders;
const paymentsApi = client.payments;

// Helper function for Square API headers
const getSquareHeaders = (includeContentType = true) => {
  const headers = {
    'Authorization': `Bearer ${process.env.SQUARE_ACCESS_TOKEN}`,
    'Accept': 'application/json',
    'Square-Version': '2024-12-18'
  };
  
  if (includeContentType) {
    headers['Content-Type'] = 'application/json';
  }
  
  return headers;
};


// Create Payment Link for checkout (new preferred method)
router.post('/create-payment-link', async (req, res) => {
  try {
    const { items, customerInfo, locationId } = req.body;
    
    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'No items in cart' });
    }

    if (!customerInfo || !customerInfo.email) {
      return res.status(400).json({ error: 'Customer information required' });
    }

    // First create the order (for tracking purposes)
    const orderResponse = await fetch('https://connect.squareupsandbox.com/v2/orders', {
      method: 'POST',
      headers: getSquareHeaders(),
      body: JSON.stringify({
        order: {
          location_id: locationId || process.env.SQUARE_LOCATION_ID,
          line_items: items.map(item => ({
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
      return res.status(400).json({
        error: 'Failed to create order',
        details: orderData.errors || orderData || 'Unknown error'
      });
    }

    const orderId = orderData.order.id;

    // Now create Payment Link for this order
    const paymentLinkResponse = await fetch('https://connect.squareupsandbox.com/v2/online-checkout/payment-links', {
      method: 'POST',
      headers: getSquareHeaders(),
      body: JSON.stringify({
        idempotency_key: `payment_link_${Date.now()}_${Math.random()}`,
        order: {
          location_id: locationId || process.env.SQUARE_LOCATION_ID,
          line_items: items.map(item => ({
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
          redirect_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/order-confirmation?orderId=${orderId}`,
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
      
      res.json({
        success: true,
        order_id: orderId,
        payment_link_url: paymentLinkData.payment_link.url,
        payment_link_id: paymentLinkData.payment_link.id
      });
    } else {
      res.status(400).json({
        error: 'Failed to create Payment Link',
        details: paymentLinkData.errors || paymentLinkData || 'Unknown error'
      });
    }

  } catch (error) {
    console.error('Error creating Payment Link:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message 
    });
  }
});

// Create order with Square Orders API (legacy method - keeping for compatibility)
router.post('/create', async (req, res) => {
  try {
    const { items, customerInfo, locationId } = req.body;
    
    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'No items in cart' });
    }

    if (!customerInfo || !customerInfo.email) {
      return res.status(400).json({ error: 'Customer information required' });
    }

    // Convert cart items to Square line items
    const lineItems = items.map(item => ({
      name: item.book.name,
      quantity: item.quantity.toString(),
      basePriceMoney: {
        amount: BigInt(Math.round(item.book.price * 100)), // Convert to cents and use BigInt
        currency: 'USD'
      }
    }));

    // Create order with Square Orders API (correct format)
    const orderRequest = {
      order: {
        locationId: locationId || process.env.SQUARE_LOCATION_ID,
        lineItems: lineItems,
        fulfillments: [
          {
            type: 'PICKUP',
            pickupDetails: {
              recipient: {
                displayName: customerInfo.name || 'Customer',
                emailAddress: customerInfo.email,
                phoneNumber: customerInfo.phone || undefined
              },
              note: 'Please bring a valid ID for pickup verification.'
            }
          }
        ],
        metadata: {
          source: 'website',
          customerId: customerInfo.userId || undefined
        }
      },
      idempotencyKey: `${Date.now()}-${Math.random()}`
    };


    // Use direct fetch API since SDK has auth issues
    const response = await fetch('https://connect.squareupsandbox.com/v2/orders', {
      method: 'POST',
      headers: getSquareHeaders(),
      body: JSON.stringify({
        order: {
          location_id: orderRequest.order.locationId,
          line_items: orderRequest.order.lineItems.map(item => ({
            name: item.name,
            quantity: item.quantity,
            base_price_money: {
              amount: Number(item.basePriceMoney.amount),
              currency: item.basePriceMoney.currency
            }
          })),
          fulfillments: orderRequest.order.fulfillments.map(fulfillment => ({
            type: fulfillment.type,
            state: 'PREPARED', // Immediately ready for pickup
            pickup_details: {
              recipient: {
                display_name: fulfillment.pickupDetails.recipient.displayName,
                email_address: fulfillment.pickupDetails.recipient.emailAddress,
                phone_number: fulfillment.pickupDetails.recipient.phoneNumber
              },
              note: fulfillment.pickupDetails.note
              // Removed pickup_at - order is immediately ready
            }
          })),
          metadata: orderRequest.order.metadata
        },
        idempotency_key: orderRequest.idempotencyKey
      })
    });

    const responseData = await response.json();

    if (response.ok && responseData.order) {
      res.json({
        success: true,
        order: responseData.order,
        orderId: responseData.order.id
      });
    } else {
      res.status(400).json({
        error: 'Failed to create order',
        details: responseData.errors || responseData || 'Unknown error'
      });
    }
    
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message 
    });
  }
});

// Process payment using Square Payments API
router.post('/:orderId/payment', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { sourceId, amount, customerInfo } = req.body;

    if (!sourceId) {
      return res.status(400).json({ error: 'Payment source required' });
    }

    // Create payment request using Square Payments API
    const paymentRequest = {
      sourceId: sourceId,
      amountMoney: {
        amount: BigInt(amount), // Amount in cents as BigInt
        currency: 'USD'
      },
      buyerEmailAddress: customerInfo?.email,
      note: `Order ${orderId} - BOPIS (Buy Online, Pickup In Store)`,
      idempotencyKey: `${orderId}_${Date.now()}`,
      locationId: process.env.SQUARE_LOCATION_ID
    };


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

      // After successful payment, update order status to PREPARED (ready for pickup)
      try {
        await updateOrderToReadyForPickup(orderId);
      } catch (updateError) {
        // Order update failed, but payment succeeded - this is okay
        console.error('Failed to update order status after payment:', updateError);
      }

      res.json({
        success: true,
        payment: paymentData.payment,
        paymentId: paymentData.payment.id,
        status: 'PAID',
        message: 'Payment successful! Your order is ready for pickup.'
      });
    } else {
      res.status(400).json({
        error: 'Payment failed',
        details: paymentData.errors || paymentData || 'Unknown error'
      });
    }

  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).json({
      error: 'Payment processing failed',
      details: error.message
    });
  }
});

// Get order details
router.get('/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    
    // Retrieve order using direct Square Orders API
    const orderResponse = await fetch(`https://connect.squareupsandbox.com/v2/orders/${orderId}`, {
      method: 'GET',
      headers: getSquareHeaders(false)
    });

    const orderData = await orderResponse.json();

    if (orderResponse.ok && orderData.order) {
      res.json({
        success: true,
        order: orderData.order
      });
    } else {
      res.status(404).json({ 
        error: 'Order not found',
        details: orderData.errors || orderData || 'Unknown error'
      });
    }
    
  } catch (error) {
    console.error('Error retrieving order:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve order', 
      details: error.message 
    });
  }
});

// Get orders for a customer using direct Square API
router.get('/customer/:customerEmail', async (req, res) => {
  try {
    const { customerEmail } = req.params;
    const { limit = 50, cursor } = req.query;
    
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
      const customerOrders = (searchData.orders || []).filter(order => {
        const pickupDetails = order.fulfillments?.[0]?.pickup_details;
        const orderEmail = pickupDetails?.recipient?.email_address?.toLowerCase();
        const searchEmail = decodeURIComponent(customerEmail).toLowerCase();
        const hasCustomerEmail = orderEmail === searchEmail;
        const isPaid = !!(order.tenders && order.tenders.length > 0); // Has payment tenders
        
        // Show all paid orders regardless of fulfillment status
        // This includes orders that are processing, ready for pickup, or completed
        return hasCustomerEmail && isPaid;
      });


      res.json({
        success: true,
        orders: customerOrders.slice(0, parseInt(limit)), // Apply limit after filtering
        cursor: searchData.cursor
      });
    } else {
      res.status(400).json({
        error: 'Failed to retrieve customer orders',
        details: searchData.errors || searchData || 'Unknown error'
      });
    }

  } catch (error) {
    console.error('Error retrieving customer orders:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve customer orders', 
      details: error.message 
    });
  }
});

// WEBHOOK ENDPOINT FOR PAYMENT NOTIFICATIONS
router.post('/webhook/payment-updated', async (req, res) => {
  try {
    const { type, data } = req.body;
    
    
    if (type === 'payment.updated') {
      const payment = data.object.payment;
      const orderId = payment.order_id;
      
      console.log(`💳 Payment updated for order ${orderId}:`, payment.status);
      
      if (payment.status === 'COMPLETED') {
        
        // Update order fulfillment status to PREPARED (ready for pickup)
        try {
          await updateOrderToReadyForPickup(orderId);
        } catch (updateError) {
          console.error('Failed to update order status:', updateError);
        }
      }
    }
    
    // Always respond with 200 to acknowledge receipt
    res.status(200).json({ received: true });
    
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(200).json({ received: true }); // Still acknowledge to avoid retries
  }
});

// Helper function to update order status to PREPARED after payment
async function updateOrderToReadyForPickup(orderId) {
  try {
    // First get the current order
    const orderResponse = await fetch(`https://connect.squareupsandbox.com/v2/orders/${orderId}`, {
      method: 'GET',
      headers: getSquareHeaders(false)
    });

    const orderData = await orderResponse.json();
    
    if (!orderResponse.ok || !orderData.order) {
      throw new Error('Order not found');
    }

    const currentOrder = orderData.order;
    const currentFulfillment = currentOrder.fulfillments[0];
    
    // Update the fulfillment status to PREPARED (ready for pickup)
    const updateResponse = await fetch(`https://connect.squareupsandbox.com/v2/orders/${orderId}`, {
      method: 'PUT',
      headers: getSquareHeaders(),
      body: JSON.stringify({
        order: {
          version: currentOrder.version,
          fulfillments: [{
            uid: currentFulfillment.uid,
            type: currentFulfillment.type,
            state: 'PREPARED', // Ready for pickup
            pickup_details: {
              ...currentFulfillment.pickup_details,
              note: 'Your order is ready for pickup! Please bring a valid ID.'
            }
          }]
        }
      })
    });

    const updateData = await updateResponse.json();
    
    if (updateResponse.ok && updateData.order) {
      console.log(`✅ Order ${orderId} status updated to PREPARED (ready for pickup)`);
      return updateData.order;
    } else {
      console.log('❌ Failed to update order status:', updateData);
      throw new Error('Failed to update order status');
    }

  } catch (error) {
    console.error('Error updating order to ready for pickup:', error);
    throw error;
  }
}

// Auto-update endpoint to immediately set PROPOSED orders to PREPARED (since we only sell in-stock items)
router.post('/auto-prepare-orders', async (req, res) => {
  try {
    // Search for PROPOSED orders (should be very recent)
    const searchResponse = await fetch('https://connect.squareupsandbox.com/v2/orders/search', {
      method: 'POST',
      headers: getSquareHeaders(),
      body: JSON.stringify({
        location_ids: [process.env.SQUARE_LOCATION_ID],
        query: {
          filter: {
            date_time_filter: {
              created_at: {
                start_at: new Date(Date.now() - 5 * 60 * 1000).toISOString() // Last 5 minutes
              }
            }
          },
          sort: {
            sort_field: 'CREATED_AT',
            sort_order: 'DESC'
          }
        },
        limit: 20
      })
    });

    const searchData = await searchResponse.json();
    
    if (searchResponse.ok) {
      // Find PROPOSED orders (should be ready immediately since we only sell in-stock items)
      const proposedOrders = (searchData.orders || []).filter(order => {
        const isProposed = order.fulfillments?.[0]?.state === 'PROPOSED';
        return isProposed;
      });

      const updatePromises = proposedOrders.map(order => 
        updateOrderToReadyForPickup(order.id).catch(() => null)
      );
      
      const results = await Promise.all(updatePromises);
      const successCount = results.filter(result => result !== null).length;

      res.json({
        success: true,
        message: `Auto-updated ${successCount} out of ${proposedOrders.length} orders to PREPARED status`,
        updated_count: successCount,
        total_found: proposedOrders.length
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Failed to search for orders',
        details: searchData.errors || searchData
      });
    }
  } catch (error) {
    console.error('Error auto-updating orders:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to auto-update orders', 
      details: error.message 
    });
  }
});

// Manual endpoint to update paid orders to PREPARED status
router.post('/admin/update-paid-orders-status', async (req, res) => {
  try {
    
    // Get recent paid orders
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
        limit: 50
      })
    });

    const searchData = await searchResponse.json();
    
    if (searchResponse.ok) {
      // Find paid orders with PROPOSED status (legacy orders that need updating)
      const paidProposedOrders = (searchData.orders || []).filter(order => {
        const isPaid = order.tenders && order.tenders.length > 0;
        const isProposed = order.fulfillments?.[0]?.state === 'PROPOSED';
        return isPaid && isProposed;
      });


      const updatePromises = paidProposedOrders.map(order => 
        updateOrderToReadyForPickup(order.id).catch(() => null)
      );

      const results = await Promise.all(updatePromises);
      const successCount = results.filter(result => result !== null).length;

      res.json({
        success: true,
        message: `Updated ${successCount} out of ${paidProposedOrders.length} paid orders to PREPARED status`,
        updated_count: successCount,
        total_found: paidProposedOrders.length
      });
    } else {
      res.status(400).json({
        error: 'Failed to search orders',
        details: searchData.errors || searchData || 'Unknown error'
      });
    }

  } catch (error) {
    console.error('Error updating paid orders status:', error);
    res.status(500).json({ 
      error: 'Failed to update paid orders status', 
      details: error.message 
    });
  }
});

// ADMIN ENDPOINTS FOR STAFF MANAGEMENT

// Search orders by customer email (for staff)
router.get('/admin/search-by-email/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const { limit = 20 } = req.query;
    
    
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
      const emailOrders = (searchData.orders || []).filter(order => {
        const pickupDetails = order.fulfillments?.[0]?.pickup_details;
        const hasEmail = pickupDetails?.recipient?.email_address?.toLowerCase() === email.toLowerCase();
        const isPaid = order.tenders && order.tenders.length > 0;
        const isCompleted = order.state === 'COMPLETED' || order.state === 'CLOSED';
        
        return hasEmail && (isPaid || isCompleted);
      });


      res.json({
        success: true,
        email: email,
        orders: emailOrders.slice(0, parseInt(limit)),
        total_found: emailOrders.length,
        showing_paid_only: true
      });
    } else {
      res.status(400).json({
        error: 'Failed to search orders',
        details: searchData.errors || searchData || 'Unknown error'
      });
    }

  } catch (error) {
    console.error('Error searching orders by email:', error);
    res.status(500).json({ 
      error: 'Failed to search orders by email', 
      details: error.message 
    });
  }
});

// Get all recent orders for staff overview
router.get('/admin/recent-orders', async (req, res) => {
  try {
    const { limit = 50, status, show_unpaid = 'false' } = req.query; // status: 'PREPARED', 'COMPLETED', etc.
    
    
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
        limit: parseInt(limit)
      })
    });

    const searchData = await searchResponse.json();
    
    if (searchResponse.ok) {
      let orders = searchData.orders || [];
      
      // Filter to paid orders only (unless explicitly requested to show unpaid)
      if (show_unpaid !== 'true') {
        orders = orders.filter(order => {
          const isPaid = order.tenders && order.tenders.length > 0;
          const isCompleted = order.state === 'COMPLETED' || order.state === 'CLOSED';
          return isPaid || isCompleted;
        });
      }
      
      // Filter by fulfillment status if specified
      if (status) {
        orders = orders.filter(order => {
          const fulfillmentState = order.fulfillments?.[0]?.state;
          return fulfillmentState === status;
        });
      }


      res.json({
        success: true,
        orders: orders,
        total_found: orders.length,
        filtered_by_status: status || null,
        showing_paid_only: show_unpaid !== 'true'
      });
    } else {
      res.status(400).json({
        error: 'Failed to fetch recent orders',
        details: searchData.errors || searchData || 'Unknown error'
      });
    }

  } catch (error) {
    console.error('Error fetching recent orders:', error);
    res.status(500).json({ 
      error: 'Failed to fetch recent orders', 
      details: error.message 
    });
  }
});

// Update order pickup status (mark as picked up)
router.put('/admin/:orderId/pickup-status', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, notes } = req.body; // status: 'COMPLETED' (picked up) or 'PREPARED' (ready)
    
    
    // First get the current order
    const orderResponse = await fetch(`https://connect.squareupsandbox.com/v2/orders/${orderId}`, {
      method: 'GET',
      headers: getSquareHeaders(false)
    });

    const orderData = await orderResponse.json();
    
    if (!orderResponse.ok || !orderData.order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const currentOrder = orderData.order;
    const currentFulfillment = currentOrder.fulfillments[0];
    
    // Update the fulfillment status
    const updateResponse = await fetch(`https://connect.squareupsandbox.com/v2/orders/${orderId}`, {
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
      
      res.json({
        success: true,
        order: updateData.order,
        message: status === 'COMPLETED' ? 'Order marked as picked up' : 'Order marked as ready for pickup',
        updated_status: status
      });
    } else {
      console.log('❌ Failed to update order status:', updateData);
      res.status(400).json({
        error: 'Failed to update pickup status',
        details: updateData.errors || updateData || 'Unknown error'
      });
    }

  } catch (error) {
    console.error('Error updating pickup status:', error);
    res.status(500).json({ 
      error: 'Failed to update pickup status',
      details: error.message 
    });
  }
});

// Update order fulfillment status (legacy endpoint - keeping for compatibility)
router.put('/:orderId/fulfillment', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { fulfillmentId, state } = req.body; // state: 'PREPARED' or 'COMPLETED'
    
    // First get the current order to get the version
    const { result: orderResult } = await ordersApi.get(orderId);
    
    if (!orderResult.order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const currentOrder = orderResult.order;
    
    // Update the fulfillment state
    const updatedFulfillments = currentOrder.fulfillments.map(fulfillment => {
      if (fulfillment.uid === fulfillmentId) {
        return {
          ...fulfillment,
          state: state
        };
      }
      return fulfillment;
    });

    const updateRequest = {
      order: {
        version: currentOrder.version,
        fulfillments: updatedFulfillments
      }
    };

    const { result, ...httpResponse } = await ordersApi.update(orderId, updateRequest);
    
    if (result.order) {
      res.json({
        success: true,
        order: result.order
      });
    } else {
      res.status(400).json({ 
        error: 'Failed to update order',
        details: result.errors || 'Unknown error'
      });
    }

  } catch (error) {
    console.error('Error updating order fulfillment:', error);
    res.status(500).json({ 
      error: 'Failed to update order fulfillment',
      details: error.message 
    });
  }
});

// Automatic background task to update PROPOSED orders to PREPARED
// Since we only sell in-stock items, orders should be ready immediately
const autoUpdateInterval = setInterval(async () => {
  try {
    const response = await fetch('http://localhost:8080/api/orders/auto-prepare-orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.updated_count > 0) {
        console.log(`🔄 Auto-updated ${data.updated_count} orders to PREPARED status`);
      }
    }
  } catch (error) {
    // Silently handle errors to avoid spam
    console.error('Auto-update task error:', error.message);
  }
}, 30000); // Run every 30 seconds

// Clean up interval on process exit
process.on('SIGTERM', () => {
  clearInterval(autoUpdateInterval);
});

process.on('SIGINT', () => {
  clearInterval(autoUpdateInterval);
});

module.exports = router;
