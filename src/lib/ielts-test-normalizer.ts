import type {
  BackendSimulationResponse,
  BackendQuestion,
  BackendOption,
  BackendListeningSection,
  BackendListeningTest,
  BackendReadingPassage,
  BackendQuestionGroup,
  ContentResponse,
} from "@/types/ielts-simulation";

/** Raw section/passage from API may have question_groups instead of flat questions */
type QuestionGroupLike = {
  id?: string;
  questions?: BackendQuestion[];
  order?: number;
  layout_type?: string;
  title?: string;
  instructions?: string;
  word_limit?: number | null;
  word_limit_text?: string | null;
  number_allowed?: boolean;
  layout_data?: Record<string, unknown> | null;
  image_url?: string | null;
  image_alt_text?: string | null;
  options_pool?: { id: string; text: string }[] | null;
  [key: string]: unknown;
};

type SectionLike = {
  id?: string;
  section_number?: number;
  passage_number?: number;
  title?: string;
  instructions?: string;
  context?: string;
  content?: string;
  word_count?: number;
  audio_url?: string | null;
  questions?: BackendQuestion[];
  question_groups?: QuestionGroupLike[];
  [key: string]: unknown;
};

function ensureQuestionId(q: BackendQuestion, prefix: string): BackendQuestion {
  if (q.id) return q;
  return { ...q, id: `${prefix}-${q.question_number}` };
}

function ensureOptionIds(options: BackendOption[] | undefined): BackendOption[] {
  if (!options?.length) return [];
  return options.map((opt) => ({
    ...opt,
    id: (opt as { id?: string }).id ?? opt.label ?? String(opt.order),
  }));
}

/** Normalize questions within a group, ensuring IDs */
function normalizeGroupQuestions(qs: BackendQuestion[], groupId: string): BackendQuestion[] {
  return qs.map((q) =>
    ensureQuestionId(
      { ...q, options: ensureOptionIds(q.options) },
      groupId,
    ),
  ).sort((a, b) => a.question_number - b.question_number);
}

/** Normalize question_groups: preserve all group metadata, normalize question IDs */
function normalizeQuestionGroups(
  groups: QuestionGroupLike[],
  sectionId: string,
): BackendQuestionGroup[] {
  // Sort by order field (if present), then by first question number as fallback
  const sorted = [...groups].sort((a, b) => {
    if (a.order != null && b.order != null) return a.order - b.order;
    const aMin = Math.min(...(a.questions ?? []).map((q) => q.question_number));
    const bMin = Math.min(...(b.questions ?? []).map((q) => q.question_number));
    return aMin - bMin;
  });
  return sorted.map((g, i) => {
    const gid = g.id ?? `${sectionId}-group-${i}`;
    return {
      id: gid,
      layout_type: g.layout_type ?? "NONE",
      title: g.title ?? null,
      instructions: g.instructions ?? null,
      word_limit: g.word_limit ?? null,
      word_limit_text: g.word_limit_text ?? null,
      number_allowed: g.number_allowed ?? true,
      layout_data: (g.layout_data as BackendQuestionGroup["layout_data"]) ?? null,
      image_url: g.image_url ?? null,
      image_alt_text: g.image_alt_text ?? null,
      options_pool: g.options_pool ?? null,
      questions: normalizeGroupQuestions(g.questions ?? [], gid),
    };
  });
}

/** Everything a section holds, in one shape: one list of groups that covers
 *  every question, and the flat list derived from it.
 *
 *  The backend splits a section in two — `questions` carries only the
 *  questions that belong to no group, every other question lives inside
 *  `question_groups` — and both sides of the app picked one half and ignored
 *  the other. The flat list (the number bar, the answered underline,
 *  Back/Next, the question count) took `questions` whenever it had anything in
 *  it, so grouped questions were absent from the bar; the panel renders
 *  `question_groups` whenever it has anything in it, so standalone questions
 *  were never drawn. A section mixing the two lost half of itself each way —
 *  a first group of grouped questions simply had no numbers in the bar.
 *
 *  Standalone questions become a group of their own, placed by question
 *  number, so there is only one list to walk from here on.
 */
function firstNumber(g: { questions?: BackendQuestion[] }): number {
  const nums = (g.questions ?? []).map((q) => q.question_number);
  return nums.length ? Math.min(...nums) : Number.MAX_SAFE_INTEGER;
}

function sectionParts(
  section: SectionLike,
  sectionId: string,
): { questions: BackendQuestion[]; question_groups?: BackendQuestionGroup[] } {
  const groups = section.question_groups?.length
    ? normalizeQuestionGroups(section.question_groups, sectionId)
    : [];

  const grouped = new Set(
    groups.flatMap((g) => g.questions.map((q) => q.question_number)),
  );
  const standalone = normalizeGroupQuestions(
    (section.questions ?? []).filter((q) => !grouped.has(q.question_number)),
    sectionId,
  );

  // No groups at all: leave `question_groups` unset, which is what the panel
  // already treats as "wrap the loose questions in one group of my own".
  if (groups.length === 0) return { questions: standalone };

  const all = standalone.length
    ? [
        ...groups,
        {
          id: `${sectionId}-ungrouped`,
          layout_type: "NONE",
          title: null,
          instructions: null,
          word_limit: null,
          word_limit_text: null,
          number_allowed: true,
          layout_data: null,
          image_url: null,
          image_alt_text: null,
          options_pool: null,
          questions: standalone,
        } as BackendQuestionGroup,
      ].sort((a, b) => firstNumber(a) - firstNumber(b))
    : groups;

  return {
    questions: all
      .flatMap((g) => g.questions)
      .sort((a, b) => a.question_number - b.question_number),
    question_groups: all,
  };
}

