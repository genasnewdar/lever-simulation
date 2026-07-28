import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * POST /api/speaking/verify-code
 * Body: { code: string }
 *
 * Resolves a simulation code to an attempt for the standalone speaking flow.
 * Proxies to the same public backend endpoint the exam uses, but lives on its
 * own path so /speaking never depends on the exam flow's route.
 */
export async function POST(req: NextRequest) {
  try {
    const { code } = (await req.json()) as { code?: string };

    if (!code) {
      return NextResponse.json(
        { error: "Simulation code is required" },
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

    // A code awaiting an admin-started session has no attempt yet. Speaking is
    // self-serve, so there is nothing to wait for — report it as not ready.
    if (!data.attempt_id) {
      return NextResponse.json(
        {
          error: "NO_ATTEMPT",
          message:
            "Энэ код хараахан идэвхжээгүй байна. Шалгалт эхлэхийг хүлээнэ үү.",
        },
        { status: 409 },
      );
    }

    return NextResponse.json({
      attempt_id: data.attempt_id,
      student_name: data.student_name ?? null,
      test_title: data.test_title ?? null,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to verify simulation code" },
      { status: 500 },
    );
  }
}
