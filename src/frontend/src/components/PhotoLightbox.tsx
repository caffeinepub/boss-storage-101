import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ChevronLeft, ChevronRight, Download, Mail, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect } from "react";
import type { FileMetadata } from "../backend.d";
import { FileCategory } from "../backend.d";
import {
  downloadFile,
  formatDateTime,
  formatFileSize,
  timestampToDate,
} from "../utils/fileUtils";

interface PhotoLightboxProps {
  files: FileMetadata[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

export function PhotoLightbox({
  files,
  currentIndex,
  onClose,
  onNavigate,
}: PhotoLightboxProps) {
  const photos = files.filter((f) => f.category === FileCategory.photo);
  const file = photos[currentIndex];

  const handlePrev = useCallback(() => {
    onNavigate((currentIndex - 1 + photos.length) % photos.length);
  }, [currentIndex, photos.length, onNavigate]);

  const handleNext = useCallback(() => {
    onNavigate((currentIndex + 1) % photos.length);
  }, [currentIndex, photos.length, onNavigate]);

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

  if (!file) return null;

  const captureDate = file.exifCaptureTimestamp
    ? timestampToDate(file.exifCaptureTimestamp)
    : timestampToDate(file.uploadTimestamp);

  const imageUrl = file.blob.getDirectURL();

  const handleDownload = async () => {
    try {
      await downloadFile(file.blob, file.originalFilename);
    } catch {
      // silent
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center"
        onClick={onClose}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" />

        {/* Content */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="relative z-10 flex flex-col max-w-5xl max-h-[90vh] w-full mx-4"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top bar */}
          <div className="flex items-center justify-between px-4 py-3 bg-card/80 backdrop-blur-md rounded-t-xl border border-border border-b-0">
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-foreground truncate">
                {file.originalFilename}
              </h3>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                <span>{formatDateTime(captureDate)}</span>
                {file.exifCaptureTimestamp && (
                  <span className="text-primary/70">
                    · Original capture date
                  </span>
                )}
                <span>· {formatFileSize(file.sizeBytes)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 ml-4 shrink-0">
              {/* Counter */}
              <span className="text-xs text-muted-foreground">
                {currentIndex + 1} / {photos.length}
              </span>

              {/* Download */}
              <Button
                size="sm"
                variant="ghost"
                className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                onClick={handleDownload}
              >
                <Download className="w-3.5 h-3.5" />
                Download
              </Button>

              {/* Email (disabled) */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 gap-1.5 text-xs opacity-40 cursor-not-allowed"
                    disabled
                  >
                    <Mail className="w-3.5 h-3.5" />
                    Email
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>Email feature not available on current plan</p>
                </TooltipContent>
              </Tooltip>

              {/* Close */}
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                onClick={onClose}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Image area */}
          <div className="relative flex-1 bg-black/60 border-x border-border overflow-hidden">
            <motion.img
              key={file.fileId}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
              src={imageUrl}
              alt={file.originalFilename}
              className="w-full max-h-[65vh] object-contain"
            />

            {/* Navigation arrows */}
            {photos.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrev}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-white transition-all hover:scale-110 active:scale-95"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-white transition-all hover:scale-110 active:scale-95"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}
          </div>

          {/* Thumbnail strip */}
          {photos.length > 1 && (
            <div className="flex gap-1 px-3 py-3 bg-card/80 backdrop-blur-md rounded-b-xl border border-border border-t-0 overflow-x-auto">
              {photos.map((photo, idx) => (
                <button
                  type="button"
                  key={photo.fileId}
                  onClick={() => onNavigate(idx)}
                  className={`shrink-0 w-12 h-12 rounded overflow-hidden border-2 transition-all ${
                    idx === currentIndex
                      ? "border-primary"
                      : "border-transparent opacity-60 hover:opacity-100"
                  }`}
                >
                  <img
                    src={photo.blob.getDirectURL()}
                    alt={photo.originalFilename}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
