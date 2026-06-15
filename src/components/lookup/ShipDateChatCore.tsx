"use client";

import { useCallback, useRef, useState } from "react";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ScheduleAnswer } from "@/lib/shipping/schedule";
import { USPS_STATE_NAMES } from "@/lib/us-states";
import type { AskMessage } from "@/lib/validators/ask";

type ChatMessage = AskMessage & { sources?: ScheduleAnswer[] };

export const EXAMPLE_PROMPTS = [
  "Next ship date for Bergen County, NJ",
  "When does ZIP 60601 ship?",
  "What territories ship in Florida?",
];

type Props = {
  compact?: boolean;
  className?: string;
};

export function ShipDateChatCore({ compact, className }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
    });
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading) return;

      setError(null);
      setLoading(true);
      setInput("");

      const userMessage: ChatMessage = { role: "user", content: trimmed };
      setMessages((prev) => [...prev, userMessage]);
      scrollToBottom();

      const history = messages.map(({ role, content }) => ({ role, content }));

      try {
        const res = await fetch("/api/ask", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: trimmed, history }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(typeof data.error === "string" ? data.error : "Request failed");
          return;
        }
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.answer as string,
            sources: data.sources as ScheduleAnswer[] | undefined,
          },
        ]);
        scrollToBottom();
      } catch {
        setError("Could not reach the assistant. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [loading, messages, scrollToBottom],
  );

  return (
    <div className={className}>
      {messages.length === 0 && (
        <div className="flex flex-wrap gap-2">
          {EXAMPLE_PROMPTS.map((prompt) => (
            <Button
              key={prompt}
              type="button"
              variant="outline"
              size="sm"
              className="text-xs h-auto py-1.5 whitespace-normal text-left"
              onClick={() => sendMessage(prompt)}
            >
              {prompt}
            </Button>
          ))}
        </div>
      )}

      {messages.length > 0 && (
        <div
          ref={listRef}
          className={`overflow-y-auto space-y-3 rounded-md border bg-muted/20 p-3 ${
            compact ? "max-h-[min(420px,50vh)]" : "max-h-80"
          }`}
        >
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`text-sm ${msg.role === "user" ? "text-right" : "text-left"}`}
            >
              <div
                className={`inline-block max-w-[95%] rounded-lg px-3 py-2 ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-white border shadow-sm"
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-2 space-y-2 border-t pt-2 text-left">
                    {msg.sources.map((source, j) => (
                      <SourceCard key={j} source={source} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Looking up schedule…
            </div>
          )}
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <form
        className="flex gap-2 mt-3"
        onSubmit={(e) => {
          e.preventDefault();
          void sendMessage(input);
        }}
      >
        <Input
          placeholder="Ask about ship dates…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
        />
        <Button type="submit" size="icon" disabled={loading || !input.trim()}>
          <Send className="h-4 w-4" />
          <span className="sr-only">Send</span>
        </Button>
      </form>
    </div>
  );
}

function SourceCard({ source }: { source: ScheduleAnswer }) {
  const location = source.zip
    ? `ZIP ${source.zip}${source.city ? ` (${source.city})` : ""}`
    : source.county && source.state
      ? `${source.county}, ${source.state}`
      : source.state
        ? `${USPS_STATE_NAMES[source.state] ?? source.state} (${source.state})`
        : source.territory;

  return (
    <div className="rounded border bg-muted/40 p-2 text-xs space-y-1">
      <p className="font-medium">{location}</p>
      <p className="text-muted-foreground">{source.territory}</p>
      {source.shipDays.length > 0 && (
        <p>
          Ship days: {source.shipDays.join(", ")}
          {source.cutoffDay ? ` · Cutoff: ${source.cutoffDay}` : ""}
        </p>
      )}
      {source.nextShipDates.length > 0 && (
        <p>Next dates: {source.nextShipDates.join(", ")}</p>
      )}
      {source.zipOverride && source.countyTerritory && (
        <p className="text-muted-foreground">County default: {source.countyTerritory}</p>
      )}
    </div>
  );
}
