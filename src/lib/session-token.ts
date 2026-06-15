import { createHmac, timingSafeEqual } from "node:crypto";
import type { AdminRole, Membership } from "./types";

type UserSessionPayload = {
  kind: "user";
  id: string;
  membership: Membership;
  exp: number;
};

type AdminSessionPayload = {
  kind: "admin";
  id: string;
  role: AdminRole;
  exp: number;
};

export type SessionPayload = UserSessionPayload | AdminSessionPayload;

const dayMs = 24 * 60 * 60 * 1000;

function secret() {
  return process.env.APP_SECRET || process.env.GOOGLE_PRIVATE_KEY || "v2g-km-local-secret";
}

function encode(value: unknown) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function sign(body: string) {
  return createHmac("sha256", secret()).update(body).digest("base64url");
}

export function createUserToken(input: Omit<UserSessionPayload, "kind" | "exp">) {
  return createToken({ ...input, kind: "user", exp: Date.now() + dayMs } satisfies UserSessionPayload);
}

export function createAdminToken(input: Omit<AdminSessionPayload, "kind" | "exp">) {
  return createToken({ ...input, kind: "admin", exp: Date.now() + 2 * 60 * 60 * 1000 } satisfies AdminSessionPayload);
}

function createToken(payload: SessionPayload) {
  const body = encode(payload);
  return `${body}.${sign(body)}`;
}

export function verifyToken(token?: string | null): SessionPayload | null {
  if (!token) return null;
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;
  const expected = sign(body);
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) return null;
  const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as SessionPayload;
  if (!payload.exp || payload.exp < Date.now()) return null;
  return payload;
}

export function getBearerToken(request: Request) {
  const header = request.headers.get("authorization");
  return header?.startsWith("Bearer ") ? header.slice(7) : null;
}
