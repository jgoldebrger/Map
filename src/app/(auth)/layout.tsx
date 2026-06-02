import { Suspense } from "react";
import { SessionProvider } from "@/components/providers/SessionProvider";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center">Loading...</div>
        }
      >
        {children}
      </Suspense>
    </SessionProvider>
  );
}
