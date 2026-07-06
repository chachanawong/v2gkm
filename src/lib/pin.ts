import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const HASH_VERSION = "s1";
const KEY_LENGTH = 64;

function pinPepper() {
  return process.env.PIN_HASH_PEPPER || process.env.GOOGLE_SCRIPT_SECRET || process.env.APP_SECRET || "v2g-local-pin-pepper";
}

function normalizePhone(value: string) {
  return String(value ?? "").replace(/\D/g, "").replace(/^0+/, "");
}

function normalizePin(value: string) {
  return String(value ?? "").trim();
}

function buildSecret(pin: string, phone: string) {
  return `${normalizePin(pin)}:${normalizePhone(phone)}:${pinPepper()}`;
}

export function hashPin(pin: string, phone: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(buildSecret(pin, phone), salt, KEY_LENGTH).toString("hex");
  return `${HASH_VERSION}$${salt}$${hash}`;
}

export function verifyPin(pin: string, phone: string, storedHash?: string | null) {
  if (!storedHash) return false;
  const [version, salt, expectedHex] = String(storedHash).split("$");
  if (version !== HASH_VERSION || !salt || !expectedHex) return false;
  const expected = Buffer.from(expectedHex, "hex");
  const actual = scryptSync(buildSecret(pin, phone), salt, expected.length);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
