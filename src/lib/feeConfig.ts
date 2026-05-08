export type BrokerPreset = "toss" | "kakaopay" | "kiwoom" | "custom";

export interface FeeConfig {
  broker: BrokerPreset;
  commissionRate: number;
  sellTaxRate: number;
  freeCommission: boolean;
}

export const BROKER_PRESETS: Record<
  Exclude<BrokerPreset, "custom">,
  { commissionRate: number; sellTaxRate: number; label: string }
> = {
  toss: { commissionRate: 0.015, sellTaxRate: 0.18, label: "토스증권" },
  kakaopay: {
    commissionRate: 0.015,
    sellTaxRate: 0.18,
    label: "카카오페이증권",
  },
  kiwoom: { commissionRate: 0.015, sellTaxRate: 0.18, label: "키움증권" },
};

export const DEFAULT_FEE_CONFIG: FeeConfig = {
  broker: "toss",
  commissionRate: 0.015,
  sellTaxRate: 0.18,
  freeCommission: false,
};

const KEY = "stock-diary-fee-config";

export function getFeeConfig(): FeeConfig {
  if (typeof window === "undefined") return DEFAULT_FEE_CONFIG;
  const raw = window.localStorage.getItem(KEY);
  if (!raw) return DEFAULT_FEE_CONFIG;
  try {
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_FEE_CONFIG, ...parsed };
  } catch {
    return DEFAULT_FEE_CONFIG;
  }
}

export function saveFeeConfig(c: FeeConfig): void {
  window.localStorage.setItem(KEY, JSON.stringify(c));
}
