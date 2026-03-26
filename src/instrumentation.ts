export async function register() {
  // #region agent log
  fetch("http://127.0.0.1:7242/ingest/87e17faa-e1b3-4beb-9e9b-0e6e457789cc", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      location: "lever-offline/src/instrumentation.ts:register",
      message: "Next.js app starting",
      data: {
        defaultDevBind: "127.0.0.1",
        note: "next dev without -H binds to localhost only; LAN access needs -H 0.0.0.0",
      },
      timestamp: Date.now(),
      sessionId: "debug-session",
      hypothesisId: "H1",
    }),
  }).catch(() => {});
  // #endregion
}
