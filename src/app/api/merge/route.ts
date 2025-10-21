import { NextResponse } from "next/server";
import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";

// Save uploaded files temporarily
async function saveFile(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const tempPath = path.join(os.tmpdir(), `${Date.now()}_${file.name}`);
  await fs.promises.writeFile(tempPath, buffer);
  return tempPath;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    const compression = (formData.get("compression") as string) || "screen"; // 👈 from frontend

    if (files.length === 0) {
      return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
    }

    // Save uploaded PDFs to temporary files
    const inputPaths = await Promise.all(files.map(saveFile));
    const outputPath = path.join(os.tmpdir(), `merged_${Date.now()}.pdf`);

    // Ghostscript compression options
    const compressionLevel = `/` + compression; // e.g., /screen, /ebook, etc.

    // Build Ghostscript arguments dynamically
    const args = [
      "-dBATCH",
      "-dNOPAUSE",
      "-dQUIET",
      "-sDEVICE=pdfwrite",
      "-dCompatibilityLevel=1.4",
      `-dPDFSETTINGS=${compressionLevel}`,
      "-dEmbedAllFonts=true",
      "-dSubsetFonts=true",
      "-dCompressFonts=true",
      "-dDetectDuplicateImages=true",
      "-dColorImageDownsampleType=/Bicubic",
      "-dColorImageResolution=100",
      "-dGrayImageDownsampleType=/Bicubic",
      "-dGrayImageResolution=100",
      "-dMonoImageDownsampleType=/Subsample",
      "-dMonoImageResolution=100",
      `-sOutputFile=${outputPath}`,
      ...inputPaths,
    ];

    console.log("🧩 Ghostscript Path:");
    const gsPath =
      process.platform === "win32"
        ? "C:\\Program Files\\gs\\gs10.06.0\\bin\\gswin64c.exe"
        : "gs";

    console.log("🧩 Using Ghostscript:", gsPath);
    console.log("🧩 Compression level:", compressionLevel);
    console.log("🧩 Arguments:", args.join(" "));

    // Run Ghostscript
    await new Promise<void>((resolve, reject) => {
      const gs = spawn(gsPath, args);

      gs.on("error", (err) => reject(err));
      gs.stderr.on("data", (data) =>
        console.error("Ghostscript stderr:", data.toString())
      );
      gs.on("exit", (code) => {
        if (code === 0) resolve();
        else reject(new Error(`Ghostscript exited with code ${code}`));
      });
    });

    // Read merged PDF and return as response
    const mergedBuffer = await fs.promises.readFile(outputPath);

    // Clean up temp files asynchronously
    for (const file of inputPaths) fs.unlink(file, () => {});
    fs.unlink(outputPath, () => {});

    return new Response(mergedBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=merged.pdf",
      },
    });
  } catch (error: unknown) {
    console.error("Error merging PDFs:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to merge PDFs",
      },
      { status: 500 }
    );
  }
}
