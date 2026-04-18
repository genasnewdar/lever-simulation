import type { BackendQuestionGroup } from "@/types/ielts-simulation";

export interface GroupRendererProps {
  group: BackendQuestionGroup;
  reviewSet: Set<number>;
  toggleReview?: (n: number) => void;
  flashQuestionNumber: number | null;
  disabled: boolean;
}
