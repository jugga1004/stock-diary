import { TradeType } from "./types";

export const COMMISSION_RATE = 0.00015;
export const SELL_TAX_RATE = 0.0018;

export interface FeeBreakdown {
  commission: number;
  tax: number;
  total: number;
}

export function calculateFee(
  type: TradeType,
  quantity: number,
  price: number,
): FeeBreakdown {
  const notional = quantity * price;
  if (!Number.isFinite(notional) || notional <= 0) {
    return { commission: 0, tax: 0, total: 0 };
  }
  const commission = Math.round(notional * COMMISSION_RATE);
  const tax = type === "sell" ? Math.round(notional * SELL_TAX_RATE) : 0;
  return { commission, tax, total: commission + tax };
}
