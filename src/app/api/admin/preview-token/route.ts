import { assertAdminRequest } from "@/lib/auth";
import { upsertSheet } from "@/lib/google-sheets";
import type { PreviewToken } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const denied = assertAdminRequest(request);
  if (denied) return denied;
  const { resourceType, resourceId, data } = await request.json();
  if (resourceType !== "knowledge" && resourceType !== "news" && resourceType !== "profiles") {
    return Response.json({ error: "Invalid preview type" }, { status: 400 });
  }
  const token: PreviewToken = {
    token: crypto.randomUUID(),
    resourceType,
    resourceId,
    expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    data: data && typeof data === "object" ? data : undefined,
  };
  await upsertSheet("preview_tokens", token);
  return Response.json({ token, url: `/preview/${token.token}` });
}
