"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { SESSION_EXPIRED_EVENT, readToken } from "@/lib/session";

/**
 * Renders children only once a token is confirmed, so the product pages are
 * never painted for a signed-out visitor and then yanked away.
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    if (readToken()) {
      setAllowed(true);
      return;
    }
    router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [router, pathname]);

  useEffect(() => {
    function onExpired() {
      setAllowed(false);
      router.replace(`/login?next=${encodeURIComponent(pathname)}&reason=expired`);
    }
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  }, [router, pathname]);

  if (!allowed) return null;
  return <>{children}</>;
}
