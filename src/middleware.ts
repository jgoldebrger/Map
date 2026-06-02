import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;

  // RSC flight requests cannot follow middleware redirects (causes 500 on Vercel)
  if (nextUrl.searchParams.has("_rsc")) {
    return NextResponse.next();
  }

  const isLoggedIn = !!req.auth;
  const isAdmin = nextUrl.pathname.startsWith("/admin");
  const isLogin = nextUrl.pathname === "/login";

  if (isAdmin && !isLoggedIn) {
    const login = new URL("/login", nextUrl);
    login.searchParams.set("callbackUrl", nextUrl.pathname + nextUrl.search);
    return NextResponse.redirect(login);
  }

  if (isLogin && isLoggedIn) {
    return NextResponse.redirect(new URL("/admin", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin", "/admin/:path*", "/login"],
};
