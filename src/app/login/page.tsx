import { Suspense } from "react";
import { LoginForm } from "@/components/login/LoginForm";

export const metadata = { title: "Sign in · Products admin" };

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-start justify-center px-4 pt-[14vh] pb-12">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
