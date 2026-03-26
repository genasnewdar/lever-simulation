"use client";

import axios from "axios";

// Independent instance for auth fetching to avoid circular interceptors
const authApi = axios.create();

let accessToken: string | null = null;
let tokenFetchPromise: Promise<string | null> | null = null;
let sessionExpired = false;

const getAccessToken = async (): Promise<string | null> => {
  if (accessToken) return accessToken;
  if (tokenFetchPromise) return tokenFetchPromise;

  tokenFetchPromise = (async () => {
    try {
      // Calls the Next.js API route that wraps Auth0 session retrieval
      const { data } = await authApi.get("/api/auth/token");
      accessToken = data.accessToken || null;
      return accessToken;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        sessionExpired = true;
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
    const token = await getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
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
      // Session is truly expired (401 from /api/auth/token) — redirect to login
      if (typeof window !== "undefined" && sessionExpired) {
        window.location.href = "/auth/login";
      }
    }
    return Promise.reject(error);
  }
);
