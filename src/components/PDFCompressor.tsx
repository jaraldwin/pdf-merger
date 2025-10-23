"use client";

import React, { useState, useRef } from "react";

interface PDFCompressorProps {
  darkMode: boolean;
}

export default function PDFCompressor({ darkMode }: PDFCompressorProps) {
  const [file, setFile] = useState<File | null>(null);
  const [compression, setCompression] = useState("screen");
  const [compressionInfo, setCompressionInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setCompressionInfo(null);
    }
  };

  const handleClear = () => {
    setFile(null);
    setCompressionInfo(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCompress = async () => {
    if (!file) return alert("Please select a PDF file first.");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("compression", compression);

    setLoading(true);
    setCompressionInfo(null);

    try {
      const res = await fetch("/api/compress", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Compression failed");

      const blob = await res.blob();
      const compressionHeader = res.headers.get("X-Compression-Info");
      setCompressionInfo(compressionHeader || "✅ Compression complete.");

      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = "compressed.pdf";
      a.click();
    } catch (error) {
      alert("Something went wrong during compression.");
      console.error(error);
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
      {/* File Input Section */}
      <div
        className={`p-5 rounded-xl border-2 border-dashed mb-6 transition hover:border-blue-500 ${
          darkMode
            ? "border-gray-600 bg-gray-800/70"
            : "border-gray-300 bg-gray-50"
        }`}
      >
        <label className="block mb-3 font-medium text-center">
          Select a PDF File to Compress
        </label>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          onChange={handleFileChange}
          className="block mx-auto text-sm cursor-pointer"
        />
        <p
          className={`text-center mt-2 text-xs ${
            darkMode ? "text-gray-400" : "text-gray-500"
          }`}
        >
          Only one PDF file can be selected at a time.
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

      {/* File Preview Section */}
      {file && (
        <div
          className={`rounded-xl p-4 mb-6 border ${
            darkMode
              ? "bg-gray-800 border-gray-700 text-gray-200"
              : "bg-gray-50 border-gray-200 text-gray-700"
          }`}
        >
          <h3 className="mb-2 font-semibold">📄 Selected File</h3>
          <p className="text-sm truncate">{file.name}</p>
          <p className="mt-1 text-xs opacity-70">
            Size: {(file.size / 1024 / 1024).toFixed(2)} MB
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col justify-center gap-4 sm:flex-row">
        <button
          onClick={handleCompress}
          disabled={!file || loading}
          className={`px-6 py-2.5 rounded-lg font-medium text-white transition-all ${
            loading
              ? "bg-blue-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 shadow-md"
          }`}
        >
          {loading ? "🔄 Compressing..." : "🚀 Compress PDF"}
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

      {/* Compression Info */}
      {compressionInfo && (
        <div className="mt-6 text-center animate-fade-in">
          <p
            className={`text-sm font-medium ${
              darkMode ? "text-green-400" : "text-green-700"
            }`}
          >
            {compressionInfo}
          </p>
        </div>
      )}
    </div>
  );
}
