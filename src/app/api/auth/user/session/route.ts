import { findBoUserById } from "@/lib/bo-members";
import { createUserToken, getBearerToken, verifyToken } from "@/lib/session-token";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = verifyToken(getBearerToken(request));
  if (!session || session.kind !== "user") {
    return Response.json({ error: "User session required" }, { status: 401 });
  }

  const user = await findBoUserById(session.id);
  if (!user || user.active === false) {
    return Response.json({ error: "User not found" }, { status: 401 });
  }

  return Response.json({
    user,
    token: createUserToken({ id: user.id, membership: user.membership }),
  });
}
