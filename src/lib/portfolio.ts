import { Holding, PortfolioSummary, Trade } from "./types";

export function computeHoldings(trades: Trade[]): Holding[] {
  const map = new Map<string, Holding>();
  const sorted = [...trades].sort((a, b) => a.date.localeCompare(b.date));

  for (const t of sorted) {
    const key = (t.symbol || t.name).trim();
    let h = map.get(key);
    if (!h) {
      h = {
        symbol: t.symbol,
        name: t.name,
        totalQuantity: 0,
        avgBuyPrice: 0,
        totalCost: 0,
        realizedProfit: 0,
      };
      map.set(key, h);
    }

    if (t.type === "buy") {
      const newCost = h.totalCost + t.quantity * t.price + t.fee;
      const newQty = h.totalQuantity + t.quantity;
      h.totalQuantity = newQty;
      h.totalCost = newCost;
      h.avgBuyPrice = newQty > 0 ? newCost / newQty : 0;
    } else {
      const costBasis = h.avgBuyPrice * t.quantity;
      const proceeds = t.quantity * t.price - t.fee;
      h.realizedProfit += proceeds - costBasis;
      h.totalQuantity -= t.quantity;
      h.totalCost = h.totalQuantity * h.avgBuyPrice;
    }
  }

  return Array.from(map.values()).filter(
    (h) => h.totalQuantity > 0 || h.realizedProfit !== 0,
  );
}

export function computeSummary(trades: Trade[]): PortfolioSummary {
  const holdings = computeHoldings(trades);
  const active = holdings.filter((h) => h.totalQuantity > 0);
  return {
    totalInvested: active.reduce((s, h) => s + h.totalCost, 0),
    totalRealizedProfit: holdings.reduce((s, h) => s + h.realizedProfit, 0),
    totalHoldings: active.length,
    totalTrades: trades.length,
  };
}

export function formatKRW(amount: number): string {
  return new Intl.NumberFormat("ko-KR").format(Math.round(amount)) + "원";
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("ko-KR").format(n);
}
