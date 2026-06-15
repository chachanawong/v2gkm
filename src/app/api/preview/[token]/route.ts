import { findContent } from "@/lib/content";
import { listSheet } from "@/lib/google-sheets";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const tokens = await listSheet("preview_tokens");
  const preview = tokens.find((item) => item.token === token && new Date(item.expiresAt) > new Date());
  if (!preview) return Response.json({ error: "Invalid preview token" }, { status: 404 });
  const item = preview.data ?? await findContent(preview.resourceType, preview.resourceId);
  return Response.json({ item, preview });
}
