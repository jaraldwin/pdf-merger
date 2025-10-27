"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import {
  Box,
  Tabs,
  Tab,
  Paper,
  IconButton,
  Menu,
  MenuItem,
  useMediaQuery,
} from "@mui/material";
import {
  Brightness4,
  Brightness7,
  MoreVert,
  PictureAsPdf,
  Image as ImageIcon,
  Compress,
  ContentCut,
  SwapVert,
} from "@mui/icons-material"; // ✅ Import MUI Icons
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import logo from "../assets/logo.png";
import { Search } from "@mui/icons-material";

// 🔹 Lazy load heavy tools
const PDFMerger = dynamic(() => import("../components/PDFMerger"), {
  ssr: false,
});
const ImagePDFTools = dynamic(() => import("../components/ImagePDFTools"), {
  ssr: false,
});
const PDFCompressor = dynamic(() => import("../components/PDFCompressor"), {
  ssr: false,
});
const PDFSplitter = dynamic(() => import("../components/PDFSplitter"), {
  ssr: false,
});
const PDFReorder = dynamic(() => import("../components/PDFReorder"), {
  ssr: false,
});
const OCREngine = dynamic(() => import("../components/OCREngine"), {
  ssr: false,
});

export default function HomePage() {
  const [darkMode, setDarkMode] = useState(false);
  const [tab, setTab] = useState(0);
  const [visitorCount, setVisitorCount] = useState<number | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const isMobile = useMediaQuery("(max-width: 600px)");

  useEffect(() => {
    setDarkMode(localStorage.getItem("darkMode") === "true");

    const controller = new AbortController();

    const logVisit = async () => {
      try {
        // Log the visit (the server determines IP)
        await fetch("/api/log", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: window.location.href }),
          signal: controller.signal,
        });

        // Get visitor count
        const res = await fetch("/api/log", { signal: controller.signal });
        const data = await res.json();
        setVisitorCount(data.count);
      } catch (err) {
        console.warn("⚠️ Visitor log failed:", err);
      }
    };

    logVisit();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    localStorage.setItem("darkMode", String(darkMode));
  }, [darkMode]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [tab]);

  const tabs = [
    {
      key: "merge",
      label: "Merge",
      icon: <PictureAsPdf fontSize="small" />,
      comp: <PDFMerger darkMode={darkMode} />,
    },
    {
      key: "image",
      label: "Image Tools",
      icon: <ImageIcon fontSize="small" />,
      comp: <ImagePDFTools darkMode={darkMode} />,
    },
    {
      key: "compress",
      label: "Compress",
      icon: <Compress fontSize="small" />,
      comp: <PDFCompressor darkMode={darkMode} />,
    },
    {
      key: "split",
      label: "Split",
      icon: <ContentCut fontSize="small" />,
      comp: <PDFSplitter darkMode={darkMode} />,
    },
    {
      key: "reorder",
      label: "Reorder",
      icon: <SwapVert fontSize="small" />,
      comp: <PDFReorder darkMode={darkMode} />,
    },
    {
      key: "ocr",
      label: "OCR Extract",
      icon: <Search fontSize="small" />, // or any icon you like
      comp: <OCREngine darkMode={darkMode} />,
    },
  ];

  const handleMenuClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleMenuClose = () => setAnchorEl(null);

  return (
    <main
      className={`min-h-screen flex flex-col items-center justify-center px-6 py-10 transition-colors duration-500 ${
        darkMode ? "bg-gray-950 text-gray-100" : "bg-gray-50 text-gray-900"
      }`}
    >
      {/* 🌗 Top Bar (Dark Mode Toggle) */}
      <div className="flex justify-end w-full mb-6 max-w-7xl">
        <IconButton
          onClick={() => setDarkMode((prev) => !prev)}
          sx={{
            color: darkMode ? "#facc15" : "#1e3a8a",
            bgcolor: darkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)",
            "&:hover": {
              bgcolor: darkMode ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.1)",
            },
          }}
        >
          {darkMode ? <Brightness7 /> : <Brightness4 />}
        </IconButton>
      </div>

      {/* 🧱 Layout Wrapper */}
      <div className="flex flex-col items-center justify-center w-full gap-10 md:flex-row max-w-7xl">
        {/* 🔹 Left Info Panel */}
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
            A secure, offline-ready suite for <strong>PDF management</strong> —
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

        {/* 🔸 Main Toolkit Panel */}
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
              alignItems: "center",
              justifyContent: "space-between",
              px: 2,
              bgcolor: darkMode ? "#1f2937" : "#e5e7eb",
              borderBottom: darkMode
                ? "1px solid rgba(255,255,255,0.15)"
                : "1px solid rgba(0,0,0,0.1)",
            }}
          >
            <Tabs
              value={tab}
              onChange={(_, val) => setTab(val)}
              variant={isMobile ? "scrollable" : "fullWidth"}
              scrollButtons={isMobile ? "auto" : false}
              allowScrollButtonsMobile
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
                  fontSize: "0.95rem",
                  minHeight: 50,
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
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
              {tabs.map((t) => (
                <Tab
                  key={t.key}
                  icon={t.icon}
                  iconPosition="start"
                  label={t.label}
                />
              ))}
            </Tabs>

            {/* 📱 Mobile “More” Menu */}
            {isMobile && (
              <>
                <IconButton onClick={handleMenuClick}>
                  <MoreVert sx={{ color: darkMode ? "#d1d5db" : "#1f2937" }} />
                </IconButton>
                <Menu
                  anchorEl={anchorEl}
                  open={!!anchorEl}
                  onClose={handleMenuClose}
                >
                  {tabs.map((t, i) => (
                    <MenuItem
                      key={t.key}
                      selected={i === tab}
                      onClick={() => {
                        setTab(i);
                        handleMenuClose();
                      }}
                    >
                      {t.label}
                    </MenuItem>
                  ))}
                </Menu>
              </>
            )}
          </Box>

          {/* 🧩 Tab Content */}
          <Box sx={{ p: { xs: 2, sm: 4 }, minHeight: "580px" }}>
            <AnimatePresence mode="wait">
              {tabs.map(
                (t, i) =>
                  tab === i && (
                    <motion.div
                      key={t.key}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.25 }}
                    >
                      {t.comp}
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
