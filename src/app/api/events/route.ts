import { listSheet } from "@/lib/google-sheets";
import { applyPublishWindow } from "@/lib/publish";
import { getBearerToken, verifyToken } from "@/lib/session-token";
import { canAccess } from "@/lib/visibility";
import type { Event, News } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const THAI_MONTHS: Record<string, number> = {
  มกราคม: 1, กุมภาพันธ์: 2, มีนาคม: 3, เมษายน: 4,
  พฤษภาคม: 5, มิถุนายน: 6, กรกฎาคม: 7, สิงหาคม: 8,
  กันยายน: 9, ตุลาคม: 10, พฤศจิกายน: 11, ธันวาคม: 12,
};

function parseThaiDateText(value: string): { year: number; month: number; day: number } | null {
  const normalized = String(value ?? "").replace(/\u00a0/g, " ").trim();
  const match = normalized.match(/(\d{1,2})\s+([^\s]+)\s+(?:พ\.ศ\.\s*)?(\d{4})/);
  if (!match) return null;

  const day = Number(match[1]);
  const month = THAI_MONTHS[match[2]];
  const buddhistYear = Number(match[3]);
  const year = buddhistYear > 2400 ? buddhistYear - 543 : buddhistYear;
  if (!month || !Number.isFinite(day) || !Number.isFinite(year)) return null;
  return { year, month, day };
}

function parseTimeRangeStart(value: string): { hour: number; minute: number } {
  const match = String(value ?? "").match(/(\d{1,2})[.:](\d{2})/);
  if (!match) return { hour: 0, minute: 0 };
  return {
    hour: Number(match[1]),
    minute: Number(match[2]),
  };
}

function buildBangkokIso(year: number, month: number, day: number, hour = 0, minute = 0) {
  const utcMs = Date.UTC(year, month - 1, day, hour - 7, minute);
  return new Date(utcMs).toISOString();
}

function parseThaiDateFromBody(body: string): string | null {
  const m = body.match(/ที่\s*(\d{1,2})\s+([ก-๿]+)\s+(\d{4})/);
  if (!m) return null;
  const day = parseInt(m[1]);
  const month = THAI_MONTHS[m[2]];
  const buddhist = parseInt(m[3]);
  // Buddhist year (พ.ศ.) is CE + 543; valid range sanity check
  const year = buddhist > 2400 ? buddhist - 543 : buddhist;
  if (!month || year < 2020 || year > 2100 || day < 1 || day > 31) return null;

  const timeMatch = body.match(/เวลา\s*(\d{1,2})[\.:ก](\d{2})/);
  const hour = timeMatch ? parseInt(timeMatch[1]) : 0;
  const min = timeMatch ? parseInt(timeMatch[2]) : 0;

  // Build as local Thailand time (UTC+7)
  const utcMs = Date.UTC(year, month - 1, day, hour - 7, min);
  return new Date(utcMs).toISOString();
}

function newsToEvent(news: News): Event | null {
  const time = parseTimeRangeStart(news.eventTime ?? "");
  let startDate: string | null = null;

  if (news.eventDate) {
    if (news.eventDate.includes("T")) {
      startDate = news.eventDate;
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(news.eventDate)) {
      startDate = buildBangkokIso(
        Number(news.eventDate.slice(0, 4)),
        Number(news.eventDate.slice(5, 7)),
        Number(news.eventDate.slice(8, 10)),
        time.hour,
        time.minute,
      );
    } else {
      const parsedThaiDate = parseThaiDateText(news.eventDate);
      if (parsedThaiDate) {
        startDate = buildBangkokIso(parsedThaiDate.year, parsedThaiDate.month, parsedThaiDate.day, time.hour, time.minute);
      }
    }
  }

  if (!startDate) {
    startDate = parseThaiDateFromBody(news.body);
  }
  if (!startDate) return null;

  const cats = (Array.isArray(news.categories) ? news.categories : []).map((c) => String(c).toLowerCase());
  const eventType = cats.some((c) => c.includes("train"))
    ? "training"
    : cats.some((c) => c.includes("seminar"))
      ? "seminar"
      : cats.some((c) => c.includes("social"))
        ? "social"
        : "online";

  const zoom = /zoom/i.test(news.body);
  const location = news.eventChannel || (zoom ? "Zoom" : "");

  return {
    id: news.id,
    title: news.title,
    description: news.body,
    eventType,
    startDate,
    endDate: startDate,
    location,
    capacity: 0,
    images: news.images ?? [],
    visibility: news.visibility,
    status: news.status,
    pinned: Boolean((news as unknown as Record<string, unknown>).pinned),
    createdAt: news.createdAt,
    updatedAt: news.updatedAt,
  };
}

export async function GET(request: Request) {
  const session = verifyToken(getBearerToken(request));
  const membership = session?.kind === "user" ? session.membership : "general";

  const [events, newsItems] = await Promise.all([
    listSheet("events"),
    listSheet("news"),
  ]);

  const visibleEvents = events.filter(
    (e) => e.status === "published" && canAccess(membership, e.visibility),
  );

  const newsEvents: Event[] = newsItems
    .map((item) => applyPublishWindow(item))
    .filter((n) => n.status === "published" && canAccess(membership, n.visibility))
    .map(newsToEvent)
    .filter((e): e is Event => e !== null);

  // Merge: real events take priority; skip news items that share an id with a real event
  const allEvents = [...visibleEvents];
  const existingIds = new Set(visibleEvents.map((e) => e.id));
  for (const ne of newsEvents) {
    if (!existingIds.has(ne.id)) allEvents.push(ne);
  }

  const sorted = allEvents.sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return a.startDate.localeCompare(b.startDate);
  });

  return Response.json({ items: sorted }, { headers: { "Cache-Control": "private, max-age=30" } });
}
