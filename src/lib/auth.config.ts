import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  providers: [],
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const isAdmin = request.nextUrl.pathname.startsWith("/admin");
      const isLogin = request.nextUrl.pathname === "/login";

      if (isAdmin && !isLoggedIn) return false;
      if (isLogin && isLoggedIn) {
        return Response.redirect(new URL("/admin", request.nextUrl));
      }
      return true;
    },
  },
} satisfies NextAuthConfig;
