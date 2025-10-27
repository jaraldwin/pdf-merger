import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const config = {
  matcher: ["/((?!_next|api|favicon|assets).*)"],
  runtime: "nodejs",
};

export async function middleware(request: NextRequest) {
  // --- IP Detection ---
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("cf-connecting-ip") ||
    (request as unknown as { ip?: string }).ip ||
    "Unknown IP";

  // --- Browser Headers ---
  const referrer = request.headers.get("referer") || "Direct / No Referrer";
  const userAgent = request.headers.get("user-agent") || "Unknown Agent";
  const url = request.url;

  // --- Environment Setup ---
  const isLocal = process.env.NODE_ENV !== "production";
  const protocol = isLocal ? "http" : "https";
  const host = isLocal
    ? process.env.INTERNAL_HOST || "localhost:3000"
    : process.env.NEXT_PUBLIC_BASE_URL?.replace(/^https?:\/\//, "");

  const apiUrl = `${protocol}://${host}/api/log`;

  try {
    // ✅ Send log with browser headers
    await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-forwarded-for": ip,
        "user-agent": userAgent,
        referer: referrer,
      },
      body: JSON.stringify({ ip, url, referrer, userAgent }),
    });
  } catch (err) {
    console.error("Failed to send log:", err);
  }

  return NextResponse.next();
}
