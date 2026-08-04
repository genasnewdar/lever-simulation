export type BackendQuestionCategory =
  | 'FORM_COMPLETION'
  | 'SUMMARY_COMPLETION'
  | 'FLOWCHART_COMPLETION'
  | 'MCQ_SINGLE'
  | 'MCQ_MULTIPLE'
  | 'TABLE_COMPLETION'
  | 'MATCHING_LIST'
  | 'MATCHING_FEATURES'
  | 'MATCHING_HEADINGS'
  | 'MATCHING_SENTENCE_ENDINGS'
  | 'TRUE_FALSE_NOT_GIVEN'
  | 'YES_NO_NOT_GIVEN'
  | 'TFNG_SELECT'
  | 'YNNG_SELECT'
  | 'NOTES_COMPLETION'
  | 'SENTENCE_COMPLETION'
  | 'DIAGRAM_LABEL'
  | 'SHORT_ANSWER';

export interface BackendOption {
  id: string;
  label: string;
  text: string;
  order: number;
}

export interface SavedAnswer {
  text_answer?: string | null;
  selected_option_id?: string | null;
  selected_option_ids?: string[] | null;
  matched_option_id?: string | null;
  answer?: string | null;
}

export interface BackendQuestion {
  id: string;
  question_number: number;
  question_number_end?: number | null;
  question_text: string;
  question_context?: string;
  question_category: BackendQuestionCategory;
  answer_input_type: string;
  required_selections?: number | null;
  word_limit?: number | null;
  number_allowed?: boolean;
  layout_position?: string | null;
  inline_content?: LayoutDataCell[] | null;
  options: BackendOption[];
  instructions?: string | null;
  passage_id?: string | null;
  section_id?: string | null;
  saved_answer?: SavedAnswer | null;
}

/** A single cell within layout_data — either static text or an input blank */
export type LayoutDataCell =
  | { type: 'text'; value: string }
  | { type: 'input'; questionNumber: number };

/** layout_data JSON for different layout types */
export interface TableLayoutData {
  type: 'table';
  headers: string[];
  rows: { cells: { content: LayoutDataCell[]; colspan?: number; rowspan?: number }[] }[];
}

export interface FormLayoutData {
  type: 'form';
  title?: string;
  rows: { label: string; content: LayoutDataCell[] }[];
}

export interface NotesLayoutData {
  type: 'notes';
  title?: string;
  sections: { heading: string; items: { content: LayoutDataCell[] }[] }[];
}

export interface FlowchartLayoutData {
  type: 'flowchart';
  title?: string;
  boxes: { content: LayoutDataCell[] }[];
}

export interface SummaryLayoutData {
  type: 'summary';
  paragraphs: { content: LayoutDataCell[] }[];
}

export interface SentencesLayoutData {
  type: 'sentences';
  sentences: { content: LayoutDataCell[] }[];
}

export type LayoutData =
  | TableLayoutData
  | FormLayoutData
  | NotesLayoutData
  | FlowchartLayoutData
  | SummaryLayoutData
  | SentencesLayoutData
  | Record<string, unknown>;

export interface BackendQuestionGroup {
  id: string;
  layout_type: string;
  title: string | null;
  instructions: string | null;
  word_limit: number | null;
  word_limit_text: string | null;
  number_allowed: boolean;
  layout_data: LayoutData | null;
  image_url: string | null;
  image_alt_text: string | null;
  options_pool: { id: string; text: string }[] | null;
  questions: BackendQuestion[];
}

export interface BackendSectionBase {
  id: string;
  title: string;
  instructions: string;
  questions: BackendQuestion[];
  question_groups?: BackendQuestionGroup[];
}

export interface BackendListeningSection extends BackendSectionBase {
  section_number: number;
  context: string;
  audio_url: string | null;
}

export interface BackendReadingPassage {
  id: string;
  passage_number: number;
  title: string;
  content: string;
  word_count: number;
  questions: BackendQuestion[];
  question_groups?: BackendQuestionGroup[];
}

export interface BackendWritingTask {
  id: string;
  task_number: number;
  task_type: string;
  title: string;
  prompt: string;
  min_words: number;
  suggested_time: number;
  visual_content?: string | null;
}

export interface BackendListeningTest {
  id: string;
  duration_minutes: number;
  instructions: string;
  audio_url: string | null;
  sections: BackendListeningSection[];
}

export interface BackendReadingTest {
  id: string;
  duration_minutes: number;
  instructions: string;
  passages: BackendReadingPassage[];
}

export interface BackendWritingTest {
  id: string;
  duration_minutes: number;
  instructions: string;
  tasks: BackendWritingTask[];
}

export interface BackendSimulationResponse {
  id: string;
  title: string;
  description: string;
  status: string;
  duration_minutes: number;
  is_practice: boolean;
  listening_test: BackendListeningTest | null;
  reading_test: BackendReadingTest | null;
  writing_test: BackendWritingTest | null;
}

// ── Content endpoint types (GET /api/student/ielts/test/{attemptId}/content) ──

export interface SectionStatus {
  started: boolean;
  completed_at: string | null;
  can_access: boolean;
}

/** A skill a test can contain. A test has any combination of one to four. */
export type SectionId = 'listening' | 'reading' | 'writing' | 'speaking';

/** The same four, as the exam UI names its tabs. */
export type SectionTab = 'LISTENING' | 'READING' | 'WRITING' | 'SPEAKING';

export const sectionTab = (section: string): SectionTab =>
  section.toUpperCase() as SectionTab;

export interface ContentResponseMeta {
  attempt_id: string;
  test_id: string;
  test_title: string;
  mode: string;
  status: string;
  current_section: string;
  /**
   * The sections THIS test contains, in sitting order.
   *
   * Not every test is Listening → Reading → Writing: a test is built from any
   * combination of the four skills, so the exam navigation is driven by this
   * rather than by a fixed order. Absent on older backends, where the classic
   * three-section order is the right fallback.
   */
  sections?: SectionId[];
  /** Where the candidate goes when the current section closes; null at the end. */
  next_section?: SectionId | null;
  time_remaining_seconds: number;
  section_time_remaining_seconds: number;
  /** Post-audio Listening review window length (seconds), backend-configured. */
  listening_review_seconds: number;
  /** Only the sections this test has appear here. */
  sections_status: Partial<Record<SectionId, SectionStatus>>;
}

export interface ListeningContent {
  type: 'listening';
  duration_minutes: number;
  instructions: string;
  audio_url: string | null;
  sections: BackendListeningSection[];
  total_questions: number;
}

export interface ReadingContent {
  type: 'reading';
  duration_minutes: number;
  instructions: string;
  passages: BackendReadingPassage[];
  total_questions: number;
}

export interface WritingTaskWithSaved extends BackendWritingTask {
  saved_answer?: { content?: string; word_count?: number } | null;
}

export interface WritingContent {
  type: 'writing';
  duration_minutes: number;
  instructions: string;
  tasks: WritingTaskWithSaved[];
}

export type SectionContent = ListeningContent | ReadingContent | WritingContent;

export interface ContentResponse extends ContentResponseMeta {
  content?: SectionContent;
}
