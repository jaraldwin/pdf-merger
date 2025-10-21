import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const ip = forwardedFor?.split(",")[0]?.trim() || "Unknown IP";
  const url = request.nextUrl.pathname;

  if (
    !url.startsWith("/_next") &&
    !url.startsWith("/api") &&
    !url.startsWith("/favicon") &&
    !url.startsWith("/assets")
  ) {
    // Send data to the API (runs in Node.js)
    fetch(`${request.nextUrl.origin}/api/log`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ip, url }),
    }).catch(() => {});
  }

  return NextResponse.next();
}
