'use client';

import { useEffect, useState } from 'react';

type InventoryMap = Record<string, number>;

const CACHE_TTL_MS = 2 * 60 * 1000;
const COALESCE_MS = 75;
const MAX_IDS_PER_BATCH = 100;

type Listener = { resolve: (n: number | null) => void; reject: (e: unknown) => void };

const cache = new Map<string, { qty: number | null; expires: number }>();
const listeners = new Map<string, Array<{ resolve: (n: number | null) => void; reject: (e: unknown) => void }>>();
const queued = new Set<string>();
let flushTimer: ReturnType<typeof setTimeout> | null = null;

// per-category queues and timers to isolate batches by carousel
const groupQueues = new Map<string, Set<string>>();
const groupTimers = new Map<string, ReturnType<typeof setTimeout> | null>();

async function inventoryBatch(variationIds: string[]): Promise<InventoryMap> {
  const r = await fetch('/api/square/inventory/batch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ variationIds }),
  });
  if (!r.ok) throw new Error(`inventory batch failed: ${r.status}`);
  const j = await r.json();
  return j.available || {};
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function scheduleFlush(group?: string) {
  // grouped flush, used for per-category prefetch
  if (group) {
    if (groupTimers.get(group)) return;
    const t = setTimeout(async () => {
      groupTimers.set(group, null);
      const q = groupQueues.get(group);
      if (!q || q.size === 0) return;
      const ids = Array.from(q.values());
      groupQueues.delete(group);

      try {
        const chunks = chunk(ids, MAX_IDS_PER_BATCH);
        const parts = await Promise.all(chunks.map(c => inventoryBatch(c)));
        const merged: InventoryMap = Object.assign({}, ...parts);

        const now = Date.now();
        for (const id of ids) {
          const has = Object.prototype.hasOwnProperty.call(merged, id);
          const qty = has ? Number(merged[id]) : null;
          cache.set(id, { qty, expires: now + CACHE_TTL_MS });
          const ls = listeners.get(id);
          if (ls && ls.length) {
            for (const { resolve } of ls) resolve(qty);
            listeners.delete(id);
          }
        }
      } catch (err) {
        for (const id of ids) {
          const ls = listeners.get(id);
          if (ls && ls.length) {
            for (const { reject } of ls) reject(err);
            listeners.delete(id);
          }
        }
      }
    }, COALESCE_MS);
    groupTimers.set(group, t);
    return;
  }

  // global flush, used for direct getInventory and ungrouped prefetch
  if (flushTimer) return;
  flushTimer = setTimeout(async () => {
    const ids = Array.from(new Set<string>([...listeners.keys(), ...queued.values()]));
    flushTimer = null;
    queued.clear();
    if (ids.length === 0) return;

    try {
      const chunks = chunk(ids, MAX_IDS_PER_BATCH);
      const parts = await Promise.all(chunks.map(c => inventoryBatch(c)));
      const merged: InventoryMap = Object.assign({}, ...parts);

      const now = Date.now();
      for (const id of ids) {
        const has = Object.prototype.hasOwnProperty.call(merged, id);
        const qty = has ? Number(merged[id]) : null;
        cache.set(id, { qty, expires: now + CACHE_TTL_MS });
        const ls = listeners.get(id);
        if (ls && ls.length) {
          for (const { resolve } of ls) resolve(qty);
          listeners.delete(id);
        }
      }
    } catch (err) {
      for (const id of ids) {
        const ls = listeners.get(id);
        if (ls && ls.length) {
          for (const { reject } of ls) reject(err);
          listeners.delete(id);
        }
      }
    }
  }, COALESCE_MS);
}

function getInventory(variationId: string): Promise<number | null> {
  const now = Date.now();
  const hit = cache.get(variationId);
  if (hit && hit.expires > now) return Promise.resolve(hit.qty);

  return new Promise<number | null>((resolve, reject) => {
    const entry: Listener = { resolve, reject };
    const arr = listeners.get(variationId);
    if (arr) {
      arr.push(entry);
    } else {
      listeners.set(variationId, [entry]);
    }
    scheduleFlush();
  });
}

export function prefetchInventory(ids: string[], group?: string) {
  const now = Date.now();
  if (group) {
    let q = groupQueues.get(group);
    if (!q) {
      q = new Set<string>();
      groupQueues.set(group, q);
    }
    let queuedSomething = false;
    for (const id of ids) {
      const hit = cache.get(id);
      if (hit && hit.expires > now) continue;
      q.add(id);
      queuedSomething = true;
    }
    if (queuedSomething) scheduleFlush(group);
    return;
  }

  let queuedSomething = false;
  for (const id of ids) {
    const hit = cache.get(id);
    if (hit && hit.expires > now) continue;
    queued.add(id);
    queuedSomething = true;
  }
  if (queuedSomething) scheduleFlush();
}

export function useInventory(variationId?: string) {
  const [qty, setQty] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!variationId) {
      setQty(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);

    getInventory(variationId)
      .then(n => { if (!cancelled) setQty(typeof n === 'number' ? n : null); })
      .catch(() => { if (!cancelled) setQty(null); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [variationId]);

  return { qty, loading };
}
