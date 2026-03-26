import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const SYSTEM_API_KEY = process.env.SYSTEM_API_KEY || "";

/**
 * POST /api/ielts/finish-section
 * Body: { attempt_id: string, section: "listening" | "reading" | "writing" }
 *
 * Proxies to backend finish-{section} endpoint with SYSTEM_API_KEY.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { attempt_id, section } = body as {
      attempt_id?: string;
      section?: string;
    };

    if (!attempt_id || !section) {
      return NextResponse.json(
        { error: "attempt_id and section are required" },
        { status: 400 },
      );
    }

    const validSections = ["listening", "reading", "writing"];
    if (!validSections.includes(section)) {
      return NextResponse.json(
        { error: `Invalid section: ${section}` },
        { status: 400 },
      );
    }

    const res = await fetch(
      `${API_URL}/api/system/ielts/finish-${section}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": SYSTEM_API_KEY,
        },
        body: JSON.stringify({ attempt_id }),
      },
    );

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("finish-section proxy error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
