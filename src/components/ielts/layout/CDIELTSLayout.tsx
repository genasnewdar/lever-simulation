"use client";

import React, { useState, useCallback, useEffect } from "react";
import { Panel, Group, Separator } from "react-resizable-panels";
import Header from "./Header";
import QuestionMap, { MapSection } from "./QuestionMap";
import ReviewModal from "./ReviewModal";
import FloatingToolbar from "../tools/FloatingToolbar";
import AudioPlayer from "../AudioPlayer";
import type { HighlightColor } from "../tools/FloatingToolbar";
import { cn } from "@/lib/utils";

interface CDIELTSLayoutProps {
  children: [React.ReactNode, React.ReactNode]; // [LeftPanel, RightPanel]
  title: string;
  totalQuestions: number;
  userName?: string;
  initialSeconds?: number;
  onQuestionClick?: (index: number) => void;
  answeredQuestions?: Set<number>;
  reviewQuestions?: Set<number>;
  layoutMode: "SINGLE" | "SPLIT";
  activeTab: "LISTENING" | "READING" | "WRITING";
  onTabChange: (tab: "LISTENING" | "READING" | "WRITING") => void;
  writingTask?: number;
  onWritingTaskChange?: (task: number) => void;
  isWritingTaskAnswered?: (task: number) => boolean;
  sections?: MapSection[];
  /** Called when user applies a highlight (Yellow/Pink) on the reading passage. Parent should persist highlights. */
  onHighlightText?: (range: Range, color: HighlightColor) => void;
  /** For Listening: show persistent audio bar. Pass audio URL (e.g. from listening_test or section). */
  audioUrl?: string | null;
  /** For Listening: which part tab is selected (0–3). */
  activePartIndex?: number;
  /** For Listening: when user selects a Part tab. */
  onPartChange?: (partIndex: number) => void;
  /** Current question index (0-based). When provided, footer stays in sync with page. */
  currentQuestionIndex?: number;
  /** Called when the timer reaches 0 */
  onTimeExpire?: () => void;
  /** When true, section navigation (Listening/Reading/Writing) is hidden; sections change only when timer expires. */
  hideSectionTabs?: boolean;
  /** When true, audio auto-plays and controls are hidden (real IELTS behavior). */
  examMode?: boolean;
  /** Map from question number (1-based) to student's answer string, for the review modal. */
  reviewAnswers?: Record<number, string>;
}

