export interface RosterParticipant {
  initials: string;
  user_id: string;
  status: string;
}

export interface RosterPayload {
  total: number;
  ready: number;
  participants: RosterParticipant[];
}

export type RosterListener = (payload: RosterPayload) => void;

/**
 * Open an EventSource against the session status-stream and forward
 * roster-updated events. Returns a cleanup function.
 */
export function subscribeToRosterUpdates(
  sessionId: string,
  examCode: string,
  onRoster: RosterListener,
  onError?: (e: Event) => void,
): () => void {
  if (typeof window === "undefined" || !sessionId || !examCode) {
    return () => undefined;
  }

  const url = `/api/student/ielts/session/${encodeURIComponent(sessionId)}/status-stream?code=${encodeURIComponent(examCode)}`;
  const es = new EventSource(url);

  const handler = (event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data) as RosterPayload;
      onRoster(data);
    } catch {
      // ignore malformed payloads
    }
  };

  es.addEventListener("roster-updated", handler);
  if (onError) es.addEventListener("error", onError);

  return () => {
    es.removeEventListener("roster-updated", handler);
    if (onError) es.removeEventListener("error", onError);
    es.close();
  };
}
