import axios from "axios";

export type ApiErrorKind =
  | "offline"
  | "timeout"
  | "canceled"
  | "credentials"
  | "unauthorized"
  | "not-found"
  | "server"
  | "client"
  | "unknown";

export class ApiError extends Error {
  kind: ApiErrorKind;
  status?: number;

  constructor(kind: ApiErrorKind, message: string, status?: number) {
    super(message);
    this.name = "ApiError";
    this.kind = kind;
    this.status = status;
  }

  get retryable() {
    return this.kind === "offline" || this.kind === "timeout" || this.kind === "server";
  }
}

export function isCanceled(error: unknown) {
  return error instanceof ApiError && error.kind === "canceled";
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;

  if (axios.isCancel(error)) {
    return new ApiError("canceled", "Request cancelled.");
  }

  if (axios.isAxiosError(error)) {
    if (error.code === "ECONNABORTED") {
      return new ApiError("timeout", "The API took too long to respond.");
    }

    const status = error.response?.status;
    const serverMessage =
      typeof error.response?.data === "object" && error.response?.data !== null
        ? (error.response.data as { message?: string }).message
        : undefined;

    if (status === undefined) {
      return new ApiError("offline", "Can't reach dummyjson.com. Check your connection.");
    }

    // DummyJSON rejects a bad token with 500 {"message":"invalid token"} and
    // only uses 401 when the header is missing altogether, so the message is
    // more reliable than the status code for spotting an auth failure.
    const blamesTheToken = /token|authoriz/i.test(serverMessage ?? "");
    if (status === 401 || status === 403 || blamesTheToken) {
      return new ApiError("unauthorized", serverMessage ?? "Your session has expired.", status);
    }
    if (status === 400) {
      return new ApiError("credentials", serverMessage ?? "The request was rejected.", status);
    }
    if (status === 404) {
      return new ApiError("not-found", serverMessage ?? "Not found.", status);
    }
    if (status >= 500) {
      return new ApiError("server", `The API returned ${status}.`, status);
    }
    return new ApiError("client", serverMessage ?? `The API returned ${status}.`, status);
  }

  return new ApiError("unknown", error instanceof Error ? error.message : "Something failed.");
}
