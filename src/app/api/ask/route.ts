import { NextRequest, NextResponse } from "next/server";
import { runShippingAgent } from "@/lib/ai/agent";
import { askRequestSchema } from "@/lib/validators/ask";

export const runtime = "nodejs";

const LIMIT = 20;
const WINDOW_MS = 60 * 60 * 1000;

type RateEntry = { count: number; resetAt: number };

const rateLimitStore = new Map<string, RateEntry>();

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip") ?? "unknown";
}

function checkRateLimit(ip: string): { allowed: boolean; retryAfterSec?: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true };
  }

  if (entry.count >= LIMIT) {
    return { allowed: false, retryAfterSec: Math.ceil((entry.resetAt - now) / 1000) };
  }

  entry.count += 1;
  return { allowed: true };
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rate = checkRateLimit(ip);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: rate.retryAfterSec
          ? { "Retry-After": String(rate.retryAfterSec) }
          : undefined,
      },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = askRequestSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.flatten().fieldErrors.message?.[0] ?? "Invalid request";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (!process.env.OPENAI_API_KEY?.trim()) {
    return NextResponse.json(
      { error: "Ship date assistant is not configured (missing OPENAI_API_KEY)." },
      { status: 503 },
    );
  }

  try {
    const { answer, sources } = await runShippingAgent(
      parsed.data.message,
      parsed.data.history ?? [],
    );
    return NextResponse.json({ answer, sources });
  } catch (err) {
    console.error("POST /api/ask failed:", err);
    return NextResponse.json(
      { error: "The assistant could not process your question. Please try again." },
      { status: 500 },
    );
  }
}
