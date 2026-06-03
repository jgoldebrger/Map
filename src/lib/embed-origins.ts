/** Parse comma-separated origins for CSP frame-ancestors (embed whitelist). */
export function parseEmbedAllowedOrigins(
  raw = process.env.EMBED_ALLOWED_ORIGINS,
): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
}

export function buildFrameAncestorsDirective(extraOrigins: string[]): string {
  const origins = ["'self'", ...extraOrigins];
  return `frame-ancestors ${origins.join(" ")}`;
}

export function getPublicAppUrl(): string {
  const url =
    process.env.AUTH_URL?.trim() || process.env.NEXTAUTH_URL?.trim() || "";
  if (url) return url.replace(/\/$/, "");
  return "https://YOUR-PRODUCTION-DOMAIN";
}

export function buildEmbedIframeSnippet(baseUrl: string): string {
  const src = `${baseUrl.replace(/\/$/, "")}/embed/map`;
  return `<iframe
  src="${src}"
  width="100%"
  height="600"
  style="border:0;"
  loading="lazy"
  title="Fabuwood shipping territory map"
></iframe>`;
}
