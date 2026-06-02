/** Only allow in-app paths — blocks localhost / open redirects from bad AUTH_URL env. */
export function safeCallbackUrl(raw: string | null | undefined, fallback = "/admin"): string {
  if (!raw) return fallback;

  if (raw.startsWith("/") && !raw.startsWith("//")) {
    return raw;
  }

  if (typeof window !== "undefined") {
    try {
      const parsed = new URL(raw);
      if (parsed.origin === window.location.origin) {
        return `${parsed.pathname}${parsed.search}${parsed.hash}` || fallback;
      }
    } catch {
      // ignore invalid URL
    }
  }

  return fallback;
}
