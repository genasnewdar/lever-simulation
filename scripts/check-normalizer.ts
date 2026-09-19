// Run: node scripts/check-normalizer.ts   (node >= 22, type-stripping)
//
// A section that mixes grouped and standalone questions used to lose half of
// itself: the flat list dropped the grouped ones, the panel dropped the loose
// ones. Everything downstream — the number bar, Back/Next, the answered
// underline — is built from these two fields, so this is the check worth having.
import assert from "node:assert";
import { normalizeContentResponse } from "../src/lib/ielts-test-normalizer.ts";

const q = (n: number) => ({
  id: `q${n}`,
  question_number: n,
  question_text: `Q${n}`,
  question_type: "SHORT_ANSWER",
  options: [],
});

const out = normalizeContentResponse({
  current_section: "reading",
  section_time_remaining_seconds: 3600,
  content: {
    type: "reading",
    passages: [
      {
        id: "p1",
        passage_number: 1,
        title: "Passage 1",
        content: "…",
        // Backend shape: grouped questions in the groups, loose ones here.
        questions: [q(6), q(7)],
        question_groups: [
          { id: "g1", order: 1, layout_type: "NONE", questions: [q(1), q(2), q(3)] },
          { id: "g2", order: 2, layout_type: "NONE", questions: [q(8)] },
        ],
      },
    ],
  },
} as never) as never as {
  content: { passages: { questions: { question_number: number }[]; question_groups: { id: string; questions: { question_number: number }[] }[] }[] };
};

const p = out.content.passages[0];

assert.deepStrictEqual(
  p.questions.map((x) => x.question_number),
  [1, 2, 3, 6, 7, 8],
  "flat list must carry grouped AND standalone questions, in number order",
);

assert.deepStrictEqual(
  p.question_groups.map((g) => g.questions.map((x) => x.question_number)),
  [[1, 2, 3], [6, 7], [8]],
  "standalone questions become their own group, placed by question number",
);

assert.strictEqual(p.question_groups[1].id, "p1-ungrouped");

console.log("ok — normalizer keeps every question of a mixed section");
