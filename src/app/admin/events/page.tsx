import { AdminResourceManager } from "@/components/admin/AdminResourceManager";
import { LineBroadcastPanel } from "@/components/admin/LineBroadcastPanel";
import { AdminShell } from "@/components/shared/AdminShell";
import { Badge } from "@/components/ui/Badge";
import { batchListSheets } from "@/lib/google-sheets";
import type { Event, EventRegistration } from "@/lib/types";

export default async function AdminEventsPage() {
  const data = await batchListSheets(["events", "event_registrations"]) as {
    events: Event[];
    event_registrations: EventRegistration[];
  };

  return (
    <AdminShell allowed={["Admin", "Content"]}>
      <AdminResourceManager
        title="Events"
        resource="events"
        items={data.events}
        fields={[
          { key: "title", label: "Title" },
          { key: "description", label: "Description", type: "textarea" },
          { key: "eventType", label: "Type", type: "select", options: ["seminar", "training", "social", "online"] },
          { key: "startDate", label: "Start Date", type: "datetime-local" },
          { key: "endDate", label: "End Date", type: "datetime-local" },
          { key: "location", label: "Location" },
          { key: "capacity", label: "Capacity (seats)" },
          { key: "images", label: "Images" },
          { key: "visibility", label: "Visibility", type: "select" },
          { key: "pinned", label: "Pinned", type: "checkbox" },
        ]}
      />
      <RegistrationsPanel events={data.events} registrations={data.event_registrations} />
      <LineBroadcastPanel events={data.events} hasToken={Boolean(process.env.LINE_CHANNEL_ACCESS_TOKEN)} />
    </AdminShell>
  );
}

function RegistrationsPanel({ events, registrations }: { events: Event[]; registrations: EventRegistration[] }) {
  if (!registrations.length) return null;

  const eventMap = new Map(events.map((e) => [e.id, e.title]));
  const grouped = new Map<string, EventRegistration[]>();
  registrations.forEach((r) => {
    const existing = grouped.get(r.eventId) ?? [];
    existing.push(r);
    grouped.set(r.eventId, existing);
  });

  return (
    <section className="admin-section" style={{ marginTop: 32 }}>
      <div className="section-head">
        <div>
          <p className="eyebrow">Events</p>
          <h1>Registrations</h1>
        </div>
      </div>
      {[...grouped.entries()].map(([eventId, regs]) => (
        <div className="list-panel" key={eventId}>
          <h2>{eventMap.get(eventId) ?? eventId} <span style={{ fontWeight: 400, fontSize: 13 }}>({regs.length} คน)</span></h2>
          <div className="admin-list">
            {regs.map((r) => (
              <div className="admin-row" key={r.id}>
                <div className="row-summary row-summary-table" style={{ gridTemplateColumns: "2fr 1.5fr 1fr" }}>
                  <strong data-label="Name">{r.userName}</strong>
                  <span data-label="Phone">{r.userPhone}</span>
                  <span data-label="Registered">{r.createdAt?.slice(0, 10)}</span>
                </div>
                <Badge tone={r.status === "confirmed" ? "green" : r.status === "cancelled" ? "neutral" : "amber"}>
                  {r.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
