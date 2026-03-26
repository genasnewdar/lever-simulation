export interface Student {
  id: string;
  name: string;
  joinedAt: Date;
}

export interface ExamSession {
  code: string;
  testId: string;
  status: "waiting" | "started" | "finished";
  students: Student[];
  createdAt: Date;
}

// In-memory store for exam sessions
// Note: In production, this would be a database or Redis
const globalForExamSessions = global as unknown as {
  examSessions: Record<string, ExamSession> | undefined;
};

export const examSessions: Record<string, ExamSession> =
  globalForExamSessions.examSessions || {};

if (process.env.NODE_ENV !== "production") {
  globalForExamSessions.examSessions = examSessions;
}

export function generateSessionCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "IELTS-";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
