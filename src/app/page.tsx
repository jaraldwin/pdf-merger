"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Box, Tabs, Tab, Paper } from "@mui/material";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import logo from "../assets/logo.png";

// 🔹 Lazy load heavy tools to improve performance
const PDFMerger = dynamic(() => import("../components/PDFMerger"), { ssr: false });
const ImagePDFTools = dynamic(() => import("../components/ImagePDFTools"), { ssr: false });
const PDFCompressor = dynamic(() => import("../components/PDFCompressor"), { ssr: false });
const PDFSplitter = dynamic(() => import("../components/PDFSplitter"), { ssr: false });
const PDFReorder = dynamic(() => import("../components/PDFReorder"), { ssr: false });

export default function HomePage() {
  const [darkMode, setDarkMode] = useState(false);
  const [tab, setTab] = useState(0);
  const [visitorCount, setVisitorCount] = useState<number | null>(null);

  // 🌗 Load theme + visitor count
  useEffect(() => {
    setDarkMode(localStorage.getItem("darkMode") === "true");

    const controller = new AbortController();

    const fetchVisitorCount = async () => {
      try {
        const res = await fetch("/api/log", { signal: controller.signal });
        if (!res.ok) throw new Error("Network response failed");
        const data = await res.json();
        setVisitorCount(data.count);
      } catch {
        console.warn("⚠️ Failed to load visitor count");
      }
    };

    fetchVisitorCount();
    return () => controller.abort();
  }, []);

  // 🌗 Persist theme preference
  useEffect(() => {
    localStorage.setItem("darkMode", String(darkMode));
  }, [darkMode]);

  // 🧭 Reset scroll on tab change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [tab]);

  return (
    <main
      className={`min-h-screen flex flex-col items-center justify-center px-6 py-10 transition-colors duration-500 ${
        darkMode ? "bg-gray-950 text-gray-100" : "bg-gray-50 text-gray-900"
      }`}
    >
      {/* 🌗 Dark Mode Toggle */}
      <button
        onClick={() => setDarkMode((prev) => !prev)}
        className={`fixed top-6 right-6 px-4 py-2 rounded-full font-medium shadow-md transition-all ${
          darkMode
            ? "bg-gray-800 hover:bg-gray-700 text-gray-100"
            : "bg-white hover:bg-gray-200 text-gray-800"
        }`}
      >
        {darkMode ? "☀️" : "🌙"}
      </button>

      {/* 🧱 Layout Wrapper */}
      <div className="flex flex-col items-center justify-center w-full gap-10 md:flex-row max-w-7xl">
        {/* 🔹 Left Panel */}
        <div className="flex flex-col items-center max-w-md text-center md:items-start md:text-left">
          <Image
            src={logo}
            alt="MIRDC Logo"
            width={90}
            height={90}
            priority
            className="mb-4"
          />
          <h1 className="mb-2 text-3xl font-bold sm:text-4xl">
            DOST-MIRDC PDF Toolkit
          </h1>
          <p
            className={`text-sm sm:text-base leading-relaxed ${
              darkMode ? "text-gray-400" : "text-gray-600"
            }`}
          >
            A secure, offline-ready suite for <strong>PDF management</strong> —{" "}
            including <strong>merging</strong>, <strong>compression</strong>,{" "}
            <strong>image-to-PDF conversion</strong>,{" "}
            <strong>page splitting</strong>, and{" "}
            <strong>page reordering</strong>.
            <br />
            Developed by <strong>PMD-MIS</strong> for{" "}
            <strong>DOST-MIRDC</strong>.
          </p>

          {visitorCount !== null && (
            <p className="mt-4 text-xs font-medium text-gray-500">
              👥 Total Operations:{" "}
              <span className="font-semibold">
                {visitorCount.toLocaleString()}
              </span>
            </p>
          )}
        </div>

        {/* 🔸 Right Panel: Main Toolkit */}
        <Paper
          elevation={6}
          sx={{
            width: "100%",
            maxWidth: 820,
            borderRadius: "20px",
            overflow: "hidden",
            bgcolor: darkMode ? "grey.900" : "white",
            boxShadow: darkMode
              ? "0 8px 24px rgba(0,0,0,0.6)"
              : "0 8px 24px rgba(0,0,0,0.1)",
          }}
        >
          {/* 🔖 Tabs Header */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              bgcolor: darkMode ? "#1f2937" : "#e5e7eb",
              borderBottom: darkMode
                ? "1px solid rgba(255,255,255,0.15)"
                : "1px solid rgba(0,0,0,0.1)",
            }}
          >
            <Tabs
              value={tab}
              onChange={(_, val) => setTab(val)}
              variant="fullWidth"
              textColor="inherit"
              TabIndicatorProps={{
                style: {
                  backgroundColor: darkMode ? "#60a5fa" : "#2563eb",
                  height: "4px",
                  borderRadius: "2px",
                },
              }}
              sx={{
                "& .MuiTab-root": {
                  fontWeight: 600,
                  fontSize: "1rem",
                  py: 1.5,
                  transition: "0.3s",
                  color: darkMode ? "#d1d5db" : "#1f2937",
                  "&:hover": {
                    color: darkMode ? "#93c5fd" : "#2563eb",
                    backgroundColor: darkMode
                      ? "rgba(255,255,255,0.05)"
                      : "rgba(0,0,0,0.03)",
                  },
                },
                "& .Mui-selected": {
                  color: darkMode ? "#60a5fa" : "#2563eb",
                },
              }}
            >
              <Tab key="merge" label="📄 Merge" />
              <Tab key="image" label="🖼️ Image Tools" />
              <Tab key="compress" label="🗜️ Compress" />
              <Tab key="split" label="✂️ Split" />
              <Tab key="reorder" label="↕️ Reorder Pages" />
            </Tabs>
          </Box>

          {/* 🧩 Tab Content */}
          <Box sx={{ p: { xs: 2, sm: 4 }, minHeight: "580px" }}>
            <AnimatePresence mode="wait">
              {[
                { key: "merge", comp: <PDFMerger darkMode={darkMode} /> },
                { key: "image", comp: <ImagePDFTools darkMode={darkMode} /> },
                { key: "compress", comp: <PDFCompressor darkMode={darkMode} /> },
                { key: "split", comp: <PDFSplitter darkMode={darkMode} /> },
                { key: "reorder", comp: <PDFReorder darkMode={darkMode} /> },
              ].map(
                (item, i) =>
                  tab === i && (
                    <motion.div
                      key={item.key}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.25 }}
                    >
                      {item.comp}
                    </motion.div>
                  )
              )}
            </AnimatePresence>
          </Box>
        </Paper>
      </div>

      {/* ⚙️ Footer */}
      <footer
        className={`mt-10 text-xs sm:text-sm text-center opacity-70 ${
          darkMode ? "text-gray-400" : "text-gray-600"
        }`}
      >
        © {new Date().getFullYear()} DOST-MIRDC | Powered by PMD-MIS
      </footer>
    </main>
  );
}
