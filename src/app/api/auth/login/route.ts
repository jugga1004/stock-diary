import { NextRequest } from "next/server";
import { ensureSchema, getSql } from "@/lib/db";
import { createSessionToken, setSessionCookie } from "@/lib/session";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "잘못된 요청" }, { status: 400 });
  }
  const id =
    typeof (body as { id?: unknown })?.id === "string"
      ? (body as { id: string }).id.trim()
      : "";
  if (id.length < 3 || id.length > 50) {
    return Response.json(
      { error: "ID는 3~50자여야 합니다" },
      { status: 400 },
    );
  }
  try {
    await ensureSchema();
    const sql = getSql();
    await sql`INSERT INTO users (id) VALUES (${id}) ON CONFLICT DO NOTHING`;
    const token = await createSessionToken(id);
    await setSessionCookie(token);
    return Response.json({ id });
  } catch (e) {
    console.error("login error", e);
    return Response.json({ error: "서버 오류" }, { status: 500 });
  }
}
