import { getUserContent } from "@/lib/content";
import { getBearerToken, verifyToken } from "@/lib/session-token";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  const bearerToken = getBearerToken(request);
  const session = verifyToken(bearerToken);
  if (bearerToken && !session) {
    return Response.json({ error: "Invalid user session" }, { status: 401 });
  }
  const membership = session?.kind === "user" ? session.membership : "general";
  const data = await getUserContent(membership);
  if (type === "all") {
    return Response.json(data, {
      headers: { "Cache-Control": "private, max-age=30, stale-while-revalidate=120" },
    });
  }
  if (type !== "knowledge" && type !== "news" && type !== "profiles" && type !== "categories") {
    return Response.json({ error: "Unknown content type" }, { status: 404 });
  }
  return Response.json(
    { items: data[type] },
    { headers: { "Cache-Control": "private, max-age=30, stale-while-revalidate=120" } },
  );
}
