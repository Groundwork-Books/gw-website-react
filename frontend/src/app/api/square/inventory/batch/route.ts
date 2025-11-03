// app/api/square/inventory/batch/route.ts
import { NextRequest, NextResponse } from 'next/server';
type BatchRetrieveCountsRequest = {
  catalog_object_ids: string[];
  location_ids?: string[];
  cursor?: string;
};

type SquareCount = {
  state: string
  catalog_object_id: string
  quantity: string
};

type BatchRetrieveCountsResponse = {
  counts?: SquareCount[]
  cursor?: string
  errors?: Array<{ code: string; detail?: string }>
};

const headers = () => ({
  Authorization: `Bearer ${process.env.SQUARE_ACCESS_TOKEN!}`,
  Accept: 'application/json',
  'Content-Type': 'application/json',
  'Square-Version': '2024-12-18',
});

function chunk<T>(arr: T[], size: number) {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

export async function POST(req: NextRequest) {
  try {
    const { variationIds, locationId } = await req.json();
    if (!Array.isArray(variationIds) || variationIds.length === 0) {
      return NextResponse.json({ error: 'variationIds required' }, { status: 400 });
    }

    if (!process.env.SQUARE_LOCATION_ID && !locationId) {
      console.warn('Inventory: SQUARE_LOCATION_ID not set on server, counts aggregate across all locations');
    }

    const ids = Array.from(new Set(variationIds.filter(Boolean)));
    const available: Record<string, number> = {};
    const tracked: Record<string, boolean> = {};
    const loc = locationId || process.env.SQUARE_LOCATION_ID;

    for (const group of chunk(ids, 100)) {
      let cursor: string | undefined = undefined;
      do {
        const payload: BatchRetrieveCountsRequest = { catalog_object_ids: group };
        if (loc) {
          payload.location_ids = [loc];
        }
        if (cursor) {
          payload.cursor = cursor;
        }

        let r: Response;
        let attempt = 0;
        while (true) {
          r = await fetch(
            'https://connect.squareup.com/v2/inventory/batch-retrieve-counts',
            { method: 'POST', headers: headers(), body: JSON.stringify(payload) }
          );
          if (r.status !== 429 || attempt >= 2) break;
          attempt++;
          await sleep(300 * attempt);
        }
        const j: BatchRetrieveCountsResponse = await r.json();

        if (!r.ok) {
          return NextResponse.json({ error: 'Square inventory error', details: j.errors || j }, { status: r.status });
        }

        // Sum IN_STOCK per variation
        for (const c of j.counts ?? []) {
          const id = c.catalog_object_id;
          tracked[id] = true;
          if (c.state === 'IN_STOCK') {
            const q = parseFloat(c.quantity);
            available[id] = (available[id] ?? 0) + (isNaN(q) ? 0 : q);
          }
        }

        cursor = j.cursor;
      } while (cursor);
    }

    return NextResponse.json({ success: true, available, tracked });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to retrieve inventory', details: String(e) }, { status: 500 });
  }
}
