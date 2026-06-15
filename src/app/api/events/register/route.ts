import { listSheet, upsertSheet } from "@/lib/google-sheets";
import { getBearerToken, verifyToken } from "@/lib/session-token";
import type { EventRegistration } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = verifyToken(getBearerToken(request));
  if (!session || session.kind !== "user") {
    return Response.json({ error: "Login required" }, { status: 401 });
  }

  const { eventId } = await request.json() as { eventId?: string };
  if (!eventId) return Response.json({ error: "Missing eventId" }, { status: 400 });

  const [events, registrations] = await Promise.all([
    listSheet("events"),
    listSheet("event_registrations"),
  ]);

  const event = events.find((e) => e.id === eventId);
  if (!event || event.status !== "published") {
    return Response.json({ error: "Event not found" }, { status: 404 });
  }

  const existing = registrations.find(
    (r) => r.eventId === eventId && r.userId === session.id && r.status !== "cancelled",
  );
  if (existing) return Response.json({ error: "Already registered" }, { status: 409 });

  const confirmed = registrations.filter((r) => r.eventId === eventId && r.status !== "cancelled").length;
  if (event.capacity > 0 && confirmed >= event.capacity) {
    return Response.json({ error: "Event is full" }, { status: 409 });
  }

  const reg: EventRegistration = {
    id: `reg-${Date.now()}`,
    eventId,
    userId: session.id,
    userName: session.id,
    userPhone: "",
    status: "confirmed",
    createdAt: new Date().toISOString(),
  };
  await upsertSheet("event_registrations", reg);
  return Response.json({ registration: reg });
}

export async function DELETE(request: Request) {
  const session = verifyToken(getBearerToken(request));
  if (!session || session.kind !== "user") {
    return Response.json({ error: "Login required" }, { status: 401 });
  }
  const { eventId } = await request.json() as { eventId?: string };
  if (!eventId) return Response.json({ error: "Missing eventId" }, { status: 400 });

  const registrations = await listSheet("event_registrations");
  const reg = registrations.find(
    (r) => r.eventId === eventId && r.userId === session.id && r.status !== "cancelled",
  );
  if (!reg) return Response.json({ error: "Not registered" }, { status: 404 });

  await upsertSheet("event_registrations", { ...reg, status: "cancelled" });
  return Response.json({ ok: true });
}
