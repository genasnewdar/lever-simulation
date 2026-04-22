import { NextRequest, NextResponse } from "next/server";
import { auth0 } from "./lib/auth0";

// Public paths — no Auth0 required (exam code-based access)
const PUBLIC_PATHS = [
  "/ielts/mock-exam",
  "/ielts/waiting",
  "/ielts/take-test",
  "/ielts/results",
];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public exam pages — pass through, no Auth0
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  let authRes: NextResponse;
  try {
    authRes = await auth0.middleware(request);
  } catch (err: unknown) {
    const { origin } = new URL(request.url);
    const isAuthError =
      err instanceof Error &&
      (err.name === "JWTExpired" ||
        (err as { code?: string }).code === "ERR_JWE_DECRYPTION_FAILED" ||
        err.message?.includes("exp") ||
        err.message?.includes("timestamp check failed") ||
        err.message?.includes("decryption"));
    if (isAuthError) {
      const res = NextResponse.redirect(`${origin}/auth/logout?returnTo=/auth/login`);
      // Clear the corrupted session cookie
      res.cookies.delete("appSession");
      return res;
    }
    throw err;
  }

  // authentication routes — let the middleware handle it
  if (pathname.startsWith("/auth")) {
    return authRes;
  }

  const { origin } = new URL(request.url);
  let session;
  try {
    session = await auth0.getSession(request);
  } catch (getSessionErr: unknown) {
    const isAuthError =
      getSessionErr instanceof Error &&
      (getSessionErr.name === "JWTExpired" ||
        (getSessionErr as { code?: string }).code === "ERR_JWE_DECRYPTION_FAILED" ||
        (getSessionErr.message?.includes("exp") ?? false) ||
        (getSessionErr.message?.includes("timestamp check failed") ?? false) ||
        (getSessionErr.message?.includes("decryption") ?? false));
    if (isAuthError) {
      const res = NextResponse.redirect(`${origin}/auth/logout?returnTo=/auth/login`);
      res.cookies.delete("appSession");
      return res;
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
