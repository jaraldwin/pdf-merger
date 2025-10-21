import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const logsDir = path.join(process.cwd(), "logs");
const logFilePath = path.join(logsDir, "access.log");
const counterFilePath = path.join(logsDir, "counter.json");

// Ensure logs folder exists
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir);

export async function POST(req: Request) {
  try {
    const { ip, url } = await req.json();

    // Write log entry
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] IP: ${ip} visited ${url}\n`;
    fs.appendFileSync(logFilePath, logEntry);

    // Update visitor counter
    let count = 0;
    if (fs.existsSync(counterFilePath)) {
      const data = JSON.parse(fs.readFileSync(counterFilePath, "utf-8"));
      count = data.count || 0;
    }
    count++;
    fs.writeFileSync(counterFilePath, JSON.stringify({ count }, null, 2));

    return NextResponse.json({ success: true, count });
  } catch (error) {
    console.error("Error writing logs:", error);
    return NextResponse.json({ error: "Failed to log visit" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const counterFilePath = path.join(process.cwd(), "logs", "counter.json");
    let count = 0;
    if (fs.existsSync(counterFilePath)) {
      const data = JSON.parse(fs.readFileSync(counterFilePath, "utf-8"));
      count = data.count || 0;
    }
    return NextResponse.json({ count });
  } catch (error) {
    console.error("Error reading visitor count:", error);
    return NextResponse.json({ count: 0 });
  }
}

