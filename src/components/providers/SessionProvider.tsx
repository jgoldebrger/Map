"use client";

import type { Session } from "next-auth";
import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";

/** Only mount under admin/login layouts — avoids session polling on public pages. */
export function SessionProvider({
  children,
  session,
}: {
  children: React.ReactNode;
  session?: Session | null;
}) {
  return (
    <NextAuthSessionProvider
      session={session}
      basePath="/api/auth"
      refetchOnWindowFocus={false}
    >
      {children}
    </NextAuthSessionProvider>
  );
}
