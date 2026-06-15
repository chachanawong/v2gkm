import { assertAdminRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const denied = assertAdminRequest(request);
  if (denied) return denied;

  const body = await request.json() as {
    groupId?: string;
    message: string;
  };

  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  const groupId = body.groupId?.trim() || process.env.LINE_GROUP_ID;

  if (!token) return Response.json({ error: "LINE_CHANNEL_ACCESS_TOKEN not configured" }, { status: 503 });
  if (!groupId) return Response.json({ error: "Group ID required" }, { status: 400 });
  if (!body.message?.trim()) return Response.json({ error: "Message is required" }, { status: 400 });

  const res = await fetch("https://api.line.me/v2/bot/message/push", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      to: groupId,
      messages: [{ type: "text", text: body.message.trim() }],
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    return Response.json({ error: `LINE API error ${res.status}: ${detail}` }, { status: 502 });
  }

  return Response.json({ ok: true });
}
