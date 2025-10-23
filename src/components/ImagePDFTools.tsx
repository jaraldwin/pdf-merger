"use client";

import React, { useState, useRef } from "react";
import { jsPDF } from "jspdf";

interface ImagePDFToolsProps {
  darkMode: boolean;
}

export default function ImagePDFTools({ darkMode }: ImagePDFToolsProps) {
  const [images, setImages] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [compression, setCompression] = useState("screen");
  const [compressionInfo, setCompressionInfo] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(event.target.files || []);
    setImages((prev) => [...prev, ...newFiles]);
  };

  const handleClear = () => {
    setImages([]);
    setPdfUrl(null);
    setCompressionInfo(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleConvert = async () => {
    if (images.length === 0) {
      alert("Please select one or more images first.");
      return;
    }

    setLoading(true);
    try {
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "pt",
        format: "a4",
      });

      for (let i = 0; i < images.length; i++) {
        const file = images[i];
        const imageUrl = URL.createObjectURL(file);

        const img = new Image();
        img.src = imageUrl;

        await new Promise<void>((resolve) => {
          img.onload = () => {
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();

            // Maintain aspect ratio
            let imgWidth = img.width;
            let imgHeight = img.height;
            const ratio = Math.min(
              pageWidth / imgWidth,
              pageHeight / imgHeight
            );

            imgWidth *= ratio;
            imgHeight *= ratio;

            const x = (pageWidth - imgWidth) / 2;
            const y = (pageHeight - imgHeight) / 2;

            pdf.addImage(img, "JPEG", x, y, imgWidth, imgHeight);

            if (i < images.length - 1) pdf.addPage();

            URL.revokeObjectURL(imageUrl);
            resolve();
          };
        });
      }

      const pdfBlob = pdf.output("blob");

      // Compress PDF using Ghostscript API
      const formData = new FormData();
      formData.append("file", pdfBlob, "images.pdf");
      formData.append("compression", compression);

      const res = await fetch("/api/compress", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Compression failed");

      const compressedBlob = await res.blob();
      const originalSize = pdfBlob.size / 1024 / 1024;
      const compressedSize = compressedBlob.size / 1024 / 1024;
      const reduction = ((1 - compressedSize / originalSize) * 100).toFixed(1);

      setCompressionInfo(
        `Reduced from ${originalSize.toFixed(2)} MB → ${compressedSize.toFixed(
          2
        )} MB (${reduction}% smaller)`
      );

      const pdfBlobUrl = URL.createObjectURL(compressedBlob);
      setPdfUrl(pdfBlobUrl);
    } catch (err) {
      console.error("Error creating/compressing PDF:", err);
      alert("Something went wrong during conversion or compression.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`max-w-3xl w-full rounded-2xl shadow-2xl p-8 transition-all duration-300 ${
        darkMode
          ? "bg-gray-900 text-gray-100 border border-gray-700"
          : "bg-white text-gray-900 border border-gray-200"
      }`}
    >
      {/* 🛑 REMOVED DUPLICATE HEADER */}

      {/* File Input */}
      <div
        className={`p-5 rounded-xl border-2 border-dashed mb-6 transition hover:border-blue-500 ${
          darkMode
            ? "border-gray-600 bg-gray-800/70"
            : "border-gray-300 bg-gray-50"
        }`}
      >
        <label className="block mb-3 font-medium text-center">
          Select Image Files to Convert to PDF
        </label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleSelect}
          className="block mx-auto text-sm cursor-pointer"
        />
        <p
          className={`text-center mt-2 text-xs ${
            darkMode ? "text-gray-400" : "text-gray-500"
          }`}
        >
          You can select multiple images (JPG, PNG, etc.)
        </p>
      </div>

      {/* Compression Level Selector */}
      <div className="mb-6">
        <label className="block mb-2 font-medium">Compression Level</label>
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

      {/* File List for Images */}
      {images.length > 0 && (
        <div
          className={`rounded-xl p-4 mb-6 border ${
            darkMode
              ? "bg-gray-800 border-gray-700 text-gray-200"
              : "bg-gray-50 border-gray-200 text-gray-700"
          }`}
        >
          <h3 className="mb-2 font-semibold">🖼️ Selected Images</h3>
          <ul className="space-y-1 overflow-y-auto text-sm max-h-48">
            {images.map((file, i) => (
              <li key={i} className="truncate">
                • {file.name}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Buttons */}
      <div className="flex flex-col justify-center gap-4 sm:flex-row">
        <button
          onClick={handleConvert}
          disabled={loading}
          className={`px-6 py-2.5 rounded-lg font-medium text-white transition-all ${
            loading
              ? "bg-blue-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 shadow-md"
          }`}
        >
          {loading ? "🔄 Processing..." : "🚀 Convert & Compress"}
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

      {/* PDF Preview */}
      {pdfUrl && (
        <div className="mt-8 text-center animate-fade-in">
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
            href={pdfUrl}
            download="compressed.pdf"
            className={`inline-block font-medium underline mb-4 ${
              darkMode
                ? "text-blue-400 hover:text-blue-300"
                : "text-blue-600 hover:text-blue-800"
            }`}
          >
            ⬇️ Download compressed.pdf
          </a>
          <iframe
            src={pdfUrl}
            className={`w-full h-96 rounded-lg border ${
              darkMode ? "border-gray-700" : "border-gray-300"
            }`}
            title="Generated PDF Preview"
          />
        </div>
      )}
    </div>
  );
}
