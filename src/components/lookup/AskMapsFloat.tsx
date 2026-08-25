"use client";

import { useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ShipDateChatCore } from "@/components/lookup/ShipDateChatCore";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
};

export function AskMapsFloat({ className }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className={cn("pointer-events-none fixed inset-0 z-40", className)}>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="pointer-events-auto fixed right-0 top-1/2 z-40 flex -translate-y-1/2 items-center gap-2 rounded-l-lg border border-r-0 bg-primary px-2 py-3 text-primary-foreground shadow-lg transition hover:bg-primary/90"
          aria-label="Open Ask Maps"
        >
          <MessageCircle className="h-5 w-5 shrink-0" />
          <span
            className="text-sm font-semibold tracking-wide"
            style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
          >
            Ask Maps
          </span>
        </button>
      )}

      {open && (
        <div className="pointer-events-auto fixed inset-y-4 right-4 z-40 flex w-full max-w-sm flex-col rounded-xl glass-panel shadow-2xl">
          <div className="flex items-start justify-between gap-2 border-b px-4 py-3">
            <div>
              <h2 className="font-semibold">Ask Maps</h2>
              <p className="text-xs text-muted-foreground">
                Ship dates from your territory map data
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0"
              onClick={() => setOpen(false)}
              aria-label="Close Ask Maps"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-4">
            <ShipDateChatCore compact />
          </div>
        </div>
      )}
    </div>
  );
}
