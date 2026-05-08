import { Trade, TradeType } from "./types";

const KEY = "stock-diary-trades";

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

function migrate(t: RawTrade): Trade {
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

export function getTrades(): Trade[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(migrate);
  } catch {
    return [];
  }
}

export function saveTrades(trades: Trade[]): void {
  window.localStorage.setItem(KEY, JSON.stringify(trades));
}

export function addTrade(input: Omit<Trade, "id" | "createdAt">): Trade {
  const newTrade: Trade = {
    ...input,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  const trades = getTrades();
  trades.push(newTrade);
  saveTrades(trades);
  return newTrade;
}

export function deleteTrade(id: string): void {
  const trades = getTrades().filter((t) => t.id !== id);
  saveTrades(trades);
}
