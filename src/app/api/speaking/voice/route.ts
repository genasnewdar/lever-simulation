import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/speaking/voice?src=<cdn url>
 *
 * Serves the examiner's synthesised audio from our own origin.
 *
 * The files live on the Bunny CDN, which sends no `Access-Control-Allow-Origin`,
 * so a cross-origin `fetch` from the session page is blocked — and the session
 * needs the actual bytes, not just playback, to decode them and drive the orb
 * from the real waveform. Going through here sidesteps CORS entirely, and
 * corrects the `application/octet-stream` the CDN labels them with.
 */

/** Bunny pull zones only. Never let this become a fetcher for arbitrary URLs. */
const ALLOWED_HOST_SUFFIX = ".b-cdn.net";
/** The content-addressed names `SpeakingTtsService` writes, and nothing else. */
const VOICE_PATH = /^\/speaking-tts\/[a-f0-9]{32}\.wav$/;

export async function GET(req: NextRequest) {
  const src = req.nextUrl.searchParams.get("src");
  if (!src) {
    return NextResponse.json({ error: "src is required" }, { status: 400 });
  }

  let target: URL;
  try {
    target = new URL(src);
  } catch {
    return NextResponse.json({ error: "src is not a URL" }, { status: 400 });
  }

  if (
    target.protocol !== "https:" ||
    !target.hostname.endsWith(ALLOWED_HOST_SUFFIX) ||
    !VOICE_PATH.test(target.pathname)
  ) {
    return NextResponse.json(
      { error: "Not an examiner audio URL" },
      { status: 400 },
    );
  }

  let upstream: Response;
  try {
    upstream = await fetch(target, { cache: "force-cache" });
  } catch {
    return NextResponse.json({ error: "Audio unreachable" }, { status: 502 });
  }

  if (!upstream.ok || !upstream.body) {
    return NextResponse.json(
      { error: "Audio unavailable" },
      { status: upstream.status === 404 ? 404 : 502 },
    );
  }

  return new NextResponse(upstream.body, {
    headers: {
      "Content-Type": "audio/wav",
      // The name is a hash of the audio, so these bytes can never change.
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
