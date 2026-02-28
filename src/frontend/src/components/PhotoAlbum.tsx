import { ChevronLeft, ChevronRight, Pause, Play, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { FileMetadata } from "../backend.d";
import { formatDateTime, timestampToDate } from "../utils/fileUtils";

interface PhotoAlbumProps {
  files: FileMetadata[];
  onClose: () => void;
}

export function PhotoAlbum({ files, onClose }: PhotoAlbumProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [autoPlay, setAutoPlay] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const thumbnailRef = useRef<HTMLDivElement>(null);
  const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const file = files[currentIndex];

  const handlePrev = useCallback(() => {
    setCurrentIndex((i) => (i - 1 + files.length) % files.length);
    setImageLoaded(false);
  }, [files.length]);

  const handleNext = useCallback(() => {
    setCurrentIndex((i) => (i + 1) % files.length);
    setImageLoaded(false);
  }, [files.length]);

  // Auto-advance
  useEffect(() => {
    if (autoPlay && files.length > 1) {
      autoPlayRef.current = setInterval(() => {
        setCurrentIndex((i) => (i + 1) % files.length);
        setImageLoaded(false);
      }, 4000);
    }
    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, [autoPlay, files.length]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "ArrowRight") handleNext();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose, handlePrev, handleNext]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // Scroll thumbnail into view
  useEffect(() => {
    const strip = thumbnailRef.current;
    if (!strip) return;
    const thumb = strip.children[currentIndex] as HTMLElement | undefined;
    if (thumb) {
      thumb.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    }
  }, [currentIndex]);

  if (!file) return null;

  const captureDate = file.exifCaptureTimestamp
    ? timestampToDate(file.exifCaptureTimestamp)
    : timestampToDate(file.uploadTimestamp);

  const imageUrl = file.blob.getDirectURL();

  const content = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-[100] flex flex-col"
      style={{ background: "oklch(0.06 0.005 240)" }}
    >
      {/* Background blur from current image */}
      <div
        className="absolute inset-0 opacity-20 blur-3xl scale-110 pointer-events-none"
        style={{
          backgroundImage: `url(${imageUrl})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-4">
          <span
            className="text-sm font-medium"
            style={{ color: "oklch(0.7 0.05 80)" }}
          >
            Photo Album
          </span>
          <span
            className="text-xs px-2 py-0.5 rounded-full"
            style={{
              background: "oklch(0.2 0.01 240)",
              color: "oklch(0.65 0.1 70)",
              border: "1px solid oklch(0.3 0.015 240)",
            }}
          >
            {currentIndex + 1} / {files.length}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Auto-play toggle */}
          <button
            type="button"
            onClick={() => setAutoPlay((v) => !v)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
            style={{
              background: autoPlay
                ? "oklch(0.75 0.18 70 / 0.2)"
                : "oklch(0.2 0.01 240)",
              border: `1px solid ${autoPlay ? "oklch(0.75 0.18 70 / 0.6)" : "oklch(0.3 0.015 240)"}`,
              color: autoPlay ? "oklch(0.85 0.15 70)" : "oklch(0.6 0.01 240)",
            }}
            aria-label={autoPlay ? "Stop slideshow" : "Start slideshow"}
          >
            {autoPlay ? (
              <Pause className="w-3.5 h-3.5" />
            ) : (
              <Play className="w-3.5 h-3.5" />
            )}
            Slideshow
          </button>

          {/* Close */}
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95"
            style={{
              background: "oklch(0.2 0.01 240)",
              border: "1px solid oklch(0.3 0.015 240)",
              color: "oklch(0.7 0.01 80)",
            }}
            aria-label="Close album"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main image area */}
      <div className="relative flex-1 flex items-center justify-center px-16 pb-4 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={file.fileId}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: imageLoaded ? 1 : 0, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="relative max-h-full max-w-full"
          >
            <img
              src={imageUrl}
              alt={file.originalFilename}
              className="max-h-[calc(100vh-280px)] max-w-full object-contain rounded-lg shadow-2xl"
              style={{
                boxShadow: "0 25px 80px oklch(0 0 0 / 0.8)",
              }}
              onLoad={() => setImageLoaded(true)}
            />
          </motion.div>
        </AnimatePresence>

        {/* Loading state */}
        {!imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="w-10 h-10 rounded-full border-2 animate-spin"
              style={{
                borderColor: "oklch(0.3 0.015 240)",
                borderTopColor: "oklch(0.75 0.18 70)",
              }}
            />
          </div>
        )}

        {/* Navigation arrows */}
        {files.length > 1 && (
          <>
            <motion.button
              type="button"
              onClick={handlePrev}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full flex items-center justify-center transition-all"
              style={{
                background: "oklch(0.15 0.008 240 / 0.9)",
                border: "1px solid oklch(0.28 0.015 240)",
                color: "oklch(0.9 0.01 80)",
                backdropFilter: "blur(8px)",
              }}
              aria-label="Previous photo"
            >
              <ChevronLeft className="w-6 h-6" />
            </motion.button>

            <motion.button
              type="button"
              onClick={handleNext}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full flex items-center justify-center transition-all"
              style={{
                background: "oklch(0.15 0.008 240 / 0.9)",
                border: "1px solid oklch(0.28 0.015 240)",
                color: "oklch(0.9 0.01 80)",
                backdropFilter: "blur(8px)",
              }}
              aria-label="Next photo"
            >
              <ChevronRight className="w-6 h-6" />
            </motion.button>
          </>
        )}
      </div>

      {/* Caption */}
      <div className="relative z-10 text-center pb-3 px-4">
        <p
          className="text-sm font-medium truncate max-w-md mx-auto"
          style={{ color: "oklch(0.85 0.02 80)" }}
        >
          {file.originalFilename}
        </p>
        <p className="text-xs mt-0.5" style={{ color: "oklch(0.5 0.01 240)" }}>
          {formatDateTime(captureDate)}
          {file.exifCaptureTimestamp && (
            <span style={{ color: "oklch(0.65 0.1 70)" }}>
              {" "}
              · Original capture date
            </span>
          )}
        </p>
      </div>

      {/* Thumbnail strip */}
      {files.length > 1 && (
        <div
          className="relative z-10 pb-4 px-4"
          style={{
            background:
              "linear-gradient(to top, oklch(0.06 0.005 240), transparent)",
          }}
        >
          <div
            ref={thumbnailRef}
            className="flex gap-2 overflow-x-auto pb-1"
            style={{ scrollbarWidth: "none" }}
          >
            {files.map((photo, idx) => (
              <motion.button
                type="button"
                key={photo.fileId}
                onClick={() => {
                  setCurrentIndex(idx);
                  setImageLoaded(false);
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="shrink-0 w-14 h-14 rounded overflow-hidden transition-all"
                style={{
                  border: `2px solid ${idx === currentIndex ? "oklch(0.75 0.18 70)" : "oklch(0.25 0.012 240)"}`,
                  opacity: idx === currentIndex ? 1 : 0.5,
                  outline:
                    idx === currentIndex
                      ? "0 0 0 1px oklch(0.75 0.18 70 / 0.3)"
                      : "none",
                  boxShadow:
                    idx === currentIndex
                      ? "0 0 12px oklch(0.75 0.18 70 / 0.4)"
                      : "none",
                }}
                aria-label={`Go to photo ${idx + 1}`}
              >
                <img
                  src={photo.blob.getDirectURL()}
                  alt={photo.originalFilename}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Auto-play progress bar */}
      {autoPlay && (
        <motion.div
          key={currentIndex}
          className="absolute bottom-0 left-0 h-0.5"
          style={{ background: "oklch(0.75 0.18 70)" }}
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: 4, ease: "linear" }}
        />
      )}
    </motion.div>
  );

  return createPortal(
    <AnimatePresence>{content}</AnimatePresence>,
    document.body,
  );
}
