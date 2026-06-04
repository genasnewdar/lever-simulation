"use client";

import React, { useState, useCallback, useEffect, useMemo } from "react";
import { Panel, Group, Separator } from "react-resizable-panels";
import { AnimatePresence, motion, MotionConfig } from "framer-motion";
import Header from "./Header";
import QuestionMap, { MapSection } from "./QuestionMap";
import FloatingToolbar from "../tools/FloatingToolbar";
import AudioPlayer from "../AudioPlayer";
import type { HighlightColor } from "../tools/FloatingToolbar";
import { cn, getSelectionCharacterOffsets } from "@/lib/utils";
import { useTextHighlights, type HighlightSpec } from "@/lib/hooks/useTextHighlights";

export type HighlightContainer = "passage" | "questions";

export interface AddHighlightOptions {
  container: HighlightContainer;
  note?: string;
}

export interface OpenNoteEditorPayload {
  highlightId: string;
  initialNote: string;
  color: HighlightColor;
  container: HighlightContainer;
  anchorRect: DOMRect | null;
}

/**
 * Page-turn motion: pivot from the bottom-right corner so the outgoing page
 * lifts and folds away in the same gesture as the brand mark's mint corner-curl.
 * Outgoing page peels off; incoming page is what was underneath, so it just
 * rises and resolves into place.
 */
