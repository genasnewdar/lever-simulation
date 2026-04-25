"use client";

import axios from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  if (typeof window === "undefined") return config;

  const stored = localStorage.getItem("exam-code-storage");
  if (!stored) return config;

  try {
    const parsed = JSON.parse(stored);
    const examCode = parsed?.state?.examCode;
    if (examCode && config.headers) {
      config.headers["X-Exam-Code"] = examCode;
    }
  } catch {
    // Ignore parse errors
  }
  return config;
});