const CDIELTSLayout: React.FC<CDIELTSLayoutProps> = ({
  children,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- kept for API; may be used for document title later
  title,
  totalQuestions,
  userName = "John Doe",
  initialSeconds = 3600,
  onQuestionClick,
  answeredQuestions: externalAnsweredQuestions,
  reviewQuestions: externalReviewQuestions,
  layoutMode,
  activeTab,
  onTabChange,
  writingTask,
  onWritingTaskChange,
  isWritingTaskAnswered,
  sections,
  onHighlightText,
  audioUrl,
  activePartIndex,
  onPartChange,
  currentQuestionIndex: controlledCurrentIndex,
  onTimeExpire,
  hideSectionTabs = false,
  examMode = false,
  reviewAnswers = {},
}) => {
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [internalIndex, setInternalIndex] = useState(0);
  const currentQuestionIndex =
    controlledCurrentIndex !== undefined ? controlledCurrentIndex : internalIndex;
  const [internalAnsweredQuestions] = useState<Set<number>>(new Set());
  const [internalReviewQuestions] = useState<Set<number>>(new Set());
  const [selection, setSelection] = useState<Selection | null>(null);
  const savedRangeRef = React.useRef<Range | null>(null);
  const passageContainerRef = React.useRef<HTMLDivElement | null>(null);

  const answeredSet = externalAnsweredQuestions || internalAnsweredQuestions;
  const reviewSet = externalReviewQuestions || internalReviewQuestions;

  const handleSelection = useCallback(() => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && sel.toString().length > 0) {
      const range = sel.getRangeAt(0);
      const container = passageContainerRef.current;
      if (container && range.intersectsNode(container)) {
        setSelection(sel);
        savedRangeRef.current = range.cloneRange();
      }
    } else {
      setSelection(null);
      savedRangeRef.current = null;
    }
  }, []);

  // Save selection on any change (so clicking toolbar button after selecting still has the range)
  useEffect(() => {
    const onSelectionChange = () => {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0 || sel.isCollapsed) {
        return;
      }
      const range = sel.getRangeAt(0);
      const container = passageContainerRef.current;
      if (container && range.intersectsNode(container)) {
        savedRangeRef.current = range.cloneRange();
        setSelection(sel);
      }
    };
    document.addEventListener("selectionchange", onSelectionChange);
    return () => document.removeEventListener("selectionchange", onSelectionChange);
  }, []);

  const handleHighlight = useCallback(
    (color: HighlightColor) => {
      const range =
        savedRangeRef.current ??
        (selection?.rangeCount ? selection.getRangeAt(0) : null);
      if (!range) return;
      if (onHighlightText) {
        onHighlightText(range, color);
      } else {
        const hex = color === "yellow" ? "#ffeb3b" : "#f48fb1";
        document.execCommand("backColor", false, hex);
      }
      if (selection) selection.removeAllRanges();
      setSelection(null);
      savedRangeRef.current = null;
    },
    [selection, onHighlightText]
  );

  const handleNote = useCallback(() => {
    if (!selection) return;
    alert(
      "Note feature simulated: Text focus for specific comments could be implemented here."
    );
    setSelection(null);
  }, [selection]);

  const handleQuestionClick = (index: number) => {
    if (controlledCurrentIndex === undefined) setInternalIndex(index);
    onQuestionClick?.(index);

    const element = document.getElementById(`q-${index + 1}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Keyboard navigation (only when layout controls index)
  useEffect(() => {
    if (controlledCurrentIndex !== undefined) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        setInternalIndex((prev) => Math.min(totalQuestions - 1, prev + 1));
      } else if (e.key === "ArrowLeft") {
        setInternalIndex((prev) => Math.max(0, prev - 1));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [totalQuestions, controlledCurrentIndex]);

  // Intersection Observer for scroll tracking
  useEffect(() => {
    const options = {
      root: document.querySelector(".right-panel-scroll"),
      rootMargin: "-50px 0px -80% 0px", // Focus on the top area
      threshold: 0,
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && controlledCurrentIndex === undefined) {
          const id = entry.target.id;
          const match = id.match(/q-(\d+)/);
          if (match) {
            const qNum = parseInt(match[1], 10) - 1;
            setInternalIndex(qNum);
          }
        }
      });
    }, options);

    const questions = document.querySelectorAll('[id^="q-"]');
    questions.forEach((q) => observer.observe(q));

    return () => observer.disconnect();
  }, [activeTab, controlledCurrentIndex]);

  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden select-none font-sans">
      <Header
        userName={userName}
        initialSeconds={initialSeconds}
        activeTab={activeTab}
        onTabChange={onTabChange}
        onTimeExpire={onTimeExpire}
        hideSectionTabs={hideSectionTabs}
        onReviewClick={() => setReviewModalOpen(true)}
      />

      {activeTab === "LISTENING" && (
        <div className="flex-shrink-0 border-b border-gray-100">
          <AudioPlayer audioUrl={audioUrl ?? null} className="mt-[60px]" examMode={examMode} />
        </div>
      )}

      <main
        className={cn(
          "flex-1 relative overflow-hidden min-h-0",
          activeTab === "LISTENING" ? "mt-0 mb-[88px]" : "mt-[60px] mb-[56px]"
        )}
      >
        {layoutMode === "SPLIT" ? (
          <Group orientation="horizontal">
            {/* Left Panel: Content / Passage */}
            <Panel
              defaultSize={50}
              minSize={20}
              className="h-full border-r border-bordercolor"
            >
              <div
                ref={passageContainerRef}
                className="h-full overflow-y-auto custom-scrollbar p-6 lg:p-12 select-text bg-background"
                onMouseUp={handleSelection}
              >
                <div className="max-w-3xl mx-auto">{children[0]}</div>
                <FloatingToolbar
                  selection={selection}
                  onHighlight={handleHighlight}
                  onNote={handleNote}
                />
              </div>
            </Panel>

            <Separator className="w-1 px-0 hover:bg-primary transition-colors cursor-col-resize flex items-center justify-center bg-bordercolor" />

            {/* Right Panel: Questions */}
            <Panel defaultSize={50} minSize={20} className="h-full">
              <div className="h-full overflow-y-auto custom-scrollbar p-6 lg:p-12 bg-white right-panel-scroll">
                <div className="max-w-3xl mx-auto">{children[1]}</div>
              </div>
            </Panel>
          </Group>
        ) : (
          <div className="h-full overflow-y-auto custom-scrollbar p-6 lg:p-12 bg-white right-panel-scroll">
            <div className="max-w-3xl mx-auto">{children[1]}</div>
          </div>
        )}
      </main>

      <QuestionMap
        totalQuestions={totalQuestions}
        currentQuestionIndex={currentQuestionIndex}
        onQuestionClick={handleQuestionClick}
        answeredQuestions={answeredSet}
        reviewQuestions={reviewSet}
        activeTab={activeTab}
        writingTask={writingTask}
        onWritingTaskChange={onWritingTaskChange}
        isWritingTaskAnswered={isWritingTaskAnswered}
        sections={sections}
        activePartIndex={activePartIndex}
        onPartChange={onPartChange}
      />

      <ReviewModal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        totalQuestions={totalQuestions}
        answers={reviewAnswers}
      />

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #FAFAFA;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #dee2e6;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #ced4da;
        }

        ::selection {
          background-color: #ffeb3b;
          color: #000;
        }

        *:focus {
          outline: none;
        }

        @keyframes ielts-question-flash {
          0% {
            background-color: rgba(59, 130, 246, 0.35);
          }
          70% {
            background-color: rgba(59, 130, 246, 0.12);
          }
          100% {
            background-color: transparent;
          }
        }
        .ielts-question-flash {
          animation: ielts-question-flash 0.6s ease-out;
        }
      `}</style>
    </div>
  );
};

export default CDIELTSLayout;
