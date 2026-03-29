// import { auth0 } from "@/lib/auth0";
// import { NextRequest, NextResponse } from "next/server";

// export const GET = async (request: NextRequest) => {
//   try {
//     const session = await auth0.getSession(request);

//     if (!session) {
//       return NextResponse.json({ error: "No session found" }, { status: 401 });
//     }

//     const accessToken = session?.tokenSet?.accessToken || null;
//     const idToken = session?.tokenSet?.idToken || null;

//     return NextResponse.json({ accessToken, idToken });
//   } catch (error: unknown) {
//     let message = "Unknown error";
//     let status = 500;

//     if (error instanceof Error) {
//       message = error.message;

//       const maybeWithStatus = error as Partial<{ status: number }>;
//       if (typeof maybeWithStatus.status === "number") {
//         status = maybeWithStatus.status;
//       }
//     }

//     console.error("❌ Failed to fetch token:", error);
//     return NextResponse.json({ error: message }, { status });
//   }
// };


import { auth0 } from "@/lib/auth0";
import { NextResponse } from "next/server";

export const GET = async () => {
  try {
    const session = await auth0.getSession();

    if (!session) {
      return NextResponse.json({ error: "No session found" }, { status: 401 });
    }

    const accessToken = session.tokenSet?.accessToken || session.accessToken || null;
    const idToken = session.tokenSet?.idToken || session.idToken || null;

    if (!accessToken) {
      return NextResponse.json({ error: "Token expired" }, { status: 401 });
    }

    return NextResponse.json({ accessToken, idToken });
  } catch (error: unknown) {
    // Expired JWT or session errors → 401 so the client redirects to login
    const isAuthError =
      error instanceof Error &&
      (error.name === "JWTExpired" ||
        (error as { code?: string }).code === "ERR_JWE_DECRYPTION_FAILED" ||
        error.message?.includes("exp") ||
        error.message?.includes("timestamp check failed") ||
        error.message?.includes("decryption") ||
        error.message?.includes("session"));

    if (isAuthError) {
      return NextResponse.json({ error: "Session expired" }, { status: 401 });
    }

    console.error("Failed to fetch token:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    );
  }
};