const PAGE_TURN_INITIAL = {
  opacity: 0,
  rotateX: -8,
  rotateY: 6,
  rotateZ: 1.5,
  scale: 0.985,
};
const PAGE_TURN_ANIMATE = {
  opacity: 1,
  rotateX: 0,
  rotateY: 0,
  rotateZ: 0,
  scale: 1,
};
const PAGE_TURN_EXIT = {
  opacity: 0,
  rotateX: -22,
  rotateY: 22,
  rotateZ: -5,
  scale: 0.94,
  filter: "drop-shadow(-12px 12px 18px color-mix(in oklch, var(--ink) 22%, transparent))",
};
const PAGE_TURN_TRANSITION = { duration: 0.6, ease: [0.32, 0.04, 0.18, 1] as const };
const PAGE_TURN_STYLE = {
  transformOrigin: "100% 100%" as const,
  transformStyle: "preserve-3d" as const,
  backfaceVisibility: "hidden" as const,
};

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
  /** Called when user applies a highlight (Yellow/Pink) on either the passage or questions panel. Parent should persist. */
  onHighlightText?: (
    charStart: number,
    charEnd: number,
    color: HighlightColor,
    options: AddHighlightOptions,
  ) => void;
  /** Called when user updates the note text on an existing highlight. */
  onUpdateNote?: (
    highlightId: string,
    note: string,
    container: HighlightContainer,
  ) => void;
  /** Highlights to apply on the questions panel via the CSS Custom Highlight API. */
  questionsHighlights?: HighlightSpec[];
  /** Stable key (e.g. active passage id) used to invalidate the question highlight overlay when content changes. */
  questionsHighlightVersion?: string | number;
  /** Called when user double-clicks an existing highlight; lets parent surface a note editor. */
  onRequestEditQuestionsNote?: (charStart: number, charEnd: number) => void;
  /** When set, the floating toolbar opens in note-editing mode for this highlight. */
  noteEditor?: OpenNoteEditorPayload | null;
  /** Called when the note editor should be dismissed. */
  onCloseNoteEditor?: () => void;
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
  /** When set, listening audio position is persisted under this key (for resume-on-refresh). */
  audioStorageKey?: string | null;
  /** For Listening: fired once when the audio finishes playing to its end. */
  onAudioEnded?: () => void;
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
  onUpdateNote,
  questionsHighlights,
  questionsHighlightVersion,
  noteEditor,
  onCloseNoteEditor,
  audioUrl,
  activePartIndex,
  onPartChange,
  currentQuestionIndex: controlledCurrentIndex,
  onTimeExpire,
  hideSectionTabs = false,
  examMode = false,
  reviewAnswers = {},
  audioStorageKey = null,
  onAudioEnded,
}) => {
  const [internalIndex, setInternalIndex] = useState(0);
  const currentQuestionIndex =
    controlledCurrentIndex !== undefined ? controlledCurrentIndex : internalIndex;
  const [internalAnsweredQuestions] = useState<Set<number>>(new Set());
  const [internalReviewQuestions] = useState<Set<number>>(new Set());
  const [selection, setSelection] = useState<Selection | null>(null);
  const savedRangeRef = React.useRef<Range | null>(null);
  const passageContainerRef = React.useRef<HTMLDivElement | null>(null);
  const questionsContainerRef = React.useRef<HTMLDivElement | null>(null);
  const [activeContainer, setActiveContainer] = useState<HighlightContainer | null>(null);

  const answeredSet = externalAnsweredQuestions || internalAnsweredQuestions;
  const reviewSet = externalReviewQuestions || internalReviewQuestions;

  // Apply CSS Custom Highlight overlay to the questions panel (no DOM mutation,
  // so highlights survive React re-renders triggered by typing answers).
  const questionsSpecs = useMemo<HighlightSpec[]>(
    () =>
      (questionsHighlights ?? []).map((h) => ({
        start: h.start,
        end: h.end,
        color: h.color,
      })),
    [questionsHighlights],
  );
  useTextHighlights(questionsContainerRef, questionsSpecs, {
    yellowName: "user-yellow",
    pinkName: "user-pink",
    version: questionsHighlightVersion,
  });

  const captureSelection = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed || sel.toString().length === 0) {
      setSelection(null);
      savedRangeRef.current = null;
      setActiveContainer(null);
      return;
    }
    const range = sel.getRangeAt(0);
    const inPassage =
      passageContainerRef.current && range.intersectsNode(passageContainerRef.current);
    const inQuestions =
      questionsContainerRef.current && range.intersectsNode(questionsContainerRef.current);
    if (inPassage) {
      savedRangeRef.current = range.cloneRange();
      setSelection(sel);
      setActiveContainer("passage");
    } else if (inQuestions) {
      savedRangeRef.current = range.cloneRange();
      setSelection(sel);
      setActiveContainer("questions");
    }
  }, []);

  // Track selection changes anywhere on the page so clicking the toolbar
  // doesn't clear the saved range before the action fires. When selection
  // collapses (e.g. focus moves into the toolbar's note textarea, or user
  // clicks empty space), we drop the FloatingToolbar's `selection` state so
  // it can hide on its own — but we keep `savedRangeRef` and
  // `activeContainer` so an in-progress note save still has a target range.
  // The ref is cleared on commit/cancel by `clearSelection`.
  useEffect(() => {
    const onSelectionChange = () => {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0 || sel.isCollapsed) {
        setSelection(null);
        return;
      }
      const range = sel.getRangeAt(0);
      const inPassage =
        passageContainerRef.current && range.intersectsNode(passageContainerRef.current);
      const inQuestions =
        questionsContainerRef.current && range.intersectsNode(questionsContainerRef.current);
      if (inPassage) {
        savedRangeRef.current = range.cloneRange();
        setSelection(sel);
        setActiveContainer("passage");
      } else if (inQuestions) {
        savedRangeRef.current = range.cloneRange();
        setSelection(sel);
        setActiveContainer("questions");
      }
    };
    document.addEventListener("selectionchange", onSelectionChange);
    return () => document.removeEventListener("selectionchange", onSelectionChange);
  }, []);

  const clearSelection = useCallback(() => {
    if (selection) selection.removeAllRanges();
    setSelection(null);
    savedRangeRef.current = null;
    setActiveContainer(null);
  }, [selection]);

  const computeOffsetsForContainer = useCallback(
    (container: HighlightContainer, range: Range): [number, number] | null => {
      if (container === "questions") {
        return getSelectionCharacterOffsets(questionsContainerRef.current, range);
      }
      // Passage highlights are applied against the ReadingPassage body text
      // (`.passage-prose`), so offsets MUST be measured from that element — not
      // the whole scroll panel, which also holds the "Passage N" header, title
      // and "Clear highlights" button. Measuring from the panel shifts every
      // offset by the header length, so highlights land in the wrong place
      // (or fail to render). The questions panel has no such wrapper text.
      const passageEl =
        passageContainerRef.current?.querySelector<HTMLElement>(".passage-prose") ??
        passageContainerRef.current;
      return getSelectionCharacterOffsets(passageEl, range);
    },
    [],
  );

  const handleHighlight = useCallback(
    (color: HighlightColor) => {
      const range =
        savedRangeRef.current ??
        (selection?.rangeCount ? selection.getRangeAt(0) : null);
      if (!range) return;
      const container = activeContainer ?? "passage";
      const offsets = computeOffsetsForContainer(container, range);
      if (!offsets) {
        clearSelection();
        return;
      }
      onHighlightText?.(offsets[0], offsets[1], color, { container });
      clearSelection();
    },
    [selection, onHighlightText, activeContainer, clearSelection, computeOffsetsForContainer],
  );

  const handleSaveNote = useCallback(
    (color: HighlightColor, note: string) => {
      if (noteEditor) {
        onUpdateNote?.(noteEditor.highlightId, note, noteEditor.container);
        return;
      }
      const range =
        savedRangeRef.current ??
        (selection?.rangeCount ? selection.getRangeAt(0) : null);
      if (!range) return;
      const container = activeContainer ?? "passage";
      const offsets = computeOffsetsForContainer(container, range);
      if (!offsets) {
        clearSelection();
        return;
      }
      onHighlightText?.(offsets[0], offsets[1], color, { container, note });
      clearSelection();
    },
    [
      selection,
      onHighlightText,
      onUpdateNote,
      activeContainer,
      clearSelection,
      noteEditor,
      computeOffsetsForContainer,
    ],
  );

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
    <MotionConfig reducedMotion="user">
    <div className="h-screen flex flex-col bg-paper overflow-hidden select-none font-sans">
      <Header
        userName={userName}
        initialSeconds={initialSeconds}
        activeTab={activeTab}
        onTabChange={onTabChange}
        onTimeExpire={onTimeExpire}
        hideSectionTabs={hideSectionTabs}
      />

      {activeTab === "LISTENING" && (
        <div className="flex-shrink-0 border-b border-rule">
          <AudioPlayer audioUrl={audioUrl ?? null} className="mt-[64px]" examMode={examMode} storageKey={audioStorageKey} onEnded={onAudioEnded} />
        </div>
      )}

      <main
        className={cn(
          "flex-1 relative overflow-hidden min-h-0 page-turn-stage",
          activeTab === "LISTENING" ? "mt-0 mb-[56px]" : "mt-[64px] mb-[56px]"
        )}
      >
        {layoutMode === "SPLIT" ? (
          <Group orientation="horizontal">
            {/* Left Panel: Content / Passage — stable; inner content page-turns */}
            <Panel
              defaultSize={50}
              minSize={20}
              className="h-full border-r border-rule"
            >
              <div
                ref={passageContainerRef}
                className="h-full overflow-y-auto custom-scrollbar px-8 lg:px-16 py-10 lg:py-14 select-text bg-paper"
                onMouseUp={captureSelection}
              >
                <div className="max-w-[78ch] mx-auto">
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={`L-${activeTab}`}
                      initial={PAGE_TURN_INITIAL}
                      animate={PAGE_TURN_ANIMATE}
                      exit={PAGE_TURN_EXIT}
                      transition={PAGE_TURN_TRANSITION}
                      style={PAGE_TURN_STYLE}
                    >
                      {children[0]}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </Panel>

            <Separator className="w-px px-0 hover:bg-mint transition-colors cursor-col-resize flex items-center justify-center bg-rule" />

            {/* Right Panel: Questions — stable; inner content page-turns */}
            <Panel defaultSize={50} minSize={20} className="h-full">
              <div
                ref={questionsContainerRef}
                onMouseUp={captureSelection}
                className="h-full overflow-y-auto custom-scrollbar px-8 lg:px-14 py-10 lg:py-14 bg-paper-2 right-panel-scroll select-text"
              >
                <div
                  className={cn(
                    "mx-auto",
                    activeTab === "WRITING" ? "max-w-none" : "max-w-[68ch]",
                  )}
                >
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={`R-${activeTab}`}
                      initial={PAGE_TURN_INITIAL}
                      animate={PAGE_TURN_ANIMATE}
                      exit={PAGE_TURN_EXIT}
                      transition={{ ...PAGE_TURN_TRANSITION, delay: 0.08 }}
                      style={PAGE_TURN_STYLE}
                    >
                      {children[1]}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </Panel>
          </Group>
        ) : (
          <div className="h-full overflow-y-auto custom-scrollbar px-8 lg:px-14 py-10 lg:py-14 bg-paper-2 right-panel-scroll">
            <div className="max-w-[68ch] mx-auto">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={`S-${activeTab}`}
                  initial={PAGE_TURN_INITIAL}
                  animate={PAGE_TURN_ANIMATE}
                  exit={PAGE_TURN_EXIT}
                  transition={PAGE_TURN_TRANSITION}
                  style={PAGE_TURN_STYLE}
                >
                  {children[1]}
                </motion.div>
              </AnimatePresence>
            </div>
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

      {onHighlightText && (
        <FloatingToolbar
          selection={selection}
          onHighlight={handleHighlight}
          onSaveNote={handleSaveNote}
          noteEditor={noteEditor}
          anchorRect={noteEditor?.anchorRect ?? null}
          onCloseNoteEditor={onCloseNoteEditor}
        />
      )}

      <style jsx global>{`
        *:focus { outline: none; }

        @keyframes ielts-question-flash {
          0%   { background-color: color-mix(in oklch, var(--mint) 30%, transparent); }
          70%  { background-color: color-mix(in oklch, var(--mint) 10%, transparent); }
          100% { background-color: transparent; }
        }
        .ielts-question-flash {
          animation: ielts-question-flash 600ms cubic-bezier(0.22, 0.61, 0.36, 1);
        }
      `}</style>
    </div>
    </MotionConfig>
  );
};

export default CDIELTSLayout;
