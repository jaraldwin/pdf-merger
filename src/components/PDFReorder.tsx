"use client";

import React, { useState, useEffect, useRef } from "react";
import { DndContext, closestCenter, DragEndEvent } from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { AnimatePresence, motion } from "framer-motion";
import SortableItem from "./SortableItem";
import Image from "next/image";
import * as pdfjsLib from "pdfjs-dist";

interface PDFReorderProps {
  darkMode: boolean;
}

export default function PDFReorder({ darkMode }: PDFReorderProps) {
  const [file, setFile] = useState<File | null>(null);
  // REMOVED: const [pageCount, setPageCount] = useState<number>(0);
  const [pageOrder, setPageOrder] = useState<number[]>([]);
  const [pagePreviews, setPagePreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [compression, setCompression] = useState("screen");
  const [compressionInfo, setCompressionInfo] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // 🧩 Load PDF pages and render previews
  useEffect(() => {
    if (!file) return;

    (async () => {
      try {
        pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdfjs/pdf.worker.min.mjs";
        const pdf = await pdfjsLib.getDocument(URL.createObjectURL(file))
          .promise;

        // REMOVED: setPageCount(pdf.numPages);
        setPageOrder(Array.from({ length: pdf.numPages }, (_, i) => i));

        const previews: string[] = [];
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 0.5 });
          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d")!;
          canvas.width = viewport.width;
          canvas.height = viewport.height;

          // 💡 FIX: Add the 'canvas' property to satisfy the RenderParameters type
          await page.render({
            canvas: canvas,
            canvasContext: context,
            viewport,
          }).promise;

          previews.push(canvas.toDataURL());
        }

        setPagePreviews(previews);
        setShowModal(true); // 👈 open modal after loading
      } catch (err) {
        console.error("Error loading PDF:", err);
      }
    })();
  }, [file]);

  // 🔀 Handle drag end event
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as number;
    const overId = over.id as number;
    if (activeId === overId) return;

    setPageOrder((items) => {
      const oldIndex = items.indexOf(activeId);
      const newIndex = items.indexOf(overId);
      return arrayMove(items, oldIndex, newIndex);
    });
  };

  // 💾 Submit reordered PDF + compress
  const handleSubmit = async () => {
    if (!file || pageOrder.length === 0) return alert("Please select a file.");
    setLoading(true);
    setCompressionInfo(null);
    setInfo(null);

    try {
      // Step 1: Reorder PDF
      const formData = new FormData();
      formData.append("file", file);
      formData.append("order", JSON.stringify(pageOrder));

      const reorderRes = await fetch("/api/reorder", {
        method: "POST",
        body: formData,
      });

      if (!reorderRes.ok) throw new Error("Reordering failed.");

      const reorderedBlob = await reorderRes.blob();

      // Step 2: Compress the reordered PDF
      const compressData = new FormData();
      compressData.append("file", reorderedBlob, "reordered.pdf");
      compressData.append("compression", compression);

      const compressRes = await fetch("/api/compress", {
        method: "POST",
        body: compressData,
      });

      if (!compressRes.ok) throw new Error("Compression failed.");

      const compressedBlob = await compressRes.blob();

      const originalSize = reorderedBlob.size / 1024 / 1024;
      const compressedSize = compressedBlob.size / 1024 / 1024;
      const reduction = ((1 - compressedSize / originalSize) * 100).toFixed(1);

      setCompressionInfo(
        `Reduced from ${originalSize.toFixed(2)} MB → ${compressedSize.toFixed(
          2
        )} MB (${reduction}% smaller)`
      );

      const url = URL.createObjectURL(compressedBlob);
      setPdfUrl(url);
      setInfo("✅ Pages reordered and compressed successfully!");
      setShowModal(false);
    } catch (error) {
      console.error(error);
      alert("Something went wrong while reordering or compressing.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    // REMOVED: setPageCount(0);
    setPageOrder([]);
    setPagePreviews([]);
    setPdfUrl(null);
    setCompressionInfo(null);
    setInfo(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ⌨️ Close modal on Escape
  useEffect(() => {
    const onEsc = (e: KeyboardEvent) =>
      e.key === "Escape" && setShowModal(false);
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, []);

  return (
    <div
      className={`max-w-3xl w-full rounded-2xl shadow-2xl p-8 transition-all duration-300 ${
        darkMode
          ? "bg-gray-900 text-gray-100 border border-gray-700"
          : "bg-white text-gray-900 border border-gray-200"
      }`}
    >
      {/* File Upload */}
      <div
        className={`p-5 rounded-xl border-2 border-dashed mb-6 transition hover:border-blue-500 ${
          darkMode
            ? "border-gray-600 bg-gray-800/70"
            : "border-gray-300 bg-gray-50"
        }`}
      >
        <label className="block mb-3 font-medium text-center">
          Upload PDF to Reorder Pages and Compress
        </label>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="block mx-auto text-sm cursor-pointer"
        />
        <p
          className={`text-center mt-2 text-xs ${
            darkMode ? "text-gray-400" : "text-gray-500"
          }`}
        >
          Opens a popup for easier page reordering and compression.
        </p>
      </div>

      {/* Compression Selector */}
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

      {/* Download preview if ready */}
      {pdfUrl && (
        <div className="mt-8 text-center">
          {info && (
            <p
              className={`text-sm mb-2 ${
                darkMode ? "text-green-400" : "text-green-700"
              } font-medium`}
            >
              {info}
            </p>
          )}
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
            download="reordered-compressed.pdf"
            className={`inline-block font-medium underline mb-4 ${
              darkMode
                ? "text-blue-400 hover:text-blue-300"
                : "text-blue-600 hover:text-blue-800"
            }`}
          >
            ⬇️ Download reordered-compressed.pdf
          </a>
          <iframe
            src={pdfUrl}
            className={`w-full h-96 rounded-lg border ${
              darkMode ? "border-gray-700" : "border-gray-300"
            }`}
            title="Reordered & Compressed PDF Preview"
          />
        </div>
      )}

      {/* ✅ Modal for Reordering Pages */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              key="modal"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className={`relative w-[90%] max-w-5xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl ${
                darkMode
                  ? "bg-gray-900 text-gray-100"
                  : "bg-white text-gray-900"
              }`}
            >
              {/* Close Button */}
              <button
                onClick={() => setShowModal(false)}
                className="absolute text-2xl text-gray-400 top-3 right-4 hover:text-gray-200"
              >
                ✕
              </button>

              <div className="p-6 overflow-y-auto max-h-[80vh]">
                <h2 className="mb-4 text-xl font-semibold">
                  📄 Drag Pages to Reorder
                </h2>

                <DndContext
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={pageOrder}
                    strategy={verticalListSortingStrategy}
                  >
                    <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                      {pageOrder.map((pageIndex) => (
                        <SortableItem
                          key={pageIndex}
                          id={pageIndex}
                          darkMode={darkMode}
                          label={`Page ${pageIndex + 1}`}
                        >
                          <Image
                            src={pagePreviews[pageIndex]}
                            alt={`Page ${pageIndex + 1}`}
                            width={800} // Set a plausible width based on your design/canvas size
                            height={1000} // Set a plausible height based on your design/canvas size
                            unoptimized={true} // Crucial for Data URLs (base64)
                            className="w-full h-auto border rounded-lg" // Tailwind classes still work
                          />
                        </SortableItem>
                      ))}
                    </ul>
                  </SortableContext>
                </DndContext>

                <div className="flex flex-wrap justify-center gap-3 mt-6">
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className={`px-6 py-2.5 rounded-lg font-medium text-white transition-all ${
                      loading
                        ? "bg-blue-400 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700 shadow-md"
                    }`}
                  >
                    {loading ? "Processing..." : "💾 Save & Compress"}
                  </button>

                  <button
                    onClick={handleReset}
                    className={`px-6 py-2.5 rounded-lg font-medium transition ${
                      darkMode
                        ? "bg-gray-700 hover:bg-gray-600 text-gray-100"
                        : "bg-gray-300 hover:bg-gray-400 text-gray-800"
                    }`}
                  >
                    🧹 Clear
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
