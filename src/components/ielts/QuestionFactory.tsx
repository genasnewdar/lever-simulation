"use client";

import React from "react";
import { Question } from "../../types/ielts";
import MultipleChoice from "./questions/MultipleChoice";
import CheckboxGroup from "./questions/CheckboxGroup";
import Identification from "./questions/Identification";
import SentenceCompletion from "./questions/SentenceCompletion";
import TableCompletion from "./questions/TableCompletion";
import MatchingTask from "./questions/MatchingTask";
import NoteCompletion from "./questions/NoteCompletion";
import ShortAnswer from "./questions/ShortAnswer";
import DiagramLabeling from "./questions/DiagramLabeling";
import WritingTask from "./questions/WritingTask";

interface QuestionFactoryProps {
  question: Question;
  status?: "active" | "finished";
  onToggleReview?: (qNum: number) => void;
  isReviewChecked?: (qNum: number) => boolean;
}

interface QuestionComponentProps {
  question: Question;
  disabled?: boolean;
  onToggleReview?: (qNum: number) => void;
  isReviewChecked?: (qNum: number) => boolean;
}

const componentMap: Record<string, React.FC<QuestionComponentProps>> = {
  MULTIPLE_CHOICE: MultipleChoice,
  CHECKBOX_GROUP: CheckboxGroup,
  IDENTIFICATION: Identification,
  SENTENCE_COMPLETION: SentenceCompletion,
  TABLE_COMPLETION: TableCompletion,
  MATCHING_TASK: MatchingTask,
  NOTE_COMPLETION: NoteCompletion,
  SHORT_ANSWER: ShortAnswer,
  DIAGRAM_LABELING: DiagramLabeling,
  WRITING_TASK_1: WritingTask,
  WRITING_TASK_2: WritingTask,
};

const QuestionFactory: React.FC<QuestionFactoryProps> = ({
  question,
  status = "active",
  onToggleReview,
  isReviewChecked,
}) => {
  const Component = componentMap[question.type];
  const disabled = status === "finished";

  if (!Component) {
    return (
      <div className="p-6 border-2 border-dashed border-red-200 rounded-2xl bg-red-50 text-red-600 font-bold flex items-center gap-3 animate-pulse">
        <span className="text-2xl">⚠️</span>
        <div className="flex flex-col">
          <span className="text-sm uppercase tracking-widest opacity-60">
            System Error
          </span>
          <span>Unknown Question Type: {question.type}</span>
        </div>
      </div>
    );
  }

  return (
    <Component
      question={question}
      disabled={disabled}
      onToggleReview={onToggleReview}
      isReviewChecked={isReviewChecked}
    />
  );
};

export default QuestionFactory;
