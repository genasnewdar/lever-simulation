import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * POST /api/ielts/session-status
 * Body: { session_id: string, code: string }
 *
 * Proxies to backend POST /api/public/ielts/session/{session_id}/status
 * — authenticates with exam code, no Auth0 needed.
 */
export async function POST(req: NextRequest) {
  try {
    const { session_id, code } = (await req.json()) as {
      session_id?: string;
      code?: string;
    };

    if (!session_id || !code) {
      return NextResponse.json(
        { error: "session_id and code are required" },
        { status: 400 },
      );
    }

    const resp = await fetch(
      `${API_URL}/api/public/ielts/session/${session_id}/status`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      },
    );

    const data = await resp.json();
    if (!resp.ok) return NextResponse.json(data, { status: resp.status });
    return NextResponse.json(data);
  } catch (error) {
    console.error("session-status proxy error:", error);
    return NextResponse.json(
      { error: "Failed to fetch session status" },
      { status: 500 },
    );
  }
}
