import { AuthClient } from "@auth0/nextjs-auth0/server";
import { NextRequest, NextResponse } from "next/server";

// Lazy-init so Vercel build doesn't fail when env vars are not set at build time
let _client: AuthClient | null = null;

function getClient(): AuthClient {
  if (_client) return _client;
  const domain = process.env.AUTH0_DOMAIN;
  const clientId = process.env.AUTH0_CLIENT_ID;
  const appBaseUrl = process.env.APP_BASE_URL;
  const secret = process.env.AUTH0_SECRET;
  if (!domain || !clientId || !appBaseUrl || !secret) {
    throw new Error(
      "Auth0 env vars missing (AUTH0_DOMAIN, AUTH0_CLIENT_ID, APP_BASE_URL, AUTH0_SECRET)"
    );
  }
  _client = new AuthClient({
    domain,
    clientId,
    clientSecret: process.env.AUTH0_CLIENT_SECRET,
    appBaseUrl,
    secret,
    authorizationParameters: {
      scope: process.env.AUTH0_SCOPE ?? "openid profile email",
      audience: process.env.AUTH0_AUDIENCE ?? "",
    },
    session: {
      cookie: { transient: false },
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- AuthClientOptions expects store types; SDK accepts partial
  } as any);
  return _client;
}

export const GET = async (
  req: NextRequest,
  { params }: { params: Promise<{ auth0: string }> }
) => {
  const { auth0: auth0Segment } = await params;

  try {
    const client = getClient();
    if (auth0Segment === "login") return client.handleLogin(req);
    if (auth0Segment === "logout") return client.handleLogout(req);
    if (auth0Segment === "callback") return client.handleCallback(req);
  } catch (err) {
    console.error("Auth route error:", err);
    return NextResponse.json(
      { error: "Auth not configured or env vars missing" },
      { status: 503 }
    );
  }

  return NextResponse.json({ error: "Not found" }, { status: 404 });
};
