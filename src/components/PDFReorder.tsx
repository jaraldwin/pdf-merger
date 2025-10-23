"use client";

import React, { useState, useEffect, useRef } from "react";
import { DndContext, closestCenter, DragEndEvent } from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import SortableItem from "./SortableItem";

interface PDFReorderProps {
  darkMode: boolean;
}

export default function PDFReorder({ darkMode }: PDFReorderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number>(0);
  const [pageOrder, setPageOrder] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  // ✅ File input ref
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Load PDF pages
  useEffect(() => {
    if (!file) return;

    (async () => {
      try {
        const pdfjsLib = await import("pdfjs-dist/build/pdf.mjs");
        pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdfjs/pdf.worker.min.mjs";

        const pdf = await pdfjsLib.getDocument(URL.createObjectURL(file))
          .promise;
        setPageCount(pdf.numPages);
        setPageOrder(Array.from({ length: pdf.numPages }, (_, i) => i));
      } catch (err) {
        console.error("Error loading PDF:", err);
      }
    })();
  }, [file]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as number;
    const overId = over.id as number;
    if (activeId === overId) return;

    setPageOrder((items) => {
      const oldIndex = items.indexOf(activeId);
      const newIndex = items.indexOf(overId);
      if (oldIndex === -1 || newIndex === -1) return items;
      return arrayMove(items, oldIndex, newIndex);
    });
  };

  const handleSubmit = async () => {
    if (!file || pageOrder.length === 0) return alert("Please select a file.");
    setLoading(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("order", JSON.stringify(pageOrder));

    const res = await fetch("/api/reorder", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      alert("Reordering failed.");
      setLoading(false);
      return;
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    setPdfUrl(url);
    setLoading(false);
  };

  const handleReset = () => {
    setFile(null);
    setPageCount(0);
    setPageOrder([]);
    setPdfUrl(null);

    // ✅ Clear the file input itself
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
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
      <div
        className={`p-5 rounded-xl border-2 border-dashed mb-6 transition hover:border-blue-500 ${
          darkMode
            ? "border-gray-600 bg-gray-800/70"
            : "border-gray-300 bg-gray-50"
        }`}
      >
        <label className="block mb-3 font-medium text-center">
          Upload PDF to Reorder Pages
        </label>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="block mx-auto text-sm cursor-pointer"
        />
      </div>

      {pageCount > 0 && (
        <div
          className={`rounded-xl p-4 mb-6 border ${
            darkMode
              ? "bg-gray-800 border-gray-700 text-gray-200"
              : "bg-gray-50 border-gray-200 text-gray-700"
          }`}
        >
          <h3 className="mb-2 font-semibold">📄 Drag to Reorder Pages</h3>
          <DndContext
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={pageOrder}
              strategy={verticalListSortingStrategy}
            >
              <ul className="space-y-2 overflow-y-auto max-h-80">
                {pageOrder.map((pageIndex) => (
                  <SortableItem
                    key={pageIndex}
                    id={pageIndex}
                    label={`Page ${pageIndex + 1}`}
                    darkMode={darkMode}
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        </div>
      )}

      <div className="flex flex-col justify-center gap-4 sm:flex-row">
        <button
          onClick={handleSubmit}
          disabled={!file || loading}
          className={`px-6 py-2.5 rounded-lg font-medium text-white transition-all ${
            loading
              ? "bg-blue-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 shadow-md"
          }`}
        >
          {loading ? "Processing..." : "💾 Save Reordered PDF"}
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

      {pdfUrl && (
        <div className="mt-8 text-center">
          <a
            href={pdfUrl}
            download="reordered.pdf"
            className={`inline-block font-medium underline mb-4 ${
              darkMode
                ? "text-blue-400 hover:text-blue-300"
                : "text-blue-600 hover:text-blue-800"
            }`}
          >
            ⬇️ Download reordered.pdf
          </a>
          <iframe
            src={pdfUrl}
            className={`w-full h-96 rounded-lg border ${
              darkMode ? "border-gray-700" : "border-gray-300"
            }`}
            title="Reordered PDF Preview"
          />
        </div>
      )}
    </div>
  );
}
