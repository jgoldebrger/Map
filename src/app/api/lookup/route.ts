import { NextRequest, NextResponse } from "next/server";
import { performLookup } from "@/lib/services/lookup";

export async function GET(request: NextRequest) {
  const type = request.nextUrl.searchParams.get("type") ?? "zip";
  const query = request.nextUrl.searchParams.get("q") ?? request.nextUrl.searchParams.get("query") ?? "";

  if (!query.trim()) {
    return NextResponse.json({ error: "Query required" }, { status: 400 });
  }

  const result = await performLookup(type, query.trim());
  if (!result) {
    return NextResponse.json({ error: "No results found" }, { status: 404 });
  }

  return NextResponse.json(result);
}
