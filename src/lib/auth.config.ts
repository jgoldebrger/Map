import type { NextAuthConfig } from "next-auth";



export const authConfig = {
  providers: [],
  pages: { signIn: "/login" },
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 },
  secret: process.env.AUTH_SECRET,
  trustHost: true,
} satisfies NextAuthConfig;


