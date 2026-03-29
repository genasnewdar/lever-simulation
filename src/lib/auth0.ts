// src/lib/auth0.ts – lazy init so build (e.g. on Vercel) doesn't fail when env vars are missing
import { Auth0Client, AuthClient } from "@auth0/nextjs-auth0/server";
import { NextRequest } from "next/server";

let _client: Auth0Client | null = null;

function getClient(): Auth0Client | null {
  if (_client) return _client;
  const domain = process.env.AUTH0_DOMAIN;
  const clientId = process.env.AUTH0_CLIENT_ID;
  const appBaseUrl = process.env.APP_BASE_URL;
  const secret = process.env.AUTH0_SECRET;
  if (!domain || !clientId || !appBaseUrl || !secret) return null;
  _client = new Auth0Client({
    domain,
    clientId,
    clientSecret: process.env.AUTH0_CLIENT_SECRET,
    appBaseUrl,
    secret,
    authorizationParameters: {
      scope: process.env.AUTH0_SCOPE ?? "openid profile email",
      audience: process.env.AUTH0_AUDIENCE ?? "",
    },
  });
  return _client;
}

/** Access the internal AuthClient which exposes handleLogin/Logout/Callback */
function getAuthClient(): AuthClient | null {
  const client = getClient();
  if (!client) return null;
  return (client as unknown as { authClient: AuthClient }).authClient;
}

export const auth0 = {
  async getSession(req?: NextRequest) {
    const client = getClient();
    if (!client) return null;
    return req ? client.getSession(req) : client.getSession();
  },
  async handleLogin(...args: Parameters<AuthClient["handleLogin"]>) {
    const ac = getAuthClient();
    if (!ac) return new Response("Auth not configured", { status: 503 });
    return ac.handleLogin(...args);
  },
  async handleLogout(...args: Parameters<AuthClient["handleLogout"]>) {
    const ac = getAuthClient();
    if (!ac) return new Response("Auth not configured", { status: 503 });
    return ac.handleLogout(...args);
  },
  async handleCallback(...args: Parameters<AuthClient["handleCallback"]>) {
    const ac = getAuthClient();
    if (!ac) return new Response("Auth not configured", { status: 503 });
    return ac.handleCallback(...args);
  },
  async middleware(req: NextRequest) {
    const client = getClient();
    if (!client) {
      const { NextResponse } = await import("next/server");
      return NextResponse.next();
    }
    return client.middleware(req);
  },
};
