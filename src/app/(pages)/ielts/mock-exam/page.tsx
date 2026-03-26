"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "react-toastify";
import { CheckCircle2, Loader2, AlertTriangle, Maximize } from "lucide-react";

import { useMockExamStore } from "@/lib/stores/mock-exam-store";
import { api } from "@/lib";

interface SessionEntry {
  session_id: string;
  session_code: string;
  test_id: string;
  test_title: string;
  session_status: string;
  my_status: string;
  attempt_id: string | null;
  can_take_test: boolean;
}

export default function IeltsMockExamPage() {
  const router = useRouter();
  const {
    code,
    setCode,
    status,
    setStatus,
    sessionId,
    setSessionId,
    setTestId,
    setAttemptId,
    reset,
  } = useMockExamStore();
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // ── On reload: verify persisted session is still active, redirect if STARTED ──
  useEffect(() => {
    if (!isHydrated || !sessionId) return;
    if (status !== "ready" && status !== "started") return;

    let cancelled = false;
    const verifyAndRedirect = async () => {
      try {
        const response = await api.get(
          "/api/student/ielts/session/my-sessions",
        );
        if (cancelled) return;
        const sessions: SessionEntry[] = response.data?.sessions;
        if (!sessions || !Array.isArray(sessions)) {
          reset();
          return;
        }

        // FIX 3: Match by session_id, not test_id
        const mySession = sessions.find((s) => s.session_id === sessionId);

        if (!mySession) {
          reset();
          return;
        }

        const sessionStatus = mySession.session_status.toUpperCase();
        if (
          sessionStatus === "FINISHED" ||
          sessionStatus === "COMPLETED" ||
          sessionStatus === "CANCELLED"
        ) {
          reset();
          return;
        }

        if (sessionStatus === "STARTED" && mySession.attempt_id) {
          setAttemptId(mySession.attempt_id);
          setTestId(mySession.test_id);
          // URL uses attempt_id — take-test page resolves test content via attempt
          router.push(`/ielts/take-test/${mySession.attempt_id}`);
        }
      } catch {
        if (!cancelled) reset();
      }
    };
    verifyAndRedirect();
    return () => {
      cancelled = true;
    };
  }, [isHydrated, status, sessionId, router, reset, setAttemptId, setTestId]);

  // ── Fullscreen ──
  const toggleFullscreen = useCallback(async () => {
    if (!document.fullscreenElement) {
      try {
        await document.documentElement.requestFullscreen();
      } catch {
        // Fullscreen not supported or denied
      }
    }
  }, []);

  // ── Join handler ──
  const handleJoin = async () => {
    const trimmedCode = code.trim().toUpperCase();
    if (!trimmedCode) {
      toast.error("Please enter a valid exam code.");
      return;
    }

    try {
      const response = await api.post("/api/student/ielts/session/join", {
        code: trimmedCode,
      });

      if (response.data.status === "joined") {
        setSessionId(response.data.session_id);
        setCode("");
        setStatus("joined");
        toggleFullscreen();
        // Prefetch take-test page so navigation is instant when exam starts
        router.prefetch("/ielts/take-test/placeholder");
        toast.success(response.data.message || "Successfully joined session!");
      } else {
        toast.warning(
          response.data.message || "Joined with unexpected status.",
        );
      }
    } catch {
      toast.error("Failed to join session");
    }
  };

  // ── Anti-cheat: fullscreen + visibility tracking ──
  useEffect(() => {
    if (status !== "joined" && status !== "preparing") return;

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        toast.warning(
          "Warning: Exiting full screen is a violation of exam rules!",
          { position: "top-center", autoClose: 5000 },
        );
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        toast.warning(
          "Warning: Switching tabs is not allowed during the mock exam!",
          { position: "top-center", autoClose: 10000 },
        );
      }
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [status]);

  // ── Poll for session start ──
  useEffect(() => {
    if (!isHydrated || (status !== "joined" && status !== "preparing")) return;

    const interval = setInterval(async () => {
      try {
        const response = await api.get(
          "/api/student/ielts/session/my-sessions",
        );

        const sessions: SessionEntry[] = response.data?.sessions;

        if (!sessions || sessions.length === 0) {
          clearInterval(interval);
          reset();
          toast.info(
            "Session has been cancelled or removed. Returning to entry.",
          );
          return;
        }

        // FIX 2: If we have a sessionId, match by it; otherwise use first (newest)
        const session = sessionId
          ? sessions.find((s) => s.session_id === sessionId) ?? sessions[0]
          : sessions[0];

        const sessionStatus = (session.session_status || "").toUpperCase();
        if (sessionStatus === "CANCELLED") {
          clearInterval(interval);
          reset();
          toast.info("Session has been cancelled by the proctor.");
          return;
        }

        if (sessionStatus === "STARTED" && session.attempt_id) {
          setStatus("ready");
          setSessionId(session.session_id);
          setTestId(session.test_id);
          setAttemptId(session.attempt_id);
          clearInterval(interval);

          // Prefetch content in background so take-test page loads faster
          api.get(`/api/student/ielts/test/${session.attempt_id}/content?section=listening`).catch(() => {});

          toast.success("Exam Started! Redirecting...");
          router.push(`/ielts/take-test/${session.attempt_id}`);
        } else if (status === "joined") {
          setStatus("preparing");
        }
      } catch {
        // Silently retry on next interval
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [
    isHydrated,
    status,
    sessionId,
    router,
    setStatus,
    setSessionId,
    setTestId,
    setAttemptId,
    reset,
  ]);

  const statusInfo = (() => {
    switch (status) {
      case "joined":
      case "waiting":
        return {
          icon: <Loader2 className="w-5 h-5 animate-spin text-blue-500" />,
          label: "Joined. Wait to start exam",
          color: "text-blue-500",
        };
      case "preparing":
        return {
          icon: <Loader2 className="w-5 h-5 animate-spin text-orange-500" />,
          label: "Preparing exam...",
          color: "text-orange-500",
        };
      case "ready":
        return {
          icon: <CheckCircle2 className="w-5 h-5 text-green-500" />,
          label: "Exam started! Redirecting...",
          color: "text-green-500",
        };
      default:
        return null;
    }
  })();

  if (!isHydrated) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative">
      {/* Back Button */}
      {status === "idle" && (
        <button
          onClick={() => {
            reset();
            router.back();
          }}
          className="absolute top-8 left-8 flex items-center gap-2 px-4 py-2 bg-white border border-bordercolor rounded-xl text-sm font-semibold text-textprimary shadow-sm hover:bg-gray-50 transition-all active:scale-95"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
          Back
        </button>
      )}

      {/* Main UI */}
      <div className="w-full max-w-md bg-white rounded-3xl p-8 border border-bordercolor shadow-sm">
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center">
            <Maximize className="w-8 h-8 text-blue-500" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-textprimary">
              IELTS Mock Exam
            </h1>
            <p className="text-textsecondary text-sm">
              Enter the exam code provided by your proctor.
            </p>
          </div>

          <div className="w-full space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-textsecondary uppercase tracking-wider">
                Exam Code
              </label>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder={`Ex: IELTS-XXXXXX`}
                className="text-center text-lg font-mono tracking-widest bg-gray-50 border-none h-12 rounded-xl focus-visible:ring-2 focus-visible:ring-blue-500"
                disabled={status !== "idle"}
              />
            </div>

            {statusInfo && (
              <div
                className={`flex items-center justify-center gap-2 p-3 rounded-xl bg-gray-50 border border-bordercolor animate-in fade-in zoom-in duration-300`}
              >
                {statusInfo.icon}
                <span className={`text-sm font-semibold ${statusInfo.color}`}>
                  {statusInfo.label}
                </span>
              </div>
            )}

            <Button
              onClick={handleJoin}
              disabled={status !== "idle" || !code.trim()}
              className={`w-full h-12 rounded-xl text-base font-bold shadow-lg transition-all active:scale-95 ${
                status !== "idle" || !code.trim()
                  ? "bg-gray-100 text-gray-400"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
            >
              {status === "idle" ? "Join Exam Session" : "Joined"}
            </Button>
          </div>

          {status !== "idle" && (
            <div className="flex items-center gap-2 text-orange-600 bg-orange-50 p-3 rounded-xl text-xs font-semibold">
              <AlertTriangle className="w-4 h-4" />
              Anti-cheating active: Fullscreen and exit tracking enabled.
            </div>
          )}
        </div>
      </div>

      <p className="mt-8 text-xs text-textsecondary text-center">
        By joining, you agree to the examination rules and anti-cheating policy.
        <br />
        The system will track your tab activity and browser state.
      </p>

      {/* Exit Fullscreen Button */}
      <button
        onClick={async () => {
          if (document.fullscreenElement) {
            await document.exitFullscreen();
            toast.warning(
              "Warning: Exiting full screen is a violation of exam rules!",
              { position: "bottom-right", autoClose: 5000 },
            );
          }
        }}
        className="fixed bottom-4 right-4 flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl text-sm font-semibold text-red-600 shadow-sm transition-all active:scale-95"
      >
        <Maximize className="w-4 h-4" />
        Exit Full Screen
      </button>
    </div>
  );
}
