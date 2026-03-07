import { ChevronLeft, ChevronRight, Download, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { FileMetadata } from "../backend.d";
import { downloadFile, formatFileSize } from "../utils/fileUtils";

interface VideoLightboxProps {
  files: FileMetadata[];
  currentIndex: number;
  onNavigate: (index: number) => void;
  onClose: () => void;
}

export function VideoLightbox({
  files,
  currentIndex,
  onNavigate,
  onClose,
}: VideoLightboxProps) {
  const file = files[currentIndex];
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Load video URL whenever the current index changes
  useEffect(() => {
    if (!file) return;
    setIsLoading(true);
    setVideoUrl(null);
    const url = file.blob.getDirectURL();
    setVideoUrl(url);
  }, [file]);

  // Keyboard: Escape to close, ArrowLeft/ArrowRight to navigate
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft" && currentIndex > 0) {
        onNavigate(currentIndex - 1);
      } else if (e.key === "ArrowRight" && currentIndex < files.length - 1) {
        onNavigate(currentIndex + 1);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose, onNavigate, currentIndex, files.length]);

  // Prevent body scroll while lightbox is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  if (!file) return null;

  // Derive a readable format label
  const formatLabel = file.mimeType
    .replace("video/", "")
    .replace("x-", "")
    .replace("quicktime", "MOV")
    .replace("msvideo", "AVI")
    .replace("matroska", "MKV")
    .toUpperCase();

  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < files.length - 1;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center"
        onClick={onClose}
      >
        {/* Dark backdrop */}
        <div className="absolute inset-0 bg-black/92 backdrop-blur-sm" />

        {/* Content container */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="relative z-10 flex flex-col max-w-5xl w-full mx-4"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top bar */}
          <div className="flex items-center justify-between px-4 py-3 bg-black/80 backdrop-blur-md rounded-t-xl border border-white/10">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-white truncate">
                  {file.originalFilename}
                </h3>
                {files.length > 1 && (
                  <span className="text-xs text-white/40 shrink-0">
                    {currentIndex + 1} / {files.length}
                  </span>
                )}
              </div>
              <p className="text-xs text-white/50 mt-0.5">
                {formatLabel} · {formatFileSize(file.sizeBytes)}
              </p>
            </div>

            {/* Download button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                void downloadFile(file.blob, file.originalFilename);
              }}
              className="ml-2 flex items-center gap-1.5 px-3 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white text-xs transition-all shrink-0"
              aria-label="Download video"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download</span>
            </button>

            {/* Close button */}
            <button
              type="button"
              onClick={onClose}
              className="ml-2 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-all shrink-0"
              aria-label="Close video player"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Video area with nav arrows */}
          <div className="relative bg-black border-x border-b border-white/10 rounded-b-xl overflow-hidden">
            {isLoading && (
              <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-2 border-white/20 border-t-white/70 rounded-full animate-spin" />
              </div>
            )}

            {videoUrl && (
              // biome-ignore lint/a11y/useMediaCaption: video player for user-uploaded files
              <video
                ref={videoRef}
                src={videoUrl}
                controls
                autoPlay
                className="w-full max-h-[80vh] object-contain"
                style={{ display: isLoading ? "none" : "block" }}
                onLoadedData={() => setIsLoading(false)}
              />
            )}

            {/* Prev arrow */}
            {hasPrev && (
              <button
                type="button"
                data-ocid="video_lightbox.prev_button"
                onClick={() => onNavigate(currentIndex - 1)}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/75 border border-white/20 flex items-center justify-center text-white/80 hover:text-white transition-all backdrop-blur-sm z-10"
                aria-label="Previous video"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}

            {/* Next arrow */}
            {hasNext && (
              <button
                type="button"
                data-ocid="video_lightbox.next_button"
                onClick={() => onNavigate(currentIndex + 1)}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/75 border border-white/20 flex items-center justify-center text-white/80 hover:text-white transition-all backdrop-blur-sm z-10"
                aria-label="Next video"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
