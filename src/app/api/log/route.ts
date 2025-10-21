import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const logsDir = path.join(process.cwd(), "logs");
const logFilePath = path.join(logsDir, "access.log");
const counterFilePath = path.join(logsDir, "counter.json");

// Ensure logs folder exists
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });

// Helper: Rotate logs older than 60 days
function rotateLogsIfNeeded() {
  if (fs.existsSync(logFilePath)) {
    const stats = fs.statSync(logFilePath);
    const fileAgeMs = Date.now() - stats.mtime.getTime();
    const sixtyDaysMs = 60 * 24 * 60 * 60 * 1000; // 60 days

    if (fileAgeMs > sixtyDaysMs) {
      const timestamp = new Date().toISOString().split("T")[0];
      const archivedFile = path.join(logsDir, `access-${timestamp}.log`);

      // Rename the old file
      fs.renameSync(logFilePath, archivedFile);

      // Create a new empty log file
      fs.writeFileSync(logFilePath, "");

      console.log(`Rotated log file → ${archivedFile}`);
    }
  }
}

// Helper: Delete archived logs older than 1 year
function cleanupOldLogs() {
  const oneYearMs = 365 * 24 * 60 * 60 * 1000; // 1 year
  const now = Date.now();

  if (!fs.existsSync(logsDir)) return;
  const files = fs.readdirSync(logsDir);

  for (const file of files) {
    if (file.startsWith("access-") && file.endsWith(".log")) {
      const filePath = path.join(logsDir, file);
      const stats = fs.statSync(filePath);
      const fileAgeMs = now - stats.mtime.getTime();

      if (fileAgeMs > oneYearMs) {
        fs.unlinkSync(filePath);
        console.log(`🧹 Deleted old log file: ${file}`);
      }
    }
  }
}

export async function POST(req: Request) {
  try {
    const { ip, url } = await req.json();

    // Run rotation and cleanup before logging
    rotateLogsIfNeeded();
    cleanupOldLogs();

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
