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

/** Extract flat questions from section (from groups or direct questions) */
function sectionQuestions(section: SectionLike, sectionId: string): BackendQuestion[] {
  if (section.questions?.length) {
    return section.questions.map((q) =>
      ensureQuestionId(
        { ...q, options: ensureOptionIds(q.options) },
        sectionId,
      ),
    );
  }
  const groups = section.question_groups ?? [];
  const flat: BackendQuestion[] = [];
  for (const g of groups) {
    const gid = g.id ?? sectionId;
    for (const q of g.questions ?? []) {
      flat.push(
        ensureQuestionId(
          { ...q, options: ensureOptionIds(q.options) },
          gid,
        ),
      );
    }
  }
  return flat;
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
        const questions = sectionQuestions(s, sid);
        const question_groups = s.question_groups?.length
          ? normalizeQuestionGroups(s.question_groups, sid)
          : undefined;
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
        const questions = sectionQuestions(p, pid);
        const question_groups = p.question_groups?.length
          ? normalizeQuestionGroups(p.question_groups, pid)
          : undefined;
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
    out.content = {
      ...out.content,
      sections: sortedSections.map((s, i) => {
        const sid = s.id ?? `sec-${s.section_number ?? i + 1}`;
        const questions = sectionQuestions(s, sid);
        const question_groups = s.question_groups?.length
          ? normalizeQuestionGroups(s.question_groups, sid)
          : undefined;
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
        const questions = sectionQuestions(p, pid);
        const question_groups = p.question_groups?.length
          ? normalizeQuestionGroups(p.question_groups, pid)
          : undefined;
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