/**
 * Normalizes backend test response:
 * - Preserves question_groups with full metadata (layout_type, layout_data, etc.)
 * - Also produces flat questions[] for backward compat (sidebar, auto-save, navigation)
 * - Ensures question.id and option.id when missing
 */
export function normalizeBackendTestResponse(
  raw: BackendSimulationResponse | Record<string, unknown>,
): BackendSimulationResponse {
  const out = { ...raw } as BackendSimulationResponse;

  if (out.listening_test?.sections) {
    const lt = out.listening_test as BackendListeningTest & { id?: string };
    // Sort sections by section_number to ensure correct order
    const sortedSections = [...(out.listening_test.sections as SectionLike[])].sort(
      (a, b) => (a.section_number ?? 0) - (b.section_number ?? 0),
    );
    out.listening_test = {
      ...out.listening_test,
      id: lt.id ?? "listening-default",
      sections: sortedSections.map((s, i) => {
        const sid = s.id ?? `sec-${s.section_number ?? i + 1}`;
        const { questions, question_groups } = sectionParts(s, sid);
        return {
          ...s,
          id: sid,
          instructions: s.instructions ?? "",
          questions,
          question_groups,
        } as BackendListeningSection;
      }),
    };
  }

  if (out.reading_test?.passages) {
    // Sort passages by passage_number to ensure correct order
    const sortedPassages = [...(out.reading_test.passages as SectionLike[])].sort(
      (a, b) => (a.passage_number ?? 0) - (b.passage_number ?? 0),
    );
    out.reading_test = {
      ...out.reading_test,
      id: (out.reading_test as { id?: string }).id ?? "reading-default",
      passages: sortedPassages.map((p, i) => {
        const pid = p.id ?? `pass-${p.passage_number ?? i + 1}`;
        const { questions, question_groups } = sectionParts(p, pid);
        return {
          ...p,
          id: pid,
          title: p.title ?? "",
          content: p.content ?? "",
          word_count: p.word_count ?? 0,
          questions,
          question_groups,
        } as BackendReadingPassage;
      }),
    };
  }

  if (out.writing_test?.tasks) {
    out.writing_test = {
      ...out.writing_test,
      id: (out.writing_test as { id?: string }).id ?? "writing-default",
      tasks: out.writing_test.tasks.map((t, i) => ({
        ...t,
        id: (t as { id?: string }).id ?? `task-${t.task_number ?? i + 1}`,
      })),
    };
  }

  return out;
}

/**
 * Normalizes content endpoint response (per-section).
 * Ensures question IDs, option IDs, and sorts sections/passages.
 */
export function normalizeContentResponse(raw: ContentResponse): ContentResponse {
  const out = { ...raw };
  if (!out.content) return out;

  if (out.content.type === "listening") {
    const sortedSections = [...(out.content.sections as SectionLike[])].sort(
      (a, b) => (a.section_number ?? 0) - (b.section_number ?? 0),
    );
    // Some backends only populate audio_url on the section(s), not at the
    // content level. Hoist the first available section URL up so the player
    // (which reads content.audio_url) always finds it.
    const hoistedAudioUrl =
      out.content.audio_url ??
      sortedSections.find((s) => s.audio_url)?.audio_url ??
      null;
    out.content = {
      ...out.content,
      audio_url: hoistedAudioUrl,
      sections: sortedSections.map((s, i) => {
        const sid = s.id ?? `sec-${s.section_number ?? i + 1}`;
        const { questions, question_groups } = sectionParts(s, sid);
        return {
          ...s,
          id: sid,
          instructions: s.instructions ?? "",
          questions,
          question_groups,
        } as BackendListeningSection;
      }),
    };
  }

  if (out.content.type === "reading") {
    const sortedPassages = [...(out.content.passages as SectionLike[])].sort(
      (a, b) => (a.passage_number ?? 0) - (b.passage_number ?? 0),
    );
    out.content = {
      ...out.content,
      passages: sortedPassages.map((p, i) => {
        const pid = p.id ?? `pass-${p.passage_number ?? i + 1}`;
        const { questions, question_groups } = sectionParts(p, pid);
        return {
          ...p,
          id: pid,
          title: p.title ?? "",
          content: p.content ?? "",
          word_count: p.word_count ?? 0,
          questions,
          question_groups,
        } as BackendReadingPassage;
      }),
    };
  }

  // Writing tasks: just ensure IDs
  if (out.content.type === "writing") {
    out.content = {
      ...out.content,
      tasks: out.content.tasks.map((t, i) => ({
        ...t,
        id: (t as { id?: string }).id ?? `task-${t.task_number ?? i + 1}`,
      })),
    };
  }

  return out;
}
