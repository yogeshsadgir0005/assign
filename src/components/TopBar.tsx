"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { clearSession, useSession } from "@/lib/session";
import { Button } from "@/components/ui/Button";

export function TopBar() {
  const router = useRouter();
  const { user } = useSession();

  function signOut() {
    clearSession();
    router.replace("/login");
  }

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-surface">
      <div className="flex h-12 items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/products"
          className="text-sm font-semibold tracking-tight text-ink hover:text-accent"
        >
          Products admin
        </Link>
        <div className="flex items-center gap-3">
          {user ? (
            <span className="hidden text-[13px] text-ink-3 sm:inline">{user.username}</span>
          ) : null}
          <Button size="sm" onClick={signOut}>
            Sign out
          </Button>
        </div>
      </div>
    </header>
  );
}
