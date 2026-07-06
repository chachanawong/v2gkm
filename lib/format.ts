export function maskPhone(phone?: string) {
  const raw = String(phone ?? "").trim();
  const parsed = raw.replace(/\D/g, "");
  const digits = parsed.length === 9 ? `0${parsed}` : parsed;
  if (digits.length !== 10) return digits;
  return `${digits.slice(0, 3)}-xxx-${digits.slice(-4)}`;
}
