"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { fetchCurrentUser } from "@/api/auth";
import { getSession, useSession } from "@/lib/session";
import type { ApiError } from "@/lib/api-error";
import { isCanceled } from "@/lib/api-error";

/**
 * Renders children only once a token is present and the API has confirmed it,
 * so the product pages are never painted for someone who can't actually use
 * them. A 401 from the check clears the session in the Axios interceptor,
 * which lands back here as `token === null`.
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { token } = useSession();
  const [confirmed, setConfirmed] = useState(false);
  // Losing a token mid-session is an expiry; never having one is a plain visit.
  const hadToken = useRef(false);

  useEffect(() => {
    if (token) {
      hadToken.current = true;
      return;
    }
    // The hydration render replays the server snapshot, which is always signed
    // out. Bouncing on that would send a signed-in visitor through /login and
    // lose their query string, so ask the store directly before redirecting.
    if (getSession().token) return;

    const target = `${pathname}${window.location.search}`;
    const reason = hadToken.current ? "&reason=expired" : "";
    router.replace(`/login?next=${encodeURIComponent(target)}${reason}`);
  }, [token, router, pathname]);

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    let current = true;

    fetchCurrentUser({ signal: controller.signal })
      .then(() => {
        if (current) setConfirmed(true);
      })
      .catch((error: ApiError) => {
        if (!current || isCanceled(error)) return;
        // A rejected token has already cleared the session, and the effect
        // above will redirect. Anything else — offline, a 5xx — is the API's
        // problem, not a reason to lock someone out of a page they can read.
        if (error.kind !== "unauthorized") setConfirmed(true);
      });

    return () => {
      current = false;
      controller.abort();
    };
  }, [token]);

  if (!token || !confirmed) return null;
  return <>{children}</>;
}
