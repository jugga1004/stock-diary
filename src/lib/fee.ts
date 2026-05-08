import { TradeType } from "./types";
import { DEFAULT_FEE_CONFIG, FeeConfig } from "./feeConfig";

export interface FeeBreakdown {
  commission: number;
  tax: number;
  total: number;
}

export function calculateFee(
  type: TradeType,
  quantity: number,
  price: number,
  config: FeeConfig = DEFAULT_FEE_CONFIG,
): FeeBreakdown {
  const notional = quantity * price;
  if (!Number.isFinite(notional) || notional <= 0) {
    return { commission: 0, tax: 0, total: 0 };
  }
  const commissionRate = config.freeCommission
    ? 0
    : config.commissionRate / 100;
  const taxRate = config.sellTaxRate / 100;
  const commission = Math.round(notional * commissionRate);
  const tax = type === "sell" ? Math.round(notional * taxRate) : 0;
  return { commission, tax, total: commission + tax };
}
