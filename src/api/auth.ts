import { http } from "@/lib/http";
import type { SessionUser } from "@/lib/session";

type LoginResponse = SessionUser & {
  accessToken: string;
  refreshToken: string;
  email: string;
};

/**
 * The only endpoint that actually checks our token — the product routes are
 * public. The guard calls it once per page load so an expired token signs you
 * out properly instead of lingering until the next write.
 */
export async function fetchCurrentUser(options: { signal?: AbortSignal } = {}) {
  const { data } = await http.get<SessionUser>("/auth/me", { signal: options.signal });
  return data;
}

export async function login(username: string, password: string) {
  const { data } = await http.post<LoginResponse>("/auth/login", {
    username,
    password,
    expiresInMins: 60,
  });

  const user: SessionUser = {
    id: data.id,
    username: data.username,
    firstName: data.firstName,
    lastName: data.lastName,
    image: data.image,
  };

  return { token: data.accessToken, user };
}
