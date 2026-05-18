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
    const deviceToken = parsed?.state?.deviceToken;
    if (config.headers) {
      if (examCode) config.headers["X-Exam-Code"] = examCode;
      // Attach the device token on every request — only attempt-scoped
      // endpoints look at it, and harmless on the rest.
      if (deviceToken) config.headers["X-Device-Token"] = deviceToken;
    }
  } catch {
    // Ignore parse errors
  }
  return config;
});
