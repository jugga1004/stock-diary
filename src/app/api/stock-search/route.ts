import { NextRequest } from "next/server";

interface NaverSearchItem {
  code?: string;
  name?: string;
  typeName?: string;
}

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("query")?.trim();
  if (!query) return Response.json({ items: [] });

  try {
    const url = `https://m.stock.naver.com/front-api/search/autoComplete?query=${encodeURIComponent(query)}&target=stock`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      next: { revalidate: 60 },
    });
    if (!res.ok) return Response.json({ items: [] });
    const data = await res.json();
    const raw = (data?.result?.items ?? []) as NaverSearchItem[];
    const items = raw
      .filter((i) => i.code && i.name)
      .map((i) => ({
        code: i.code as string,
        name: i.name as string,
        market: i.typeName ?? "",
      }));
    return Response.json({ items });
  } catch {
    return Response.json({ items: [] });
  }
}
