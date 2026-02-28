import {
  ChevronDown,
  Music,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Volume2,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { FileMetadata } from "../backend.d";

interface MusicPlayerProps {
  audioFiles: FileMetadata[];
}

export function MusicPlayer({ audioFiles }: MusicPlayerProps) {
  const [trackIndex, setTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [volume, setVolume] = useState(0.75);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [showTrackList, setShowTrackList] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const urlRef = useRef<string | null>(null);

  const currentTrack = audioFiles[trackIndex] ?? null;

  // Clean up previous object URL when track changes
  const releaseUrl = useCallback(() => {
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
      setAudioUrl(null);
    }
  }, []);

  // Load and play a track
  const loadTrack = useCallback(
    async (file: FileMetadata, playAfterLoad: boolean) => {
      if (isLoading) return;
      releaseUrl();
      setIsLoading(true);
      setIsPlaying(false);
      try {
        const bytes = await file.blob.getBytes();
        const blob = new Blob([bytes], { type: file.mimeType });
        const url = URL.createObjectURL(blob);
        urlRef.current = url;
        setAudioUrl(url);
        if (playAfterLoad) {
          // Let audio element mount with new src before playing
          setTimeout(() => {
            if (audioRef.current) {
              audioRef.current.volume = volume;
              audioRef.current.play().catch(() => {});
              setIsPlaying(true);
            }
          }, 80);
        }
      } catch {
        // silent fail
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, releaseUrl, volume],
  );

  // Apply volume changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // When track index changes (via next/prev/list), reload
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally runs on trackIndex changes
  useEffect(() => {
    if (!currentTrack) return;
    if (isPlaying) {
      loadTrack(currentTrack, true);
    } else {
      releaseUrl();
      setAudioUrl(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trackIndex]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      releaseUrl();
    };
  }, [releaseUrl]);

  const handlePlayPause = async () => {
    if (!currentTrack) return;
    if (!audioUrl && !isLoading) {
      await loadTrack(currentTrack, true);
      return;
    }
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play().catch(() => {});
        setIsPlaying(true);
      }
    }
  };

  const handlePrev = () => {
    setTrackIndex((i) => (i - 1 + audioFiles.length) % audioFiles.length);
  };

  const handleNext = () => {
    setTrackIndex((i) => (i + 1) % audioFiles.length);
  };

  const handleSelectTrack = (idx: number) => {
    setTrackIndex(idx);
    setShowTrackList(false);
    if (isPlaying) {
      // Load and auto-play via useEffect watching trackIndex
    }
  };

  const handleEnded = () => {
    // Auto-advance to next track
    setTrackIndex((i) => (i + 1) % audioFiles.length);
  };

  if (audioFiles.length === 0) return null;

  const trackName = currentTrack
    ? currentTrack.originalFilename.replace(/\.[^/.]+$/, "")
    : "No track selected";

  const player = (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      transition={{ type: "spring", stiffness: 280, damping: 28 }}
      className="fixed bottom-0 left-0 right-0 z-50 select-none"
      style={{
        background:
          "linear-gradient(to right, oklch(0.10 0.008 240 / 0.97), oklch(0.12 0.01 240 / 0.97))",
        borderTop: "1px solid oklch(0.25 0.012 240)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}
    >
      {/* Hidden audio element */}
      {/* biome-ignore lint/a11y/useMediaCaption: user-uploaded audio */}
      <audio
        ref={audioRef}
        src={audioUrl ?? undefined}
        onEnded={handleEnded}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      {/* Track list dropdown */}
      <AnimatePresence>
        {showTrackList && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.18 }}
            className="absolute bottom-full left-0 right-0 overflow-hidden"
            style={{
              background: "oklch(0.11 0.009 240 / 0.98)",
              borderTop: "1px solid oklch(0.25 0.012 240)",
              backdropFilter: "blur(20px)",
              maxHeight: "220px",
              overflowY: "auto",
            }}
          >
            <div className="py-2 px-2">
              <p
                className="text-[10px] font-semibold tracking-widest uppercase px-2 py-1 mb-1"
                style={{ color: "oklch(0.45 0.01 240)" }}
              >
                Tracks ({audioFiles.length})
              </p>
              {audioFiles.map((f, idx) => (
                <button
                  type="button"
                  key={f.fileId}
                  onClick={() => handleSelectTrack(idx)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-all"
                  style={{
                    background:
                      idx === trackIndex
                        ? "oklch(0.75 0.18 70 / 0.12)"
                        : "transparent",
                    color:
                      idx === trackIndex
                        ? "oklch(0.85 0.15 70)"
                        : "oklch(0.7 0.01 240)",
                  }}
                  onMouseEnter={(e) => {
                    if (idx !== trackIndex) {
                      (e.currentTarget as HTMLElement).style.background =
                        "oklch(0.18 0.012 240)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (idx !== trackIndex) {
                      (e.currentTarget as HTMLElement).style.background =
                        "transparent";
                    }
                  }}
                >
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                    style={{
                      background:
                        idx === trackIndex
                          ? "oklch(0.75 0.18 70 / 0.2)"
                          : "oklch(0.2 0.01 240)",
                    }}
                  >
                    {idx === trackIndex && isPlaying ? (
                      <EqualizerBars />
                    ) : (
                      <Music className="w-3 h-3" />
                    )}
                  </div>
                  <span className="text-xs font-medium truncate flex-1">
                    {f.originalFilename.replace(/\.[^/.]+$/, "")}
                  </span>
                  {idx === trackIndex && (
                    <span
                      className="text-[10px] shrink-0"
                      style={{ color: "oklch(0.65 0.1 70)" }}
                    >
                      Now playing
                    </span>
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Player bar */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 h-16">
          {/* Track info */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
              style={{
                background: isPlaying
                  ? "oklch(0.75 0.18 70 / 0.15)"
                  : "oklch(0.18 0.012 240)",
                border: `1px solid ${isPlaying ? "oklch(0.75 0.18 70 / 0.4)" : "oklch(0.25 0.012 240)"}`,
              }}
            >
              {isPlaying ? (
                <EqualizerBars />
              ) : (
                <Music
                  className="w-4 h-4"
                  style={{
                    color: isPlaying
                      ? "oklch(0.85 0.15 70)"
                      : "oklch(0.5 0.01 240)",
                  }}
                />
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowTrackList((v) => !v)}
              className="flex items-center gap-1.5 min-w-0 group"
            >
              <div className="min-w-0">
                <p
                  className="text-xs font-semibold truncate max-w-[180px] sm:max-w-xs group-hover:text-foreground transition-colors"
                  style={{ color: "oklch(0.85 0.02 80)" }}
                >
                  {trackName}
                </p>
                <p
                  className="text-[10px] mt-0.5"
                  style={{ color: "oklch(0.45 0.01 240)" }}
                >
                  {audioFiles.length} track{audioFiles.length !== 1 ? "s" : ""}{" "}
                  in library
                </p>
              </div>
              <ChevronDown
                className="w-3.5 h-3.5 shrink-0 transition-transform"
                style={{
                  color: "oklch(0.45 0.01 240)",
                  transform: showTrackList ? "rotate(180deg)" : "rotate(0deg)",
                }}
              />
            </button>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handlePrev}
              disabled={audioFiles.length <= 1}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95 disabled:opacity-30"
              style={{
                color: "oklch(0.6 0.01 240)",
                background: "transparent",
              }}
              aria-label="Previous track"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handlePlayPause}
              disabled={isLoading}
              className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95 disabled:opacity-60"
              style={{
                background: "oklch(0.75 0.18 70)",
                color: "oklch(0.1 0.01 240)",
                boxShadow: isPlaying
                  ? "0 0 20px oklch(0.75 0.18 70 / 0.4)"
                  : "none",
              }}
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isLoading ? (
                <div
                  className="w-4 h-4 rounded-full border-2 animate-spin"
                  style={{
                    borderColor: "oklch(0.1 0.01 240 / 0.3)",
                    borderTopColor: "oklch(0.1 0.01 240)",
                  }}
                />
              ) : isPlaying ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4 ml-0.5" />
              )}
            </button>

            <button
              type="button"
              onClick={handleNext}
              disabled={audioFiles.length <= 1}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95 disabled:opacity-30"
              style={{
                color: "oklch(0.6 0.01 240)",
                background: "transparent",
              }}
              aria-label="Next track"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          {/* Volume */}
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            <Volume2
              className="w-3.5 h-3.5"
              style={{ color: "oklch(0.45 0.01 240)" }}
            />
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-20 h-1 appearance-none rounded-full cursor-pointer"
              style={{
                background: `linear-gradient(to right, oklch(0.75 0.18 70) ${volume * 100}%, oklch(0.25 0.012 240) ${volume * 100}%)`,
              }}
              aria-label="Volume"
            />
          </div>
        </div>
      </div>
    </motion.div>
  );

  return createPortal(
    <AnimatePresence>{player}</AnimatePresence>,
    document.body,
  );
}

function EqualizerBars() {
  return (
    <div className="flex items-end gap-0.5 h-4">
      <div
        className="w-0.5 rounded-sm"
        style={{
          background: "oklch(0.75 0.18 70)",
          animation: "eq-bar1 0.8s ease-in-out infinite alternate",
          height: "60%",
        }}
      />
      <div
        className="w-0.5 rounded-sm"
        style={{
          background: "oklch(0.75 0.18 70)",
          animation: "eq-bar2 0.6s ease-in-out infinite alternate",
          height: "100%",
        }}
      />
      <div
        className="w-0.5 rounded-sm"
        style={{
          background: "oklch(0.75 0.18 70)",
          animation: "eq-bar3 1.0s ease-in-out infinite alternate",
          height: "40%",
        }}
      />
    </div>
  );
}
