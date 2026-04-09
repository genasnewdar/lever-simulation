import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * POST /api/ielts/verify-code
 * Body: { code: string }
 *
 * Proxies to backend POST /api/public/ielts/verify-code (public, no auth).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code } = body as { code?: string };

    if (!code) {
      return NextResponse.json(
        { error: "Exam code is required" },
        { status: 400 },
      );
    }

    const resp = await fetch(`${API_URL}/api/public/ielts/verify-code`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });

    const data = await resp.json();

    if (!resp.ok) {
      return NextResponse.json(data, { status: resp.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("verify-code proxy error:", error);
    return NextResponse.json(
      { error: "Failed to verify exam code" },
      { status: 500 },
    );
  }
}
