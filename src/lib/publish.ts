import type { PublishFields, PublishStatus } from "./types";

export function computeContentStatus({
  status,
  publishTime,
  publishUntil,
  now = new Date(),
}: Pick<PublishFields, "status" | "publishTime" | "publishUntil"> & { now?: Date }): PublishStatus {
  const startsAt = parseDate(publishTime);
  const endsAt = parseDate(publishUntil);
  if (endsAt && endsAt <= now) return "unpublished";
  if (startsAt) return startsAt > now ? "scheduled" : "published";
  if (status === "draft") return "draft";
  if (status === "unpublished") return "unpublished";
  return "published";
}

export function resolvePublishStatus(item: PublishFields, now = new Date()): PublishStatus {
  return computeContentStatus({ status: item.status, publishTime: item.publishTime, publishUntil: item.publishUntil, now });
}

export function applyPublishWindow<T extends PublishFields>(item: T, now = new Date()): T {
  return { ...item, status: resolvePublishStatus(item, now) };
}

export function splitByStatus<T extends PublishFields>(items: T[]) {
  const applied = items.map((item) => applyPublishWindow(item));
  return {
    published: applied.filter((item) => item.status === "published"),
    scheduled: applied.filter((item) => item.status === "scheduled"),
    draft: applied.filter((item) => item.status === "draft"),
    unpublished: applied.filter((item) => item.status === "unpublished"),
  };
}

export function shouldPublishNow(publishTime?: string) {
  return !publishTime || new Date(publishTime) <= new Date();
}

export function validatePublishWindow(publishTime?: string, publishUntil?: string) {
  const startsAt = parseDate(publishTime);
  const endsAt = parseDate(publishUntil);
  if (publishUntil && !startsAt) return "Please choose publish time before publish until.";
  if (startsAt && endsAt && endsAt <= startsAt) return "Publish until must be after publish time.";
  return "";
}

function parseDate(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}
