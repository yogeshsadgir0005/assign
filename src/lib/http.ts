import axios from "axios";
import { announceSessionExpired, readToken } from "./session";
import { toApiError } from "./api-error";

export const http = axios.create({
  baseURL: "https://dummyjson.com",
  timeout: 20000,
});

/**
 * DummyJSON honours `?delay=<ms>`. The app mirrors any `delay` in its own URL
 * onto every API call, so out-of-order responses can be tested for real:
 * /products?delay=2000
 */
let artificialDelayMs = 0;

export function setArtificialDelay(ms: number) {
  artificialDelayMs = Number.isFinite(ms) && ms > 0 ? Math.min(ms, 10000) : 0;
}

http.interceptors.request.use((config) => {
  const token = readToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (artificialDelayMs > 0) {
    config.params = { ...config.params, delay: artificialDelayMs };
  }
  return config;
});

http.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    const apiError = toApiError(error);
    if (apiError.kind === "unauthorized" && typeof window !== "undefined") {
      announceSessionExpired();
    }
    return Promise.reject(apiError);
  },
);
