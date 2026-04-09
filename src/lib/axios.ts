"use client";

import axios from "axios";

// Independent instance for auth fetching to avoid circular interceptors
const authApi = axios.create();

let accessToken: string | null = null;
let tokenFetchPromise: Promise<string | null> | null = null;

// Public paths that don't need Auth0 tokens
const PUBLIC_PATHS = ["/ielts/mock-exam", "/ielts/take-test", "/ielts/results"];

function isPublicPage(): boolean {
  if (typeof window === "undefined") return false;
  return PUBLIC_PATHS.some((p) => window.location.pathname.startsWith(p));
}

const getAccessToken = async (): Promise<string | null> => {
  // On public exam pages, skip Auth0 token entirely
  if (isPublicPage()) return null;

  if (accessToken) return accessToken;
  if (tokenFetchPromise) return tokenFetchPromise;

  tokenFetchPromise = (async () => {
    try {
      const { data } = await authApi.get("/api/auth/token");
      accessToken = data.accessToken || null;
      return accessToken;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        // Session expired — redirect to login (only on protected pages)
        if (typeof window !== "undefined" && !isPublicPage()) {
          window.location.href = "/auth/logout?returnTo=/auth/login";
        }
        return null;
      }
      console.error("Failed to fetch access token:", error);
      return null;
    } finally {
      tokenFetchPromise = null;
    }
  })();

  return tokenFetchPromise;
};

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(async (config) => {
  if (typeof window !== "undefined") {
    if (isPublicPage()) {
      // On public exam pages, send exam code header instead of Auth0 token
      const stored = localStorage.getItem("exam-code-storage");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          const examCode = parsed?.state?.examCode;
          if (examCode && config.headers) {
            config.headers["X-Exam-Code"] = examCode;
          }
        } catch {
          // Ignore parse errors
        }
      }
    } else {
      const token = await getAccessToken();
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
  }
  return config;
});

// Optional: specific interceptor to handle 401s and retry (clearing token)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      accessToken = null; // Clear cached token
      const newToken = await getAccessToken();
      if (newToken) {
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      }
      // On public pages, just reject — don't redirect
      // getAccessToken already redirects on 401 from token route for protected pages
    }
    return Promise.reject(error);
  }
);
