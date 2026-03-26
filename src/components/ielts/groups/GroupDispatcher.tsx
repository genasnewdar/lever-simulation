"use client";

import React from "react";
import type { GroupRendererProps } from "./types";
import TableGroupRenderer from "./TableGroupRenderer";
import FormGroupRenderer from "./FormGroupRenderer";
import MatchingPanelRenderer from "./MatchingPanelRenderer";
import MCQListRenderer from "./MCQListRenderer";
import TFNGRenderer from "./TFNGRenderer";
import SummaryRenderer from "./SummaryRenderer";
import FlowchartRenderer from "./FlowchartRenderer";
import NotesRenderer from "./NotesRenderer";
import SentencesRenderer from "./SentencesRenderer";
import DiagramRenderer from "./DiagramRenderer";
import FallbackRenderer from "./FallbackRenderer";

const rendererMap: Record<string, React.FC<GroupRendererProps>> = {
  TABLE: TableGroupRenderer,
  IMAGE_TABLE: TableGroupRenderer,
  FORM: FormGroupRenderer,
  MATCHING_PANEL: MatchingPanelRenderer,
  MCQ_LIST: MCQListRenderer,
  SUMMARY: SummaryRenderer,
  FLOWCHART: FlowchartRenderer,
  NOTES: NotesRenderer,
  SENTENCES: SentencesRenderer,
  DIAGRAM: DiagramRenderer,
  NONE: FallbackRenderer,
};

/**
 * Dispatches a question group to the appropriate renderer based on layout_type.
 *
 * Special handling: if layout_type is MCQ_LIST but all questions are TFNG/YNNG,
 * use the TFNGRenderer instead for proper instruction display.
 */
export default function GroupDispatcher(props: GroupRendererProps) {
  const { group } = props;
  const layoutType = (group.layout_type ?? "NONE").toUpperCase();

  // Auto-detect TFNG/YNNG even when grouped as MCQ_LIST or NONE
  const allTFNG = group.questions.length > 0 && group.questions.every(
    (q) =>
      q.question_category === "TRUE_FALSE_NOT_GIVEN" ||
      q.question_category === "TFNG_SELECT" ||
      q.question_category === "YES_NO_NOT_GIVEN" ||
      q.question_category === "YNNG_SELECT",
  );
  if (allTFNG) {
    return <TFNGRenderer {...props} />;
  }

  // Auto-detect matching features/headings even when layout_type doesn't match
  const allMatching = group.questions.length > 0 && group.questions.every(
    (q) =>
      q.question_category === "MATCHING_FEATURES" ||
      q.question_category === "MATCHING_HEADINGS" ||
      q.question_category === "MATCHING_SENTENCE_ENDINGS" ||
      q.question_category === "MATCHING_LIST",
  );
  if (allMatching && (group.options_pool?.length ?? 0) > 0) {
    return <MatchingPanelRenderer {...props} />;
  }

  const Renderer = rendererMap[layoutType] ?? FallbackRenderer;
  return <Renderer {...props} />;
}
