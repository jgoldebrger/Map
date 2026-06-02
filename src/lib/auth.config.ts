import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  providers: [],
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  callbacks: {
    redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      try {
        if (new URL(url).origin === new URL(baseUrl).origin) return url;
      } catch {
        // ignore
      }
      return `${baseUrl}/admin`;
    },
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const isAdmin = request.nextUrl.pathname.startsWith("/admin");
      const isLogin = request.nextUrl.pathname === "/login";

      if (isAdmin && !isLoggedIn) {
        const login = new URL("/login", request.nextUrl);
        const returnPath =
          request.nextUrl.pathname + request.nextUrl.search + request.nextUrl.hash;
        login.searchParams.set("callbackUrl", returnPath);
        return Response.redirect(login);
      }
      if (isLogin && isLoggedIn) {
        return Response.redirect(new URL("/admin", request.nextUrl));
      }
      return true;
    },
  },
} satisfies NextAuthConfig;
