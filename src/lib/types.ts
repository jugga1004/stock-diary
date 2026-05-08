export type TradeType = "buy" | "sell";

export interface Trade {
  id: string;
  date: string;
  symbol: string;
  name: string;
  type: TradeType;
  quantity: number;
  price: number;
  fee: number;
  reason: string;
  emotion: string;
  createdAt: string;
}

export interface Holding {
  symbol: string;
  name: string;
  totalQuantity: number;
  avgBuyPrice: number;
  totalCost: number;
  realizedProfit: number;
}

export interface PortfolioSummary {
  totalInvested: number;
  totalRealizedProfit: number;
  totalHoldings: number;
  totalTrades: number;
}
