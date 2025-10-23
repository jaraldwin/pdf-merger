import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";

const gsPath =
  process.platform === "win32"
    ? "C:\\Program Files\\gs\\gs10.06.0\\bin\\gswin64c.exe"
    : "gs";

/**
 * Ghostscript compression presets:
 * - screen   = smallest (low dpi)
 * - ebook    = medium
 * - printer  = high quality
 * - prepress = max quality
 * - default  = no compression
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const level =
      (formData.get("compression") as string) || "default";

    if (!file) {
      return NextResponse.json(
        { error: "No file uploaded" },
        { status: 400 }
      );
    }

    // Store uploaded file temporarily
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const inputPath = path.join(os.tmpdir(), `input-${Date.now()}.pdf`);
    const outputPath = path.join(os.tmpdir(), `output-${Date.now()}.pdf`);
    fs.writeFileSync(inputPath, buffer);

    // Prepare Ghostscript args
    const args = [
      "-sDEVICE=pdfwrite",
      `-dCompatibilityLevel=1.4`,
      `-dPDFSETTINGS=/${level}`, // <- Ghostscript compression preset
      "-dNOPAUSE",
      "-dQUIET",
      "-dBATCH",
      `-sOutputFile=${outputPath}`,
      inputPath,
    ];

    console.log("Running Ghostscript:", gsPath, args.join(" "));

    // Run Ghostscript
    const result = await new Promise<{ code: number | null; stderr: string }>(
      (resolve) => {
        const child = spawn(gsPath, args);
        let stderr = "";

        child.stderr.on("data", (data) => {
          stderr += data.toString();
        });

        child.on("close", (code) => {
          resolve({ code, stderr });
        });
      }
    );

    if (result.code !== 0) {
      console.error("Ghostscript error:", result.stderr);
      return NextResponse.json(
        { error: "Ghostscript compression failed", details: result.stderr },
        { status: 500 }
      );
    }

    // Read compressed file
    const outputBuffer = fs.readFileSync(outputPath);

    // Clean up temporary files
    fs.unlinkSync(inputPath);
    fs.unlinkSync(outputPath);

    return new NextResponse(outputBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=compressed.pdf",
      },
    });
  } catch (err) {
    console.error("Compression API error:", err);
    return NextResponse.json(
      { error: "Internal server error", details: `${err}` },
      { status: 500 }
    );
  }
}
