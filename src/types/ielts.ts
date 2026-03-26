import { BackendQuestion } from "./ielts-simulation";

export type QuestionType =
  | 'MULTIPLE_CHOICE'
  | 'IDENTIFICATION'
  | 'SENTENCE_COMPLETION'
  | 'TABLE_COMPLETION'
  | 'MATCHING_TASK'
  | 'NOTE_COMPLETION'
  | 'SHORT_ANSWER'
  | 'DIAGRAM_LABELING'
  | 'CHECKBOX_GROUP'
  | 'WRITING_TASK_1'
  | 'WRITING_TASK_2';

export interface Option {
  id: string;
  label: string;
}

export interface TableCell {
  content: string;
  isInput?: boolean;
  inputId?: string;
}

export interface Question {
  id: string;
  type: QuestionType;
  questionNumber?: number;
  title?: string;
  content: string; // The instruction, text snippet, or prompt
  options?: Option[];
  allowMultiple?: boolean; // For MultipleChoice
  validationRules?: {
    maxWords?: number;
    charLimit?: number;
  };
  tableData?: {
    headers: string[];
    rows: TableCell[][];
  };
  matchingData?: {
    items: { id: string; content: string }[];
    targets: { id: string; description: string }[];
  };
  noteData?: {
    title?: string;
    points: string[]; // Points can contain placeholders like [1]
  };
  imageUrl?: string; // For Diagram Labeling or Writing Task 1
  rawData?: BackendQuestion; // Store raw backend data for components to parse directly
}

export interface Section {
  id: string;
  title: string;
  passage?: string;
  audioUrl?: string;
  questions: Question[];
}

export interface ExamData {
  id: string;
  title: string;
  sections: Section[];
}
