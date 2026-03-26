import { Question, QuestionType } from "../types/ielts";
import { BackendQuestion } from "../types/ielts-simulation";

export function mapBackendToQuestion(bq: BackendQuestion): Question {
  let type: QuestionType = "SENTENCE_COMPLETION";
  let content = bq.question_text || "";

  // Replace placeholders if any
  if (content.includes("______")) {
    content = content.replace("______", `[${bq.question_number}]`);
  }

  // Map Categories to Component Types
  switch (bq.question_category) {
    case "MCQ_SINGLE":
      type = "MULTIPLE_CHOICE";
      break;
    case "TABLE_COMPLETION":
      type = "TABLE_COMPLETION";
      break;
    case "MATCHING_LIST":
    case "MATCHING_FEATURES":
      type = "MATCHING_TASK";
      break;
    case "TRUE_FALSE_NOT_GIVEN":
    case "TFNG_SELECT":
      type = "IDENTIFICATION";
      break;
    case "FORM_COMPLETION":
    case "SUMMARY_COMPLETION":
    case "FLOWCHART_COMPLETION":
      type = "SENTENCE_COMPLETION";
      break;
    case "SHORT_ANSWER":
      type = "SHORT_ANSWER";
      break;
    default:
      type = "SENTENCE_COMPLETION";
  }

  const options = (bq.options || []).map((opt) => ({
    id: opt.label.toLowerCase(),
    label: opt.text,
  }));

  const question: Question = {
    id: bq.id,
    type: type,
    questionNumber: bq.question_number,
    title: bq.instructions || bq.question_context || "",
    content: content,
    options,
    validationRules: {
      maxWords: bq.word_limit || undefined,
    },
    rawData: bq,
  };

  // Special handling for MATCHING_TASK if needed
  if (type === "MATCHING_TASK") {
    // If backend doesn't provide explicit matching pairs in this structure,
    // we might need to adapt. For now, assuming standard matching.
    question.matchingData = {
      items: (bq.options || []).map((o) => ({ id: o.label, content: o.text })),
      targets: [
        { id: String(bq.question_number), description: bq.question_text },
      ],
    };
  }

  return question;
}
