import type { ReactNode } from "react";

export function AdminPage({ children }: { children: ReactNode }) {
  return <div className="mx-auto max-w-6xl space-y-6 p-8">{children}</div>;
}
