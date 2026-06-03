import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { clientIp, consumeRateLimit } from "@/lib/rate-limit";

function hasSessionCookie(request: NextRequest): boolean {
  const names = [
    "authjs.session-token",
    "__Secure-authjs.session-token",
    "next-auth.session-token",
    "__Secure-next-auth.session-token",
  ];
  return names.some((name) => request.cookies.has(name));
}

function rateLimitResponse(retryAfterSec: number) {
  return NextResponse.json(
    { error: "Too many requests. Try again later." },
    {
      status: 429,
      headers: { "Retry-After": String(retryAfterSec) },
    }
  );
}

function checkPublicApiRateLimit(request: NextRequest, pathname: string) {
  const ip = clientIp(request);
  return consumeRateLimit(`api:${pathname}:${ip}`, { limit: 60, windowMs: 60_000 });
}

export function middleware(request: NextRequest) {
  const { nextUrl } = request;
  const pathname = nextUrl.pathname;

  if (
    request.method === "POST" &&
    pathname === "/api/auth/callback/credentials"
  ) {
    const result = consumeRateLimit(`login:${clientIp(request)}`, {
      limit: 10,
      windowMs: 15 * 60_000,
    });
    if (!result.success) {
      return rateLimitResponse(result.retryAfterSec!);
    }
  }

  if (
    request.method === "GET" &&
    (pathname === "/api/search" || pathname === "/api/lookup")
  ) {
    const result = checkPublicApiRateLimit(request, pathname);
    if (!result.success) {
      return rateLimitResponse(result.retryAfterSec!);
    }
  }

  // RSC flight requests cannot follow middleware redirects on Vercel
  if (nextUrl.searchParams.has("_rsc")) {
    return NextResponse.next();
  }

  const isLoggedIn = hasSessionCookie(request);
  const isAdmin = pathname.startsWith("/admin");
  const isLogin = pathname === "/login";

  if (isAdmin && !isLoggedIn) {
    const login = new URL("/login", nextUrl);
    login.searchParams.set("callbackUrl", nextUrl.pathname + nextUrl.search);
    return NextResponse.redirect(login);
  }

  if (isLogin && isLoggedIn) {
    return NextResponse.redirect(new URL("/admin", nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin",
    "/admin/:path*",
    "/login",
    "/api/auth/:path*",
    "/api/search",
    "/api/lookup",
  ],
};
