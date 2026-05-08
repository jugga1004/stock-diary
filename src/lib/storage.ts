import { Trade, TradeType } from "./types";

// === API client ===

export async function getTrades(): Promise<Trade[]> {
  try {
    const res = await fetch("/api/trades", { cache: "no-store" });
    if (!res.ok) return [];
    const data = (await res.json()) as { trades?: Trade[] };
    return data.trades ?? [];
  } catch {
    return [];
  }
}

export async function getTrade(id: string): Promise<Trade | null> {
  try {
    const res = await fetch(`/api/trades/${encodeURIComponent(id)}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as Trade;
  } catch {
    return null;
  }
}

export async function addTrade(
  input: Omit<Trade, "id" | "createdAt">,
): Promise<void> {
  await fetch("/api/trades", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export async function updateTrade(
  id: string,
  input: Omit<Trade, "id" | "createdAt">,
): Promise<void> {
  await fetch(`/api/trades/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export async function deleteTrade(id: string): Promise<void> {
  await fetch(`/api/trades/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

// === Legacy localStorage helpers (for one-time migration only) ===

const LEGACY_KEY = "stock-diary-trades";

interface RawTrade {
  id?: unknown;
  date?: unknown;
  symbol?: unknown;
  name?: unknown;
  type?: unknown;
  quantity?: unknown;
  price?: unknown;
  fee?: unknown;
  note?: unknown;
  reason?: unknown;
  emotion?: unknown;
  createdAt?: unknown;
}

function asString(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

function asNumber(v: unknown, fallback = 0): number {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

function migrateLegacy(t: RawTrade): Trade {
  const noteParts = [t.note, t.reason, t.emotion]
    .map((v) => asString(v).trim())
    .filter(Boolean);
  const type: TradeType = t.type === "sell" ? "sell" : "buy";
  return {
    id: asString(t.id, crypto.randomUUID()),
    date: asString(t.date, new Date().toISOString().slice(0, 10)),
    symbol: asString(t.symbol),
    name: asString(t.name),
    type,
    quantity: asNumber(t.quantity),
    price: asNumber(t.price),
    fee: asNumber(t.fee),
    note: noteParts.join("\n\n"),
    createdAt: asString(t.createdAt, new Date().toISOString()),
  };
}

export function getLocalTrades(): Trade[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(LEGACY_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return (parsed as RawTrade[]).map(migrateLegacy);
  } catch {
    return [];
  }
}

export function clearLocalTrades(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(LEGACY_KEY);
}
