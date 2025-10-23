// /app/api/split/route.ts
import { NextResponse } from "next/server";
import { PDFDocument } from "pdf-lib";

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get("file") as File;
  const range = (formData.get("range") as string)?.trim();

  if (!file || !range) {
    return NextResponse.json({ error: "Missing file or range" }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  const totalPages = pdfDoc.getPageCount();

  // Parse user-defined ranges (e.g. "1-3,5,8-10")
  const pagesToExtract = new Set<number>();
  range.split(",").forEach((part) => {
    if (part.includes("-")) {
      const [start, end] = part.split("-").map(Number);
      for (let i = start; i <= end; i++) pagesToExtract.add(i);
    } else {
      pagesToExtract.add(Number(part));
    }
  });

  // Create a new PDF with selected pages
  const newPdf = await PDFDocument.create();
  const copiedPages = await newPdf.copyPages(
    pdfDoc,
    Array.from(pagesToExtract)
      .filter((n) => n > 0 && n <= totalPages)
      .map((n) => n - 1)
  );
  copiedPages.forEach((p) => newPdf.addPage(p));

  const extractedPdfBytes = await newPdf.save();

  return new Response(Buffer.from(extractedPdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": "attachment; filename=extracted-pages.pdf",
    },
  });
}
