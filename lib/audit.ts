import { upsertSheet } from "./google-sheets";
import type { AuditLog } from "./types";

export async function writeAuditLog(input: Omit<AuditLog, "id" | "at">) {
  const log: AuditLog = {
    ...input,
    id: `log-${crypto.randomUUID()}`,
    at: new Date().toISOString(),
  };
  try {
    await upsertSheet("audit_logs", log);
  } catch (error) {
    console.error("[audit] failed to persist audit log:", error);
  }
  return log;
}
