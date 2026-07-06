import { createSign } from "node:crypto";

const tokenCache = new Map<string, { token: string; expiresAt: number }>();

export function hasGoogleServiceAccountConfig() {
  return Boolean(process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY);
}

export async function getGoogleAccessToken(scopes: string[]) {
  const scope = [...scopes].sort().join(" ");
  const cached = tokenCache.get(scope);
  if (cached && cached.expiresAt > Date.now() + 60_000) return cached.token;

  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = base64url(
    JSON.stringify({
      iss: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      scope,
      aud: "https://oauth2.googleapis.com/token",
      exp: now + 3600,
      iat: now,
    }),
  );
  const unsigned = `${header}.${claim}`;
  const signer = createSign("RSA-SHA256");
  signer.update(unsigned);
  const signature = signer.sign(process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n") ?? "", "base64url");

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${unsigned}.${signature}`,
    }),
  });
  if (!response.ok) throw new Error(`Google auth failed: ${await response.text()}`);
  const data = (await response.json()) as { access_token: string; expires_in: number };
  const next = { token: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
  tokenCache.set(scope, next);
  return next.token;
}

function base64url(input: string | Buffer) {
  return Buffer.from(input).toString("base64url");
}
