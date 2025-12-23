"use client";

import React, { useState, useRef } from "react";
// ❌ Removed: import Image from "next/image";
// ❌ Removed: import logo from "../assets/logo.png";
// ❌ Removed: import { useEffect } from "react";

interface PDFMergerProps {
  darkMode: boolean;
}

export default function PDFMerger({ darkMode }: PDFMergerProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [mergedUrl, setMergedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [compression, setCompression] = useState("screen");
  const [compressionInfo, setCompressionInfo] = useState<string | null>(null);
  // ❌ Removed: [visitorCount, setVisitorCount] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // ❌ Removed: useEffect to fetch visitor count

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(event.target.files || []);
    setFiles((prev) => [...prev, ...newFiles]);
  };

  const handleMerge = async () => {
    if (files.length === 0) {
      alert("Please select at least one PDF file.");
      return;
    }
    setLoading(true);
    setCompressionInfo(null); // reset info

    try {
      // Calculate total original file size
      const totalOriginalSize =
        files.reduce((acc, f) => acc + f.size, 0) / (1024 * 1024); // MB

      const formData = new FormData();
      files.forEach((file) => formData.append("files", file));
      formData.append("compression", compression);

      const response = await fetch("/api/merge", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Merge failed");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      console.log("Merged PDF URL:", url);
      setMergedUrl(url);

      // Calculate compressed file size
      const compressedSize = blob.size / (1024 * 1024); // MB
      const reduction = (
        (1 - compressedSize / totalOriginalSize) *
        100
      ).toFixed(1);

      // Display compression summary
      setCompressionInfo(
        `Reduced from ${totalOriginalSize.toFixed(
          2
        )} MB → ${compressedSize.toFixed(2)} MB (${reduction}% smaller)`
      );
    } catch (error) {
      console.error("Error merging PDFs:", error);
      alert("Something went wrong while merging PDFs.");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setFiles([]);
    setMergedUrl(null);
    setCompressionInfo(null);
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

      {/* Upload Section */}
      <div
        className={`p-5 rounded-xl border-2 border-dashed mb-6 transition hover:border-blue-500 ${
          darkMode
            ? "border-gray-600 bg-gray-800/70"
            : "border-gray-300 bg-gray-50"
        }`}
      >
        <label className="block mb-3 font-medium text-center">
          Select PDF Files to Merge
        </label>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          multiple
          onChange={handleFileSelect}
          className="block mx-auto text-sm cursor-pointer"
        />
        <p
          className={`text-center mt-2 text-xs ${
            darkMode ? "text-gray-400" : "text-gray-500"
          }`}
        >
          You can select multiple files
        </p>
      </div>

      {/* Compression Level */}
      <div className="mb-6">
        <label className="block mb-2 font-medium">Compression Quality</label>
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

      {/* File List */}
      {files.length > 0 && (
        <div
          className={`rounded-xl p-4 mb-6 border ${
            darkMode
              ? "bg-gray-800 border-gray-700 text-gray-200"
              : "bg-gray-50 border-gray-200 text-gray-700"
          }`}
        >
          <h3 className="mb-2 font-semibold">
            📂 Selected Files ({files.length})
          </h3>
          <ul className="space-y-1 overflow-y-auto text-sm max-h-48">
            {files.map((file, i) => (
              <li key={i} className="truncate">
                • {file.name}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col justify-center gap-4 sm:flex-row">
        <button
          onClick={handleMerge}
          disabled={loading || files.length === 0}
          className={`px-6 py-2.5 rounded-lg font-medium text-white transition-all ${
            loading || files.length === 0
              ? "bg-blue-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 shadow-md"
          }`}
        >
          {loading ? "🔄 Merging..." : "🚀 Merge PDFs"}
        </button>
        <button
          onClick={handleClear}
          disabled={loading && files.length === 0}
          className={`px-6 py-2.5 rounded-lg font-medium transition ${
            darkMode
              ? "bg-gray-700 hover:bg-gray-600 text-gray-100"
              : "bg-gray-300 hover:bg-gray-400 text-gray-800"
          }`}
        >
          🧹 Clear
        </button>
      </div>

      {/* Compression Result Info */}
      {compressionInfo && (
        <p
          className={`mt-6 text-sm text-center font-medium ${
            darkMode ? "text-green-400" : "text-green-700"
          }`}
        >
          📉 {compressionInfo}
        </p>
      )}

      {/* Merged Preview */}
      {mergedUrl && (
        <div className="mt-6 text-center animate-fade-in">
          <a
            href={mergedUrl}
            download="merged_compressed.pdf"
            className={`inline-block font-medium underline mb-4 ${
              darkMode
                ? "text-blue-400 hover:text-blue-300"
                : "text-blue-600 hover:text-blue-800"
            }`}
          >
            ⬇️ Download merged_compressed.pdf
          </a>
          <iframe
            src={mergedUrl}
            className={`w-full h-96 rounded-lg border ${
              darkMode ? "border-gray-700" : "border-gray-300"
            }`}
            title="Merged PDF Preview"
          />
        </div>
      )}
    </div>
  );
}
