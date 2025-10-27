// app/api/log/route.ts
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const runtime = "nodejs"; // ✅ Required for fs

const logsDir = path.join(process.cwd(), "logs");
const logFilePath = path.join(logsDir, "access.log");
const counterFilePath = path.join(logsDir, "counter.json");

if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });

function rotateLogsIfNeeded() {
  if (fs.existsSync(logFilePath)) {
    const stats = fs.statSync(logFilePath);
    const fileAgeMs = Date.now() - stats.mtime.getTime();
    const sixtyDaysMs = 60 * 24 * 60 * 60 * 1000;
    if (fileAgeMs > sixtyDaysMs) {
      const timestamp = new Date().toISOString().split("T")[0];
      const archivedFile = path.join(logsDir, `access-${timestamp}.log`);
      fs.renameSync(logFilePath, archivedFile);
      fs.writeFileSync(logFilePath, "");
    }
  }
}

function cleanupOldLogs() {
  const oneYearMs = 365 * 24 * 60 * 60 * 1000;
  const now = Date.now();
  if (!fs.existsSync(logsDir)) return;
  for (const file of fs.readdirSync(logsDir)) {
    if (file.startsWith("access-") && file.endsWith(".log")) {
      const filePath = path.join(logsDir, file);
      const stats = fs.statSync(filePath);
      if (now - stats.mtime.getTime() > oneYearMs) fs.unlinkSync(filePath);
    }
  }
}

export async function POST(req: Request) {
  try {
    const { ip, url } = await req.json();
    rotateLogsIfNeeded();
    cleanupOldLogs();

    const logEntry = `[${new Date().toISOString()}] IP: ${ip} visited ${url}\n`;
    fs.appendFileSync(logFilePath, logEntry);

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
