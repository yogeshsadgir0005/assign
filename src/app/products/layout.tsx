import type { ReactNode } from "react";
import { AuthGate } from "@/components/AuthGate";
import { TopBar } from "@/components/TopBar";

export default function ProductsLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGate>
      <TopBar />
      {children}
    </AuthGate>
  );
}
