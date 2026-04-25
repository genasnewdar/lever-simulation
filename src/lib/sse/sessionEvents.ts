export type SessionEventListener = (data: { reason?: string }) => void;

/**
 * Subscribe to session-cancelled SSE events for the given session.
 * Returns a cleanup function. Auth via ?code= query string.
 */
export function subscribeToSessionCancelled(
  sessionId: string,
  examCode: string,
  onCancelled: SessionEventListener,
): () => void {
  if (typeof window === "undefined" || !sessionId || !examCode) {
    return () => undefined;
  }

  const url = `/api/student/ielts/session/${encodeURIComponent(sessionId)}/status-stream?code=${encodeURIComponent(examCode)}`;
  const es = new EventSource(url);

  const handler = (event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data) as { reason?: string };
      onCancelled(data || {});
    } catch {
      onCancelled({});
    }
  };

  // Backend uses underscore: session_cancelled
  es.addEventListener("session_cancelled", handler);

  return () => {
    es.removeEventListener("session_cancelled", handler);
    es.close();
  };
}
