import { NextRequest, NextResponse } from "next/server";
import { performLookup, isEmptyLookupResult } from "@/lib/services/lookup";
import { lookupSchema } from "@/lib/validators/lookup";

export async function GET(request: NextRequest) {
  const type = request.nextUrl.searchParams.get("type") ?? "zip";
  const query =
    request.nextUrl.searchParams.get("q") ??
    request.nextUrl.searchParams.get("query") ??
    "";

  const parsed = lookupSchema.safeParse({ type, query });
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    const message =
      fieldErrors.query?.[0] ?? fieldErrors.type?.[0] ?? "Invalid request";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const result = await performLookup(parsed.data.type, parsed.data.query);
  if (isEmptyLookupResult(result)) {
    return NextResponse.json({ error: "No results found" }, { status: 404 });
  }

  return NextResponse.json(result);
}
