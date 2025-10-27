// app/api/square/inventory/batch/route.ts
import { NextRequest, NextResponse } from 'next/server';
type BatchRetrieveCountsRequest = {
  catalog_object_ids: string[];
  location_ids?: string[];
};

const headers = () => ({
  Authorization: `Bearer ${process.env.SQUARE_ACCESS_TOKEN!}`,
  Accept: 'application/json',
  'Content-Type': 'application/json',
  'Square-Version': '2024-12-18',
});

export async function POST(req: NextRequest) {
  try {
    const { variationIds, locationId } = await req.json();
    if (!Array.isArray(variationIds) || variationIds.length === 0) {
      return NextResponse.json({ error: 'variationIds required' }, { status: 400 });
    }

    const payload: BatchRetrieveCountsRequest = { catalog_object_ids: variationIds };
    if (locationId || process.env.SQUARE_LOCATION_ID) {
      payload.location_ids = [locationId || process.env.SQUARE_LOCATION_ID];
    }

    const r = await fetch(
      'https://connect.squareup.com/v2/inventory/batch-retrieve-counts',
      { method: 'POST', headers: headers(), body: JSON.stringify(payload) }
    );
    const j = await r.json();

    if (!r.ok) {
      return NextResponse.json({ error: 'Square inventory error', details: j.errors || j }, { status: r.status });
    }

    // Sum IN_STOCK per variation
    const available: Record<string, number> = {};
    for (const c of j.counts ?? []) {
      if (c.state === 'IN_STOCK') {
        const id = c.catalog_object_id;
        const q = parseFloat(c.quantity);
        available[id] = (available[id] ?? 0) + (isNaN(q) ? 0 : q);
      }
    }

    return NextResponse.json({ success: true, available });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to retrieve inventory', details: String(e) }, { status: 500 });
  }
}
