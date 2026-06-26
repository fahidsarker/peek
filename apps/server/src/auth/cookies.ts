export const SESSION_COOKIE = "peek_session";
export const SESSION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

export function sessionCookieOptions() {
  const isProd = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_MAX_AGE_MS / 1000,
  };
}

export function parseCookies(header: string | undefined): Record<string, string> {
  if (!header) return {};
  return Object.fromEntries(
    header.split(";").map((part) => {
      const [key, ...rest] = part.trim().split("=");
      return [key, decodeURIComponent(rest.join("="))];
    }),
  );
}

export function getSessionTokenFromCookie(
  header: string | undefined,
): string | null {
  const cookies = parseCookies(header);
  return cookies[SESSION_COOKIE] ?? null;
}
