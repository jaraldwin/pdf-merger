"use client";

import React, { useState, useRef } from "react";
import { createWorker } from "tesseract.js";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import * as pdfjsLib from "pdfjs-dist";
interface OCREngineProps {
  darkMode: boolean;
}

interface TesseractWord {
  text: string;
  confidence: number;
  bbox: {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
  };
}

interface TesseractData {
  words?: TesseractWord[];
  imageSize?: {
    width: number;
    height: number;
  };
  // other properties you might need from result.data
}

export default function OCREngine({ darkMode }: OCREngineProps) {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [compression, setCompression] = useState("screen"); // 1. Add compression state
  const [compressionInfo, setCompressionInfo] = useState<string | null>(null); // 2. Add compression info state
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] || null);
    setOutputUrl(null);
    setProgress(0);
    setCompressionInfo(null); // Clear info on new file
  };

  const handleExtract = async () => {
    if (!file) return alert("Please upload a scanned PDF or image.");
    setProcessing(true);
    setProgress(0);
    setCompressionInfo(null);

    try {
      const isPDF = file.type === "application/pdf";
      const base64 = await file.arrayBuffer();
      const images: string[] = [];

      if (isPDF) {
        // Dynamic import for pdfjs-dist
        pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdfjs/pdf.worker.min.mjs";

        const pdf = await pdfjsLib.getDocument({ data: base64 }).promise;
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 2 });
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");

          // You should also ensure ctx is not null before proceeding,
          // though your original code uses the non-null assertion operator (!)

          canvas.width = viewport.width;
          canvas.height = viewport.height;

          // ⚠️ THE FIX IS HERE: Add the canvas property to the parameter object
          await page.render({
            canvas: canvas,
            canvasContext: ctx!,
            viewport,
          }).promise;

          const imgData = canvas.toDataURL("image/png");
          images.push(imgData);
        }
      } else {
        const validTypes = ["image/png", "image/jpeg", "image/jpg"];
        if (!validTypes.includes(file.type)) {
          throw new Error("Unsupported image format. Use PNG or JPG.");
        }
        const imgUrl = URL.createObjectURL(file);
        images.push(imgUrl);
      }

      // --- OCR Process (Same as before) ---
      const pdfDoc = await PDFDocument.create();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

      const worker = await createWorker("eng", 1, {
        logger: (m) => {
          if (m.status === "recognizing text") {
            const percent = Math.floor(m.progress * 100);
            setProgress(percent);
          }
        },
      });

      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        let embeddedImage;

        // 🔹 Embed image
        if (img.startsWith("data:image/png")) {
          embeddedImage = await pdfDoc.embedPng(img);
        } else if (
          img.startsWith("data:image/jpeg") ||
          img.startsWith("data:image/jpg")
        ) {
          embeddedImage = await pdfDoc.embedJpg(img);
        } else {
          const res = await fetch(img);
          const blob = await res.blob();
          const buffer = await blob.arrayBuffer();
          if (blob.type.includes("png")) {
            embeddedImage = await pdfDoc.embedPng(buffer);
          } else {
            embeddedImage = await pdfDoc.embedJpg(buffer);
          }
        }

        // 🔹 OCR recognition
        const result = await worker.recognize(img);
        const tesseractData = result.data as TesseractData;
        const words: TesseractWord[] = tesseractData.words || [];

        const imageWidth = embeddedImage.width;
        const imageHeight = embeddedImage.height;

        const page = pdfDoc.addPage([imageWidth, imageHeight]);
        page.drawImage(embeddedImage, {
          x: 0,
          y: 0,
          width: imageWidth,
          height: imageHeight,
        });

        const imgSize = tesseractData.imageSize || {
          width: imageWidth,
          height: imageHeight,
        };
        const scaleX = imageWidth / imgSize.width;
        const scaleY = imageHeight / imgSize.height;

        // 🔹 Draw invisible text overlay in the right position
        for (const w of words) {
          if (!w.text?.trim()) continue;
          const x = w.bbox.x0 * scaleX;
          const y = imageHeight - w.bbox.y1 * scaleY;
          const height = (w.bbox.y1 - w.bbox.y0) * scaleY;
          const fontSize = Math.max(height * 0.9, 6);

          page.drawText(w.text, {
            x,
            y,
            size: fontSize,
            font,
            color: rgb(0, 0, 0),
            opacity: 0.0,
          });
        }

        setProgress(Math.floor(((i + 1) / images.length) * 100));
      }

      await worker.terminate();

      // 3. Get the initial PDF Blob
      const originalPdfBytes = await pdfDoc.save();

      // 1. Create a standard Array from the Uint8Array iterator.
      // 2. Pass the standard Array to a new Uint8Array constructor.
      // This guarantees a standard Uint8Array backed by an ArrayBuffer, satisfying the Blob constructor's strict requirements.
      const safeArrayBuffer = new Uint8Array(Array.from(originalPdfBytes));

      const originalPdfBlob = new Blob([safeArrayBuffer], {
        type: "application/pdf",
      });
      const originalSize = originalPdfBlob.size / 1024 / 1024; // MB

      // 4. Compress PDF using Ghostscript API
      setProgress(0); // Reset progress for compression step
      const formData = new FormData();
      formData.append("file", originalPdfBlob, "ocr_generated.pdf");
      formData.append("compression", compression);

      const res = await fetch("/api/compress", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("PDF Compression failed on server.");

      const compressedBlob = await res.blob();
      const compressedSize = compressedBlob.size / 1024 / 1024; // MB
      const reduction = ((1 - compressedSize / originalSize) * 100).toFixed(1);

      // 5. Update state with compression results
      setCompressionInfo(
        `Reduced from ${originalSize.toFixed(2)} MB → ${compressedSize.toFixed(
          2
        )} MB (${reduction}% smaller)`
      );

      const url = URL.createObjectURL(compressedBlob);
      setOutputUrl(url);
      setProgress(100);
    } catch (err) {
      console.error("OCR extraction/compression failed:", err);
      alert("OCR extraction or compression failed: " + (err as Error).message);
    } finally {
      setProcessing(false);
      setProgress(100); // Ensure progress shows 100% on completion/failure
    }
  };

  const handleClear = () => {
    setFile(null);
    setOutputUrl(null);
    setProgress(0);
    setCompressionInfo(null); // Clear compression info
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div
      className={`max-w-3xl w-full rounded-2xl shadow-2xl p-8 transition-all duration-300 ${
        darkMode
          ? "bg-gray-900 text-gray-100 border border-gray-700"
          : "bg-white text-gray-900 border border-gray-200"
      }`}
    >
      {/* File Input Section (Unchanged) */}
      <div
        className={`p-5 rounded-xl border-2 border-dashed mb-6 transition hover:border-blue-500 ${
          darkMode
            ? "border-gray-600 bg-gray-800/70"
            : "border-gray-300 bg-gray-50"
        }`}
      >
        <label className="block mb-3 font-medium text-center">
          Upload Scanned PDF or Image
        </label>
        <input
          type="file"
          accept="image/*,application/pdf"
          onChange={handleFileChange}
          className="block mx-auto text-sm cursor-pointer"
        />
        {file && (
          <p
            className={`text-center mt-2 text-xs ${
              darkMode ? "text-gray-400" : "text-gray-500"
            }`}
          >
            File selected: {file.name}
          </p>
        )}
      </div>

      {/* 6. Compression Level Selector (NEW) */}
      <div className="mb-6">
        <label className="block mb-2 font-medium">
          Compression Level (After OCR)
        </label>
        <select
          value={compression}
          onChange={(e) => setCompression(e.target.value)}
          className={`block w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none ${
            darkMode
              ? "border-gray-700 bg-gray-800 text-gray-100"
              : "border-gray-300 bg-white text-gray-900"
          }`}
        >
          <option value="screen">📱 Screen – Smallest size</option>
          <option value="ebook">📖 Ebook – Balanced quality</option>
          <option value="printer">🖨️ Printer – High quality</option>
          <option value="prepress">📄 Prepress – Max quality</option>
          <option value="default">⚙️ Default – No compression</option>
        </select>
      </div>

      {/* Buttons Section (Unchanged logic) */}
      <div className="flex flex-col justify-center gap-4 mb-6 sm:flex-row">
        <button
          onClick={handleExtract}
          disabled={!file || processing}
          className={`px-6 py-2.5 rounded-lg font-medium text-white transition-all ${
            processing
              ? "bg-blue-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 shadow-md"
          }`}
        >
          {processing
            ? `Processing... ${progress}%`
            : "🧠 Generate Searchable PDF"}
        </button>

        <button
          onClick={handleClear}
          className={`px-6 py-2.5 rounded-lg font-medium transition ${
            darkMode
              ? "bg-gray-700 hover:bg-gray-600 text-gray-100"
              : "bg-gray-300 hover:bg-gray-400 text-gray-800"
          }`}
        >
          🧹 Clear
        </button>
      </div>

      {/* Output Section */}
      {outputUrl && (
        <div className="mt-8 text-center">
          {/* 7. Display Compression Info (NEW) */}
          {compressionInfo && (
            <p
              className={`text-sm mb-2 ${
                darkMode ? "text-green-400" : "text-green-700"
              } font-medium`}
            >
              📉 {compressionInfo}
            </p>
          )}

          <a
            href={outputUrl}
            download="ocr_extracted_compressed.pdf"
            className={`inline-block font-medium underline mb-4 ${
              darkMode
                ? "text-blue-400 hover:text-blue-300"
                : "text-blue-600 hover:text-blue-800"
            }`}
          >
            ⬇️ Download OCR Extracted PDF
          </a>
          <iframe
            src={outputUrl}
            className={`w-full h-96 rounded-lg border ${
              darkMode ? "border-gray-700" : "border-gray-300"
            }`}
            title="OCR Extracted PDF Preview"
          />
        </div>
      )}
    </div>
  );
}
