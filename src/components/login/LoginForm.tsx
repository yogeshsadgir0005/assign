"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { login } from "@/api/auth";
import { ApiError } from "@/lib/api-error";
import { readToken, saveSession } from "@/lib/session";
import { Button } from "@/components/ui/Button";
import { Field, controlClass } from "@/components/ui/Field";

type Errors = { username?: string; password?: string };

function validate(username: string, password: string): Errors {
  const errors: Errors = {};
  if (!username.trim()) errors.username = "Enter your username.";
  if (!password) errors.password = "Enter your password.";
  return errors;
}

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") ?? "/products";
  const expired = params.get("reason") === "expired";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [showErrors, setShowErrors] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const usernameRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  // Someone who still holds a token has no business on this page.
  useEffect(() => {
    if (!expired && readToken()) router.replace(next);
  }, [router, next, expired]);

  function revalidate(nextUsername: string, nextPassword: string) {
    if (showErrors) setErrors(validate(nextUsername, nextPassword));
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (submitting) return;

    const found = validate(username, password);
    setErrors(found);
    setShowErrors(true);
    if (found.username) {
      usernameRef.current?.focus();
      return;
    }
    if (found.password) {
      passwordRef.current?.focus();
      return;
    }

    setFormError(null);
    setSubmitting(true);
    try {
      const { token, user } = await login(username.trim(), password);
      saveSession(token, user);
      router.replace(next);
    } catch (error) {
      const apiError = error as ApiError;
      setFormError(
        apiError.kind === "credentials" || apiError.kind === "unauthorized"
          ? "That username and password don't match an account."
          : apiError.message,
      );
      passwordRef.current?.focus();
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="w-full max-w-[22rem]">
      <p className="text-[13px] font-medium tracking-wide text-ink-3 uppercase">Products admin</p>
      <h1 className="mt-1 text-xl font-semibold text-ink">Sign in</h1>
      <p className="mt-1 text-sm text-ink-2">
        The catalogue is only readable once you have a token.
      </p>

      {expired ? (
        <p className="mt-4 border-l-2 border-warn bg-warn-soft py-2 pl-2.5 text-[13px] text-ink-2">
          Your session expired, so we signed you out. Sign in to pick up where you left off.
        </p>
      ) : null}

      <div className="mt-5 space-y-3.5">
        <Field id="username" label="Username" error={showErrors ? errors.username : null} required>
          <input
            id="username"
            ref={usernameRef}
            className={`${controlClass} h-9`}
            value={username}
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            aria-invalid={Boolean(showErrors && errors.username)}
            aria-describedby={showErrors && errors.username ? "username-error" : undefined}
            onChange={(e) => {
              setUsername(e.target.value);
              revalidate(e.target.value, password);
            }}
            onBlur={() => {
              setShowErrors(true);
              setErrors(validate(username, password));
            }}
          />
        </Field>

        <Field id="password" label="Password" error={showErrors ? errors.password : null} required>
          <input
            id="password"
            ref={passwordRef}
            type="password"
            className={`${controlClass} h-9`}
            value={password}
            autoComplete="current-password"
            aria-invalid={Boolean(showErrors && errors.password)}
            aria-describedby={showErrors && errors.password ? "password-error" : undefined}
            onChange={(e) => {
              setPassword(e.target.value);
              revalidate(username, e.target.value);
            }}
            onBlur={() => {
              setShowErrors(true);
              setErrors(validate(username, password));
            }}
          />
        </Field>
      </div>

      {formError ? (
        <p role="alert" className="mt-3.5 border-l-2 border-danger bg-danger-soft py-2 pl-2.5 text-[13px] text-ink">
          {formError}
        </p>
      ) : null}

      <Button type="submit" variant="primary" className="mt-4 w-full" disabled={submitting}>
        {submitting ? "Signing in…" : "Sign in"}
      </Button>

      <p className="mt-4 border-t border-line pt-3 text-[13px] text-ink-3">
        Demo account: <span className="font-mono text-ink-2">emilys</span> /{" "}
        <span className="font-mono text-ink-2">emilyspass</span>
      </p>
    </form>
  );
}
