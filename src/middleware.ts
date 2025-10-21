import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const config = {
  matcher: ["/((?!_next|api|favicon|assets).*)"], // Ignore static & API routes
  runtime: "nodejs", // ✅ Force Node.js runtime so fetch works properly
};

export async function middleware(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const ip = forwardedFor?.split(",")[0]?.trim() || "Unknown IP";
  const url = request.nextUrl.pathname;

  try {
    await fetch(`${request.nextUrl.origin}/api/log`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ip, url }),
    });
  } catch (err) {
    console.error("Failed to send log:", err);
  }

  return NextResponse.next();
}
