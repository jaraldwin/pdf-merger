"use client";

import React, { useState, useRef } from "react";

interface PDFSplitterProps {
  darkMode: boolean;
}

export default function PDFSplitter({ darkMode }: PDFSplitterProps) {
  const [file, setFile] = useState<File | null>(null);
  const [pageRange, setPageRange] = useState("");
  const [loading, setLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setPdfUrl(null);
      setInfo(null);
    }
  };

  const handleClear = () => {
    setFile(null);
    setPdfUrl(null);
    setPageRange("");
    setInfo(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleExtract = async () => {
    if (!file) return alert("Please select a PDF file first.");
    if (!pageRange.trim()) return alert("Please specify the page range to extract.");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("range", pageRange);

    setLoading(true);
    setInfo(null);

    try {
      const res = await fetch("/api/split", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Failed to extract PDF pages.");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
      setInfo("✅ Pages extracted successfully!");
    } catch (error) {
      console.error(error);
      alert("Something went wrong while extracting pages.");
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
      {/* File Upload Section */}
      <div
        className={`p-5 rounded-xl border-2 border-dashed mb-6 transition hover:border-blue-500 ${
          darkMode
            ? "border-gray-600 bg-gray-800/70"
            : "border-gray-300 bg-gray-50"
        }`}
      >
        <label className="block mb-3 font-medium text-center">
          Select a PDF File to Split or Extract Pages
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
          Example: upload your PDF file to extract specific pages.
        </p>
      </div>

      {/* Page Range Input */}
      <div className="mb-6">
        <label className="block mb-2 font-medium">
          Enter Page Range to Extract
        </label>
        <input
          type="text"
          placeholder="e.g. 1-3, 5, 8-10"
          value={pageRange}
          onChange={(e) => setPageRange(e.target.value)}
          className={`block w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none ${
            darkMode
              ? "border-gray-700 bg-gray-800 text-gray-100"
              : "border-gray-300 bg-white text-gray-900"
          }`}
        />
        <p
          className={`text-xs mt-2 ${
            darkMode ? "text-gray-400" : "text-gray-500"
          }`}
        >
          Use commas and dashes to specify multiple or continuous page ranges.
        </p>
      </div>

      {/* File Info */}
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

      {/* Buttons */}
      <div className="flex flex-col justify-center gap-4 sm:flex-row">
        <button
          onClick={handleExtract}
          disabled={!file || loading}
          className={`px-6 py-2.5 rounded-lg font-medium text-white transition-all ${
            loading
              ? "bg-blue-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 shadow-md"
          }`}
        >
          {loading ? "🔄 Extracting..." : "✂️ Extract Pages"}
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
          {info && (
            <p
              className={`text-sm mb-2 ${
                darkMode ? "text-green-400" : "text-green-700"
              } font-medium`}
            >
              {info}
            </p>
          )}
          <a
            href={pdfUrl}
            download="extracted-pages.pdf"
            className={`inline-block font-medium underline mb-4 ${
              darkMode
                ? "text-blue-400 hover:text-blue-300"
                : "text-blue-600 hover:text-blue-800"
            }`}
          >
            ⬇️ Download extracted-pages.pdf
          </a>
          <iframe
            src={pdfUrl}
            className={`w-full h-96 rounded-lg border ${
              darkMode ? "border-gray-700" : "border-gray-300"
            }`}
            title="Extracted PDF Preview"
          />
        </div>
      )}
    </div>
  );
}
