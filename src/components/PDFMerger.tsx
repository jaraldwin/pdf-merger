"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import logo from "../assets/logo.png";

interface PDFMergerProps {
  darkMode: boolean;
}

export default function PDFMerger({ darkMode }: PDFMergerProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [mergedUrl, setMergedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [compression, setCompression] = useState("screen");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(event.target.files || []);
    setFiles((prev) => [...prev, ...newFiles]);
  };

  const handleMerge = async () => {
    if (files.length === 0)
      return alert("Please select at least one PDF file.");
    setLoading(true);

    try {
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
      setMergedUrl(url);
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
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div
      className={`max-w-2xl w-full rounded-2xl shadow-xl p-6 transition-colors duration-300 ${
        darkMode ? "bg-gray-800 text-gray-100" : "bg-white text-gray-900"
      }`}
    >
      {/* Header */}
      <div className="flex flex-col items-center text-center mb-6">
        <Image
          src={logo}
          alt="Logo"
          width={64}
          height={64}
          className="rounded-full mb-2"
        />
        <h1 className="text-3xl font-bold mb-1">PDF Merger Tool</h1>
        <p
          className={`text-sm leading-relaxed ${
            darkMode ? "text-gray-400" : "text-gray-600"
          } max-w-md`}
        >
          A lightweight PDF merging and compression tool for{" "}
          <strong>DOST-MIRDC</strong>, developed by{" "}
          <strong>PMD-MIS</strong>.  
          <br />
          This tool does <strong>not store</strong> or use your data — it runs
          entirely on your local system with <strong>no database</strong>.
        </p>
      </div>

      {/* File Input */}
      <div className="mb-4">
        <label className="block font-medium mb-2">
          Select PDF files to merge
        </label>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          multiple
          onChange={handleFileSelect}
          className={`block w-full border rounded-lg p-2 ${
            darkMode
              ? "border-gray-600 bg-gray-700 text-gray-100"
              : "border-gray-300 bg-gray-50 text-gray-900"
          }`}
        />
      </div>

      {/* Compression Selector */}
      <div className="mb-6">
        <label className="block font-medium mb-2">Compression Level</label>
        <select
          value={compression}
          onChange={(e) => setCompression(e.target.value)}
          className={`block w-full border rounded-lg p-2 ${
            darkMode
              ? "border-gray-600 bg-gray-700 text-gray-100"
              : "border-gray-300 bg-gray-50 text-gray-900"
          }`}
        >
          <option value="screen">Screen – Smallest size, low quality</option>
          <option value="ebook">Ebook – Good balance</option>
          <option value="printer">Printer – High quality</option>
          <option value="prepress">Prepress – Highest quality</option>
          <option value="default">Default – No compression</option>
        </select>
      </div>

      {/* Selected Files */}
      {files.length > 0 && (
        <ul
          className={`mb-4 text-sm rounded-lg p-3 border max-h-40 overflow-y-auto ${
            darkMode
              ? "text-gray-300 bg-gray-700 border-gray-600"
              : "text-gray-700 bg-gray-50 border-gray-200"
          }`}
        >
          {files.map((file, i) => (
            <li key={i} className="truncate">
              📄 {file.name}
            </li>
          ))}
        </ul>
      )}

      {/* Buttons */}
      <div className="flex justify-center gap-4">
        <button
          onClick={handleMerge}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-medium transition disabled:opacity-50"
        >
          {loading ? "Merging..." : "Merge PDFs"}
        </button>
        <button
          onClick={handleClear}
          className={`px-5 py-2 rounded-lg font-medium transition ${
            darkMode
              ? "bg-gray-600 hover:bg-gray-500 text-gray-100"
              : "bg-gray-300 hover:bg-gray-400 text-gray-800"
          }`}
        >
          Clear
        </button>
      </div>

      {/* Result */}
      {mergedUrl && (
        <div className="mt-8 text-center">
          <a
            href={mergedUrl}
            download="merged.pdf"
            className={`underline font-medium ${
              darkMode
                ? "text-blue-400 hover:text-blue-300"
                : "text-blue-600 hover:text-blue-800"
            }`}
          >
            ⬇️ Download merged.pdf
          </a>
          <iframe
            src={mergedUrl}
            className={`w-full h-96 border mt-4 rounded-lg ${
              darkMode ? "border-gray-600" : "border-gray-300"
            }`}
            title="Merged PDF Preview"
          />
        </div>
      )}
    </div>
  );
}
