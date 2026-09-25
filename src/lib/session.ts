"use client";

import { useSyncExternalStore } from "react";

const TOKEN_KEY = "padmin.token";
const USER_KEY = "padmin.user";

export type SessionUser = {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  image: string;
};

export type Session = { token: string | null; user: SessionUser | null };

const SIGNED_OUT: Session = { token: null, user: null };

let snapshot: Session = SIGNED_OUT;
let loaded = false;
const listeners = new Set<() => void>();

function readFromStorage(): Session {
  try {
    const token = window.localStorage.getItem(TOKEN_KEY);
    const rawUser = window.localStorage.getItem(USER_KEY);
    return {
      token,
      user: rawUser ? (JSON.parse(rawUser) as SessionUser) : null,
    };
  } catch {
    return SIGNED_OUT;
  }
}

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  snapshot = readFromStorage();
}

function emit() {
  listeners.forEach((listener) => listener());
}

export function getSession(): Session {
  load();
  return snapshot;
}

export function readToken(): string | null {
  return getSession().token;
}

export function saveSession(token: string, user: SessionUser) {
  try {
    window.localStorage.setItem(TOKEN_KEY, token);
    window.localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {}
  loaded = true;
  snapshot = { token, user };
  emit();
}

export function clearSession() {
  try {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(USER_KEY);
  } catch {}
  loaded = true;
  snapshot = SIGNED_OUT;
  emit();
}

function onStorage(event: StorageEvent) {
  if (event.key !== TOKEN_KEY && event.key !== USER_KEY) return;
  snapshot = readFromStorage();
  emit();
}

function subscribe(listener: () => void) {
  load();
  if (listeners.size === 0) window.addEventListener("storage", onStorage);
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) window.removeEventListener("storage", onStorage);
  };
}

export function useSession() {
  return useSyncExternalStore(subscribe, getSession, () => SIGNED_OUT);
}

export function announceSessionExpired() {
  if (!snapshot.token && loaded) return;
  clearSession();
}
