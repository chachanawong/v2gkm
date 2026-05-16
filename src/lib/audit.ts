import { upsertSheet } from "./google-sheets";
import type { AuditLog } from "./types";

export async function writeAuditLog(input: Omit<AuditLog, "id" | "at">) {
  const log: AuditLog = {
    ...input,
    id: `log-${crypto.randomUUID()}`,
    at: new Date().toISOString(),
  };
  await upsertSheet("audit_logs", log);
  return log;
}
