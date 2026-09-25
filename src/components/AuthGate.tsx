"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getSession, useSession } from "@/lib/session";

/**
 * Renders children only while a token is present, so the product pages are
 * never painted for a signed-out visitor and then yanked away. A 401 clears the
 * session from the Axios interceptor, which lands here as `token === null`.
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { token } = useSession();
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

  if (!token) return null;
  return <>{children}</>;
}
