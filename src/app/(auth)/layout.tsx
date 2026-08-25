import { Suspense } from "react";
import { SessionProvider } from "@/components/providers/SessionProvider";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <Suspense
        fallback={
          <div className="hero-gradient flex min-h-screen items-center justify-center">
            <p className="text-sm text-muted-foreground">Loading…</p>
          </div>
        }
      >
        {children}
      </Suspense>
    </SessionProvider>
  );
}
