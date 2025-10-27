// lib/useInventory.ts
import { useEffect, useState } from 'react';

export function useInventory(variationId?: string) {
  const [qty, setQty] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!variationId) return;
    let cancelled = false;
    setLoading(true);

    fetch('/api/square/inventory/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ variationIds: [variationId] }),
    })
      .then(r => r.json())
      .then(d => { if (!cancelled){
            const val = d?.available?.[variationId];
            setQty(typeof val === 'number' ? val : null);
            }
        })
      .catch(() => { if (!cancelled) setQty(null); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [variationId]);

  return { qty, loading };
}
