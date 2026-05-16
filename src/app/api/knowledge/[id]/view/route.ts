import { listResource, upsertResource } from "@/lib/google-sheets";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!id) return Response.json({ error: "Missing knowledge id" }, { status: 400 });

  const rows = await listResource("knowledge");
  const item = rows.find((row) => String((row as Record<string, unknown>).id) === id) as Record<string, unknown> | undefined;
  if (!item) return Response.json({ error: "Knowledge not found" }, { status: 404 });

  const viewCount = Number(item.viewCount ?? 0) + 1;
  const saved = await upsertResource("knowledge", {
    ...item,
    viewCount,
    updatedAt: new Date().toISOString(),
  });

  return Response.json({ viewCount, item: saved });
}
