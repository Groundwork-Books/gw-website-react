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

type AllowedStatus = 'PREPARED' | 'COMPLETED' | 'RESERVED';

function isAllowedStatus(value: unknown): value is AllowedStatus {
  return value === 'PREPARED' || value === 'COMPLETED' || value === 'RESERVED';
}

type Fulfillment = {
  uid?: string;
  type?: string;
  state?: string;
  pickup_details?: {
    note?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

type OrderFromSquare = {
  version?: number;
  fulfillments?: Fulfillment[];
  [key: string]: unknown;
};

type OrderResponseFromSquare = {
  order?: OrderFromSquare;
};

// Update order pickup status (processed / ready / picked up)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    // Match the pattern used in search-by-email route
    const { orderId } = await params;

    const rawBody = (await request.json()) as {
      status?: unknown;
      notes?: unknown;
    };

    if (!isAllowedStatus(rawBody.status)) {
      return NextResponse.json(
        { error: 'Invalid or missing status' },
        { status: 400 }
      );
    }

    const status: AllowedStatus = rawBody.status;
    const notes = typeof rawBody.notes === 'string' ? rawBody.notes : undefined;

    // First get the current order
    const orderResponse = await fetch(
      `https://connect.squareup.com/v2/orders/${orderId}`,
      {
        method: 'GET',
        headers: getSquareHeaders(false)
      }
    );

    const orderData = (await orderResponse.json()) as OrderResponseFromSquare;

    if (!orderResponse.ok || !orderData.order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    const currentOrder = orderData.order;
    const fulfillments = currentOrder.fulfillments ?? [];

    if (fulfillments.length === 0) {
      return NextResponse.json(
        { error: 'Order has no fulfillments' },
        { status: 400 }
      );
    }

    const currentFulfillment = fulfillments[0];

    if (!currentFulfillment.uid || !currentFulfillment.type) {
      return NextResponse.json(
        { error: 'Order fulfillment is missing required fields' },
        { status: 400 }
      );
    }

    const pickupDetails = currentFulfillment.pickup_details ?? {};
    const existingNote =
      typeof pickupDetails.note === 'string' ? pickupDetails.note : '';

    const updatedNote =
      notes && notes.trim().length > 0
        ? existingNote
          ? `${existingNote} | Staff note: ${notes}`
          : `Staff note: ${notes}`
        : existingNote;

    // Update the fulfillment status
    const updateResponse = await fetch(
      `https://connect.squareup.com/v2/orders/${orderId}`,
      {
        method: 'PUT',
        headers: getSquareHeaders(),
        body: JSON.stringify({
          order: {
            version: currentOrder.version,
            fulfillments: [
              {
                uid: currentFulfillment.uid,
                type: currentFulfillment.type,
                state: status,
                pickup_details: {
                  ...pickupDetails,
                  note: updatedNote
                }
              }
            ]
          }
        })
      }
    );

    const updateData = (await updateResponse.json()) as {
      order?: unknown;
      errors?: unknown;
    };

    if (updateResponse.ok && updateData.order) {
      return NextResponse.json({
        success: true,
        order: updateData.order,
        message:
          status === 'COMPLETED'
            ? 'Order marked as picked up'
            : status === 'PREPARED'
            ? 'Order marked as ready for pickup'
            : 'Order marked as processed',
        updated_status: status
      });
    }

    return NextResponse.json(
      {
        error: 'Failed to update pickup status',
        details: updateData.errors || updateData || 'Unknown error'
      },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error updating pickup status:', error);
    return NextResponse.json(
      {
        error: 'Failed to update pickup status',
        details: String(error)
      },
      { status: 500 }
    );
  }
}
