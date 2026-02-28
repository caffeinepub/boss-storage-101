import { X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { FileMetadata } from "../backend.d";
import { formatFileSize } from "../utils/fileUtils";

interface VideoLightboxProps {
  file: FileMetadata;
  onClose: () => void;
}

export function VideoLightbox({ file, onClose }: VideoLightboxProps) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Load video URL on mount using direct URL (same pattern as PhotoCard)
  useEffect(() => {
    const url = file.blob.getDirectURL();
    setVideoUrl(url);
    setIsLoading(false);
  }, [file]);

  // Escape key listener
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  // Prevent body scroll while lightbox is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // Derive a readable format label
  const formatLabel = file.mimeType
    .replace("video/", "")
    .replace("x-", "")
    .replace("quicktime", "MOV")
    .replace("msvideo", "AVI")
    .replace("matroska", "MKV")
    .toUpperCase();

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
              <h3 className="text-sm font-semibold text-white truncate">
                {file.originalFilename}
              </h3>
              <p className="text-xs text-white/50 mt-0.5">
                {formatLabel} · {formatFileSize(file.sizeBytes)}
              </p>
            </div>

            {/* Close button */}
            <button
              type="button"
              onClick={onClose}
              className="ml-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-all shrink-0"
              aria-label="Close video player"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Video area */}
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
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
