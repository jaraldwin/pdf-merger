import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const config = {
  matcher: ["/((?!_next|api|favicon|assets).*)"],
  runtime: "nodejs",
};

export async function middleware(request: NextRequest) {
  const ip =
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "Unknown IP";

  const url = request.nextUrl.pathname;

  const protocol = "http";
  const host =
    process.env.INTERNAL_HOST ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    "localhost:3000";

  const apiUrl = `${protocol}://${host}/api/log`;

  try {
    await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ip, url }),
    });
  } catch (err) {
    console.error("Failed to send log:", err);
  }

  return NextResponse.next();
}
