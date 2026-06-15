import { listSheet } from "@/lib/google-sheets";
import { getBearerToken, verifyToken } from "@/lib/session-token";
import { canAccess } from "@/lib/visibility";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = verifyToken(getBearerToken(request));
  const membership = session?.kind === "user" ? session.membership : "general";
  const [paths, lessons] = await Promise.all([listSheet("learning_paths"), listSheet("lessons")]);
  const visiblePaths = paths
    .filter((p) => p.status === "published" && canAccess(membership, p.visibility))
    .sort((a, b) => a.order - b.order);
  const pathIds = new Set(visiblePaths.map((p) => p.id));
  const visibleLessons = lessons
    .filter((l) => l.status === "published" && pathIds.has(l.pathId))
    .sort((a, b) => a.order - b.order);
  return Response.json({ paths: visiblePaths, lessons: visibleLessons }, { headers: { "Cache-Control": "private, max-age=30" } });
}
