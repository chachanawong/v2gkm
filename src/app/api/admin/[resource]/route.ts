import { assertAdminRequest, getAdminSession, normalizeAdminRole } from "@/lib/auth";
import { deleteResource, listResource, upsertResource } from "@/lib/google-sheets";
import { writeAuditLog } from "@/lib/audit";
import { applyPublishWindow, computeContentStatus, validatePublishWindow } from "@/lib/publish";
import type { ResourceType } from "@/lib/types";
import { getYouTubeId, getYouTubeThumbnail } from "@/lib/youtube";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const resources = ["knowledge", "news", "profiles", "categories", "users", "admins"] as const;

function isResource(value: string): value is ResourceType {
  return resources.includes(value as ResourceType);
}

export async function GET(request: Request, { params }: { params: Promise<{ resource: string }> }) {
  const { resource } = await params;
  if (!isResource(resource)) return Response.json({ error: "Unknown resource" }, { status: 404 });
  const denied = assertAdminRequest(request, resource);
  if (denied) return denied;
  const items = await listResource(resource);
  if (resource === "categories") {
    const session = getAdminSession(request);
    return Response.json({
      items: session?.role === "Admin" ? items : items.filter((item) => (item as Record<string, unknown>).level !== "secret"),
    });
  }
  return Response.json({ items });
}

export async function POST(request: Request, { params }: { params: Promise<{ resource: string }> }) {
  const { resource } = await params;
  if (!isResource(resource)) return Response.json({ error: "Unknown resource" }, { status: 404 });
  const session = getAdminSession(request);
  const denied = assertAdminRequest(request, resource);
  if (denied) return denied;
  const payload = await request.json();
  const previous = (await listResource(resource)).find((row) => String((row as Record<string, unknown>).id) === String(payload.id));
  if (resource === "categories" && (previous as Record<string, unknown> | undefined)?.level === "secret" && session?.role !== "Admin") {
    return Response.json({ error: "Admin role required for secret categories" }, { status: 403 });
  }
  let item: Record<string, unknown>;
  try {
    item = await normalizeAdminPayload(resource, payload, session?.role);
    if (resource === "categories") {
      const existing = (await listResource(resource)).find((row) => String((row as Record<string, unknown>).name ?? "").trim().toLowerCase() === String(item.name ?? "").trim().toLowerCase());
      if (existing) {
        item.id = String((existing as Record<string, unknown>).id);
        item.createdAt = String((existing as Record<string, unknown>).createdAt ?? item.createdAt);
      }
    }
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Invalid content" }, { status: 400 });
  }
  const saved = await upsertResource(resource, item);
  await writeAuditLog({
    actor: request.headers.get("x-admin-name") ?? session?.role ?? "admin",
    role: "admin",
    action: auditAction(previous as Record<string, unknown> | undefined, item),
    resource: `${resource}:${displayResource(item)}`,
  });
  return Response.json({ item: saved });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ resource: string }> }) {
  const { resource } = await params;
  if (!isResource(resource)) return Response.json({ error: "Unknown resource" }, { status: 404 });
  const session = getAdminSession(request);
  const denied = assertAdminRequest(request, resource);
  if (denied) return denied;
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return Response.json({ error: "Missing id" }, { status: 400 });
  if (resource === "categories" && session?.role !== "Admin") {
    const item = (await listResource(resource)).find((row) => String((row as Record<string, unknown>).id) === id) as Record<string, unknown> | undefined;
    if (item?.level === "secret") {
      return Response.json({ error: "Admin role required for secret categories" }, { status: 403 });
    }
  }
  const deleted = await deleteResource(resource, id);
  await writeAuditLog({ actor: request.headers.get("x-admin-name") ?? session?.role ?? "admin", role: "admin", action: "delete", resource: `${resource}:${id}` });
  return Response.json({ deleted });
}

async function normalizeAdminPayload(resource: ResourceType, item: Record<string, unknown>, role?: string) {
  const now = new Date().toISOString();
  const next: Record<string, unknown> = {
    ...item,
    id: String(item.id ?? `${resource}-${crypto.randomUUID()}`),
    updatedAt: now,
    createdAt: item.createdAt ? String(item.createdAt) : now,
  };
  if (resource === "knowledge") {
    const youtubeUrl = String(next.youtubeUrl ?? "");
    next.youtubeId = String(next.youtubeId || getYouTubeId(youtubeUrl));
    next.thumbnail = next.thumbnail || getYouTubeThumbnail(youtubeUrl);
    next.viewCount = Number(next.viewCount ?? 0);
    next.uploadDate = String(next.uploadDate || now.slice(0, 10));
  }
  if (resource === "admins") {
    next.role = normalizeAdminRole(next.role);
  }
  if (resource === "categories") {
    next.name = String(next.name ?? "").trim();
    next.active = next.active !== false;
    next.level = role === "Admin" && next.level === "secret" ? "secret" : "public";
  }
  if (resource === "users" || resource === "admins") {
    if (role !== "Admin") delete next.active;
    else next.active = next.active !== false;
  }
  if (resource === "knowledge" || resource === "news" || resource === "profiles") {
    const publishError = validatePublishWindow(String(next.publishTime || ""), String(next.publishUntil || ""));
    if (publishError) throw new Error(publishError);
    next.status = computeContentStatus({
      status: String(next.status || "draft") as never,
      publishTime: String(next.publishTime || ""),
      publishUntil: String(next.publishUntil || ""),
    });
    return applyPublishWindow(next as never);
  }
  return next;
}

function auditAction(previous: Record<string, unknown> | undefined, next: Record<string, unknown>) {
  if (!previous) return "create";
  if (previous.status !== next.status && next.status === "published") return "publish";
  if (previous.status !== next.status && next.status === "unpublished") return "unpublish";
  if (previous.active !== next.active && next.active === true) return "activate";
  if (previous.active !== next.active && next.active === false) return "deactivate";
  return "edit";
}

function displayResource(item: Record<string, unknown>) {
  return String(item.title ?? item.name ?? item.email ?? item.id);
}
