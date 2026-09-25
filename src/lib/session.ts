const TOKEN_KEY = "padmin.token";
const USER_KEY = "padmin.user";

export type SessionUser = {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  image: string;
};

/**
 * Read synchronously so the route guard can decide before the first paint
 * instead of flashing the protected page and then redirecting.
 */
export function readToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function readUser(): SessionUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as SessionUser) : null;
  } catch {
    return null;
  }
}

export function saveSession(token: string, user: SessionUser) {
  try {
    window.localStorage.setItem(TOKEN_KEY, token);
    window.localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {
    // Private-mode storage failures shouldn't break the login flow.
  }
}

export function clearSession() {
  try {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(USER_KEY);
  } catch {
    // ignore
  }
}

export const SESSION_EXPIRED_EVENT = "padmin:session-expired";

/** Fired by the Axios interceptor on a 401 so the guard can redirect once. */
export function announceSessionExpired() {
  clearSession();
  window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
}
