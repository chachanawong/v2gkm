import { findBoUserById, listBoPaymentsByPhone } from "@/lib/bo-members";
import { getBearerToken, verifyToken } from "@/lib/session-token";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MEMBERSHIP_DURATION_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

function parseSheetDate(value?: string) {
  const text = String(value ?? "").trim();
  if (!text) return null;

  const isoMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    return new Date(Date.UTC(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3])));
  }

  const slashMatch = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (slashMatch) {
    const rawYear = Number(slashMatch[3]);
    const year = slashMatch[3].length === 2
      ? (rawYear > 50 ? rawYear + 2500 - 543 : rawYear + 2000)
      : (rawYear > 2400 ? rawYear - 543 : rawYear);
    return new Date(Date.UTC(year, Number(slashMatch[2]) - 1, Number(slashMatch[1])));
  }

  const dotMatch = text.match(/^(\d{1,2})\.(\d{1,2})\.(\d{2,4})$/);
  if (dotMatch) {
    const rawYear = Number(dotMatch[3]);
    const year = dotMatch[3].length === 2
      ? (rawYear > 50 ? rawYear + 2500 - 543 : rawYear + 2000)
      : (rawYear > 2400 ? rawYear - 543 : rawYear);
    return new Date(Date.UTC(year, Number(dotMatch[2]) - 1, Number(dotMatch[1])));
  }

  const fallback = new Date(text);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
}

function toIsoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export async function GET(request: Request) {
  const session = verifyToken(getBearerToken(request));
  if (!session || session.kind !== "user") {
    return Response.json({ error: "User session required" }, { status: 401 });
  }

  const user = await findBoUserById(session.id);
  if (!user?.phone) {
    return Response.json({ latestPaymentDate: null, expiryDate: null, daysRemaining: null });
  }

  const payments = await listBoPaymentsByPhone(user.phone);
  const latestPayment = payments
    .map((payment) => ({
      payment,
      parsedDate: parseSheetDate(payment.date || payment.createdAt),
    }))
    .filter((item): item is { payment: (typeof payments)[number]; parsedDate: Date } => item.parsedDate !== null)
    .sort((left, right) => right.parsedDate.getTime() - left.parsedDate.getTime())[0];

  if (!latestPayment) {
    return Response.json({ latestPaymentDate: null, expiryDate: null, daysRemaining: null });
  }

  const latestPaymentDate = latestPayment.parsedDate;
  const expiryDate = new Date(latestPaymentDate.getTime() + MEMBERSHIP_DURATION_DAYS * DAY_MS);
  const now = new Date();
  const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const expiryUtc = Date.UTC(expiryDate.getUTCFullYear(), expiryDate.getUTCMonth(), expiryDate.getUTCDate());
  const daysRemaining = Math.ceil((expiryUtc - todayUtc) / DAY_MS);

  return Response.json({
    latestPaymentDate: toIsoDate(latestPaymentDate),
    expiryDate: toIsoDate(expiryDate),
    daysRemaining,
  });
}
