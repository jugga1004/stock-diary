import { Trade } from "./types";

const KEY = "stock-diary-trades";

export function getTrades(): Trade[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Trade[];
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
