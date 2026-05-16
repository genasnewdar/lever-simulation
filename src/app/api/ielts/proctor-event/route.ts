import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * POST /api/ielts/proctor-event
 * Body: { code, attempt_id, event_type, message? }
 *
 * Proxies to backend POST /api/public/ielts/proctor-event.
 * Public — auth is the exam code itself.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const resp = await fetch(`${API_URL}/api/public/ielts/proctor-event`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
    const data = await resp.json().catch(() => ({}));
    return NextResponse.json(data, { status: resp.status });
  } catch (err) {
    return NextResponse.json(
      { error: "proxy_failed", detail: String(err) },
      { status: 500 },
    );
  }
}
