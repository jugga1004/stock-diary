import { NextRequest } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { ensureSchema, getSql } from "@/lib/db";
import { Trade, TradeType } from "@/lib/types";

interface TradeRow {
  id: string;
  date: string;
  symbol: string;
  name: string;
  type: string;
  quantity: string | number;
  price: string | number;
  fee: string | number;
  note: string;
  created_at: string;
}

function rowToTrade(r: TradeRow): Trade {
  return {
    id: r.id,
    date: r.date,
    symbol: r.symbol,
    name: r.name,
    type: r.type === "sell" ? "sell" : "buy",
    quantity: Number(r.quantity),
    price: Number(r.price),
    fee: Number(r.fee),
    note: r.note,
    createdAt: r.created_at,
  };
}

interface TradeInput {
  date: string;
  symbol?: string;
  name: string;
  type: TradeType;
  quantity: number;
  price: number;
  fee?: number;
  note?: string;
}

function validateTradeInput(body: unknown): TradeInput | { error: string } {
  if (!body || typeof body !== "object") return { error: "잘못된 요청" };
  const b = body as Record<string, unknown>;
  if (typeof b.date !== "string" || !b.date) return { error: "거래일 누락" };
  if (typeof b.name !== "string" || !b.name.trim())
    return { error: "종목명 누락" };
  if (b.type !== "buy" && b.type !== "sell")
    return { error: "구분이 올바르지 않음" };
  const quantity = Number(b.quantity);
  const price = Number(b.price);
  if (!Number.isFinite(quantity) || quantity <= 0)
    return { error: "수량이 올바르지 않음" };
  if (!Number.isFinite(price) || price <= 0)
    return { error: "단가가 올바르지 않음" };
  return {
    date: b.date,
    name: String(b.name).trim(),
    symbol: typeof b.symbol === "string" ? b.symbol.trim() : "",
    type: b.type,
    quantity,
    price,
    fee: Number.isFinite(Number(b.fee)) ? Number(b.fee) : 0,
    note: typeof b.note === "string" ? b.note : "",
  };
}

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId)
    return Response.json({ error: "unauthorized" }, { status: 401 });
  try {
    await ensureSchema();
    const sql = getSql();
    const rows = (await sql`
      SELECT id, date, symbol, name, type, quantity, price, fee, note, created_at
      FROM trades
      WHERE user_id = ${userId}
      ORDER BY date DESC, created_at DESC
    `) as TradeRow[];
    return Response.json({ trades: rows.map(rowToTrade) });
  } catch (e) {
    console.error("GET /api/trades error", e);
    return Response.json({ error: "서버 오류" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId)
    return Response.json({ error: "unauthorized" }, { status: 401 });
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "잘못된 요청" }, { status: 400 });
  }
  const result = validateTradeInput(body);
  if ("error" in result) return Response.json(result, { status: 400 });
  try {
    await ensureSchema();
    const sql = getSql();
    const id = crypto.randomUUID();
    await sql`
      INSERT INTO trades (id, user_id, date, symbol, name, type, quantity, price, fee, note)
      VALUES (
        ${id}, ${userId}, ${result.date}, ${result.symbol ?? ""}, ${result.name},
        ${result.type}, ${result.quantity}, ${result.price}, ${result.fee ?? 0}, ${result.note ?? ""}
      )
    `;
    return Response.json({ id });
  } catch (e) {
    console.error("POST /api/trades error", e);
    return Response.json({ error: "서버 오류" }, { status: 500 });
  }
}
