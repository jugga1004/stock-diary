import { NextRequest } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { ensureSchema, getSql } from "@/lib/db";
import { Trade } from "@/lib/types";

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

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, ctx: RouteContext) {
  const userId = await getCurrentUserId();
  if (!userId)
    return Response.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  try {
    await ensureSchema();
    const sql = getSql();
    const rows = (await sql`
      SELECT id, date, symbol, name, type, quantity, price, fee, note, created_at
      FROM trades WHERE id = ${id} AND user_id = ${userId}
    `) as TradeRow[];
    if (rows.length === 0)
      return Response.json({ error: "not found" }, { status: 404 });
    return Response.json(rowToTrade(rows[0]));
  } catch (e) {
    console.error("GET /api/trades/[id] error", e);
    return Response.json({ error: "서버 오류" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, ctx: RouteContext) {
  const userId = await getCurrentUserId();
  if (!userId)
    return Response.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "잘못된 요청" }, { status: 400 });
  }
  if (!body || typeof body !== "object")
    return Response.json({ error: "잘못된 요청" }, { status: 400 });
  const b = body as Record<string, unknown>;
  if (typeof b.name !== "string" || !b.name.trim())
    return Response.json({ error: "종목명 누락" }, { status: 400 });
  if (b.type !== "buy" && b.type !== "sell")
    return Response.json({ error: "구분 오류" }, { status: 400 });
  const quantity = Number(b.quantity);
  const price = Number(b.price);
  if (!Number.isFinite(quantity) || quantity <= 0)
    return Response.json({ error: "수량 오류" }, { status: 400 });
  if (!Number.isFinite(price) || price <= 0)
    return Response.json({ error: "단가 오류" }, { status: 400 });

  const symbol = typeof b.symbol === "string" ? b.symbol.trim() : "";
  const fee = Number.isFinite(Number(b.fee)) ? Number(b.fee) : 0;
  const note = typeof b.note === "string" ? b.note : "";
  const date = typeof b.date === "string" ? b.date : "";

  try {
    await ensureSchema();
    const sql = getSql();
    await sql`
      UPDATE trades SET
        date = ${date},
        symbol = ${symbol},
        name = ${String(b.name).trim()},
        type = ${b.type},
        quantity = ${quantity},
        price = ${price},
        fee = ${fee},
        note = ${note}
      WHERE id = ${id} AND user_id = ${userId}
    `;
    return Response.json({ ok: true });
  } catch (e) {
    console.error("PATCH /api/trades/[id] error", e);
    return Response.json({ error: "서버 오류" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, ctx: RouteContext) {
  const userId = await getCurrentUserId();
  if (!userId)
    return Response.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  try {
    await ensureSchema();
    const sql = getSql();
    await sql`DELETE FROM trades WHERE id = ${id} AND user_id = ${userId}`;
    return Response.json({ ok: true });
  } catch (e) {
    console.error("DELETE /api/trades/[id] error", e);
    return Response.json({ error: "서버 오류" }, { status: 500 });
  }
}
