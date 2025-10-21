import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const config = {
  matcher: ["/((?!_next|api|favicon|assets).*)"],
  runtime: "nodejs",
};

export async function middleware(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const ip = forwardedFor?.split(",")[0]?.trim() || "Unknown IP";
  const url = request.nextUrl.pathname;

  // Detect base URL correctly
  const host = request.headers.get("host") || "localhost:3000";
  const protocol = process.env.NODE_ENV === "production" ? "http" : "http"; 
  // 👆 Use HTTP even in production since Nginx terminates SSL

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
