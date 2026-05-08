import { getSessionCookie, verifySessionToken } from "./session";

export async function getCurrentUserId(): Promise<string | null> {
  const token = await getSessionCookie();
  if (!token) return null;
  const session = await verifySessionToken(token);
  return session?.userId ?? null;
}
