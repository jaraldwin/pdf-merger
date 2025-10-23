import { NextResponse } from "next/server";
import { PDFDocument } from "pdf-lib";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const orderStr = formData.get("order") as string | null;

    if (!file || !orderStr) {
      return NextResponse.json(
        { error: "Missing file or order" },
        { status: 400 }
      );
    }

    const order = JSON.parse(orderStr) as number[];

    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const totalPages = pdfDoc.getPageCount();

    // ✅ Validate order array
    if (order.some((n) => n < 0 || n >= totalPages)) {
      return NextResponse.json(
        { error: "Invalid page order" },
        { status: 400 }
      );
    }

    // ✅ Create a new PDF in the desired order
    const newPdf = await PDFDocument.create();
    const copiedPages = await newPdf.copyPages(pdfDoc, order);
    copiedPages.forEach((page) => newPdf.addPage(page));

    const newPdfBytes = await newPdf.save();

    // ✅ Fix TypeScript typing by converting to ArrayBuffer
    const buffer = new Uint8Array(newPdfBytes).buffer;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="reordered.pdf"',
      },
    });
  } catch (err) {
    console.error("PDF reorder failed:", err);
    return NextResponse.json(
      { error: "Failed to reorder PDF" },
      { status: 500 }
    );
  }
}
