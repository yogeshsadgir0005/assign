import { http } from "@/lib/http";
import type { SessionUser } from "@/lib/session";

type LoginResponse = SessionUser & {
  accessToken: string;
  refreshToken: string;
  email: string;
};

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
