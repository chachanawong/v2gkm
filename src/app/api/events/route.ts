import { listSheet } from "@/lib/google-sheets";
import { getBearerToken, verifyToken } from "@/lib/session-token";
import { canAccess } from "@/lib/visibility";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = verifyToken(getBearerToken(request));
  const membership = session?.kind === "user" ? session.membership : "general";
  const events = await listSheet("events");
  const visible = events.filter((e) => e.status === "published" && canAccess(membership, e.visibility));
  const sorted = [...visible].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return a.startDate.localeCompare(b.startDate);
  });
  return Response.json({ items: sorted }, { headers: { "Cache-Control": "private, max-age=30" } });
}
