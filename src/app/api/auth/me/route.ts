import { getCurrentUserId } from "@/lib/auth";

export async function GET() {
  const id = await getCurrentUserId();
  return Response.json({ user: id ? { id } : null });
}
