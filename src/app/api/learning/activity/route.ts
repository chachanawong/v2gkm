import { listBoUsers } from "@/lib/bo-members";
import { writeAuditLog } from "@/lib/audit";
import { listSheet } from "@/lib/google-sheets";
import { getBearerToken, verifyToken } from "@/lib/session-token";
import { canAccess } from "@/lib/visibility";
import type { LearningPath, Lesson } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type ActivityRequest = {
  action?: string;
  pathId?: string;
  lessonId?: string;
};

export async function POST(request: Request) {
  const session = verifyToken(getBearerToken(request));
  if (session?.kind !== "user") {
    return Response.json({ error: "User session required" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({})) as ActivityRequest;
  const action = String(body.action ?? "");
  if (action !== "open_path" && action !== "open_lesson") {
    return Response.json({ error: "Invalid action" }, { status: 400 });
  }

  const users = await listBoUsers();
  const user = users.find((item) => item.id === session.id && item.active !== false);
  if (!user) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  if (action === "open_path") {
    const pathId = String(body.pathId ?? "");
    if (!pathId) return Response.json({ error: "Missing pathId" }, { status: 400 });

    const paths = await listSheet("learning_paths");
    const path = paths.find((item) => item.id === pathId && item.status === "published") as LearningPath | undefined;
    if (!path || !canAccess(session.membership, path.visibility)) {
      return Response.json({ error: "Learning path not found" }, { status: 404 });
    }

    const log = await writeAuditLog({
      actor: user.name,
      role: "user",
      action,
      resource: `learning_paths:${path.title} (#${path.id})`,
    });
    return Response.json({ log });
  }

  const lessonId = String(body.lessonId ?? "");
  if (!lessonId) return Response.json({ error: "Missing lessonId" }, { status: 400 });

  const [paths, lessons] = await Promise.all([listSheet("learning_paths"), listSheet("lessons")]);
  const lesson = lessons.find((item) => item.id === lessonId && item.status === "published") as Lesson | undefined;
  if (!lesson) {
    return Response.json({ error: "Lesson not found" }, { status: 404 });
  }

  const path = paths.find((item) => item.id === lesson.pathId && item.status === "published") as LearningPath | undefined;
  if (!path || !canAccess(session.membership, path.visibility)) {
    return Response.json({ error: "Learning path not found" }, { status: 404 });
  }

  const log = await writeAuditLog({
    actor: user.name,
    role: "user",
    action,
    resource: `lessons:${lesson.title} (#${lesson.id})`,
  });
  return Response.json({ log });
}
