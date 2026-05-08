import { NextRequest } from "next/server";

export interface PriceData {
  price: number;
  change: number;
  ratio: number;
  marketStatus: string;
  name: string;
  tradedAt: string;
}

interface NaverPriceItem {
  closePrice?: string;
  compareToPreviousClosePrice?: string;
  fluctuationsRatio?: string;
  marketStatus?: string;
  stockName?: string;
  localTradedAt?: string;
}

function parseNum(s: string | undefined): number {
  if (!s) return 0;
  const n = Number(String(s).replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
}

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("codes");
  const codes = raw
    ? raw
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean)
    : [];
  if (codes.length === 0) return Response.json({ prices: {} });

  const entries = await Promise.all(
    codes.map(async (code) => {
      try {
        const url = `https://polling.finance.naver.com/api/realtime/domestic/stock/${encodeURIComponent(code)}`;
        const res = await fetch(url, {
          headers: {
            "User-Agent": "Mozilla/5.0",
            Referer: "https://finance.naver.com/",
          },
          next: { revalidate: 30 },
        });
        if (!res.ok) return [code, null] as const;
        const data = await res.json();
        const d = (data?.datas?.[0] ?? null) as NaverPriceItem | null;
        if (!d) return [code, null] as const;
        const price: PriceData = {
          price: parseNum(d.closePrice),
          change: parseNum(d.compareToPreviousClosePrice),
          ratio: parseNum(d.fluctuationsRatio),
          marketStatus: d.marketStatus ?? "",
          name: d.stockName ?? "",
          tradedAt: d.localTradedAt ?? "",
        };
        return [code, price] as const;
      } catch {
        return [code, null] as const;
      }
    }),
  );

  const prices: Record<string, PriceData> = {};
  for (const [code, data] of entries) if (data) prices[code] = data;
  return Response.json({ prices });
}
