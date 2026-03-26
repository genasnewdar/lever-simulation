import { NextRequest, NextResponse } from "next/server";
import { auth0 } from "./lib/auth0";

export async function middleware(request: NextRequest) {
  let authRes: NextResponse;
  try {
    authRes = await auth0.middleware(request);
  } catch (err: unknown) {
    const { origin } = new URL(request.url);
    const isJwtExpired =
      err instanceof Error &&
      (err.name === "JWTExpired" ||
        err.message?.includes("exp") ||
        err.message?.includes("timestamp check failed"));
    if (isJwtExpired) {
      return NextResponse.redirect(`${origin}/auth/login`);
    }
    throw err;
  }

  // authentication routes — let the middleware handle it
  if (request.nextUrl.pathname.startsWith("/auth")) {
    return authRes;
  }

  const { origin } = new URL(request.url);
  let session;
  try {
    session = await auth0.getSession(request);
  } catch (getSessionErr: unknown) {
    const isJwtExpired =
      getSessionErr instanceof Error &&
      (getSessionErr.name === "JWTExpired" ||
        (getSessionErr.message?.includes("exp") ?? false) ||
        (getSessionErr.message?.includes("timestamp check failed") ?? false));
    if (isJwtExpired) {
      return NextResponse.redirect(`${origin}/auth/login`);
    }
    throw getSessionErr;
  }

  // user does not have a session — redirect to login
  if (!session) {
    return NextResponse.redirect(`${origin}/auth/login`);
  }

  return authRes;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|api).*)",
  ],
};
