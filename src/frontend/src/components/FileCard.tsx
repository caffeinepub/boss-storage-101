import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Check,
  Download,
  FileText,
  Film,
  FolderInput,
  FolderMinus,
  FolderOpen,
  ImageIcon,
  Music,
  Pause,
  Play,
  Trash2,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { FileMetadata } from "../backend.d";
import { FileCategory } from "../backend.d";
import type { Folder } from "../hooks/useQueries";
import { useMoveFileToFolder } from "../hooks/useQueries";
import {
  downloadFile,
  formatDateShort,
  formatFileSize,
  isVideoMime,
  timestampToDate,
} from "../utils/fileUtils";

interface FileCardProps {
  file: FileMetadata;
  isSelected: boolean;
  onSelect: (fileId: string) => void;
  onDelete: (fileId: string) => void;
  onOpenLightbox?: (file: FileMetadata) => void;
  index: number;
  folders?: Folder[];
  currentFolderName?: string;
}

// Shared Move-to-Folder dropdown – uses hook at top level of a component
interface FolderMenuContentProps {
  file: FileMetadata;
  folders: Folder[];
}
function FolderMenuContent({ file, folders }: FolderMenuContentProps) {
  const { mutateAsync: moveFile } = useMoveFileToFolder();

  return (
    <>
      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
        Move to folder
      </div>
      {folders.map((f) => (
        <DropdownMenuItem
          key={f.folderId}
          onClick={(e) => {
            e.stopPropagation();
            moveFile({ fileId: file.fileId, folderId: f.folderId });
          }}
          disabled={file.folderId === f.folderId}
          className="gap-2 text-sm cursor-pointer"
        >
          <FolderOpen className="w-3.5 h-3.5 text-primary" />
          <span className="truncate">{f.name}</span>
          {file.folderId === f.folderId && (
            <Check className="w-3 h-3 ml-auto text-primary shrink-0" />
          )}
        </DropdownMenuItem>
      ))}
      {file.folderId && (
        <>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              moveFile({ fileId: file.fileId, folderId: null });
            }}
            className="gap-2 text-sm cursor-pointer text-muted-foreground"
          >
            <FolderMinus className="w-3.5 h-3.5" />
            Remove from folder
          </DropdownMenuItem>
        </>
      )}
      {folders.length === 0 && (
        <div className="px-2 py-2 text-xs text-muted-foreground">
          No folders yet
        </div>
      )}
    </>
  );
}

export function FileCard({
  file,
  isSelected,
  onSelect,
  onDelete,
  onOpenLightbox,
  index,
  folders = [],
  currentFolderName,
}: FileCardProps) {
  const captureDate = file.exifCaptureTimestamp
    ? timestampToDate(file.exifCaptureTimestamp)
    : timestampToDate(file.uploadTimestamp);

  const isPhoto = file.category === FileCategory.photo;
  const isPdf = file.category === FileCategory.pdf;
  const isAudio = file.category === FileCategory.audio;
  const isHeic = file.category === FileCategory.heic;
  const isVideo = isVideoMime(file.mimeType);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(file.fileId);
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await downloadFile(file.blob, file.originalFilename);
    } catch {
      // silent
    }
  };

  const handleCheckbox = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(file.fileId);
  };

  if (isPhoto) {
    return (
      <PhotoCard
        file={file}
        isSelected={isSelected}
        captureDate={captureDate}
        onSelect={handleCheckbox}
        onDelete={handleDelete}
        onDownload={handleDownload}
        onOpenLightbox={() => onOpenLightbox?.(file)}
        index={index}
        folders={folders}
        currentFolderName={currentFolderName}
      />
    );
  }

  if (isVideo) {
    return (
      <VideoCard
        file={file}
        isSelected={isSelected}
        captureDate={captureDate}
        onSelect={handleCheckbox}
        onDelete={handleDelete}
        onDownload={handleDownload}
        index={index}
        folders={folders}
        currentFolderName={currentFolderName}
      />
    );
  }

  if (isAudio) {
    return (
      <AudioCard
        file={file}
        isSelected={isSelected}
        captureDate={captureDate}
        onSelect={handleCheckbox}
        onDelete={handleDelete}
        onDownload={handleDownload}
        index={index}
        folders={folders}
        currentFolderName={currentFolderName}
      />
    );
  }

  // PDF and HEIC
  return (
    <DocumentCard
      file={file}
      isSelected={isSelected}
      isPdf={isPdf}
      isHeic={isHeic}
      captureDate={captureDate}
      onSelect={handleCheckbox}
      onDelete={handleDelete}
      onDownload={handleDownload}
      index={index}
      folders={folders}
      currentFolderName={currentFolderName}
    />
  );
}

interface PhotoCardProps {
  file: FileMetadata;
  isSelected: boolean;
  captureDate: Date;
  onSelect: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
  onDownload: (e: React.MouseEvent) => void;
  onOpenLightbox: () => void;
  index: number;
  folders?: Folder[];
  currentFolderName?: string;
}

function PhotoCard({
  file,
  isSelected,
  captureDate,
  onSelect,
  onDelete,
  onDownload,
  onOpenLightbox,
  index,
  folders = [],
  currentFolderName,
}: PhotoCardProps) {
  const imageUrl = file.blob.getDirectURL();
  const folderName =
    !currentFolderName && file.folderId
      ? folders.find((f) => f.folderId === file.folderId)?.name
      : undefined;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      className={`group relative rounded-lg overflow-hidden border bg-card card-lift cursor-pointer ${
        isSelected ? "card-selected" : "border-border"
      }`}
      onClick={onOpenLightbox}
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-muted">
        <img
          src={imageUrl}
          alt={file.originalFilename}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />

        {/* Date overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2">
          <p className="text-xs text-white/90 font-medium">
            {formatDateShort(captureDate)}
          </p>
          {file.exifCaptureTimestamp && (
            <p className="text-[10px] text-white/60">Original capture</p>
          )}
        </div>

        {/* Selection overlay */}
        {isSelected && <div className="absolute inset-0 bg-primary/10" />}
      </div>

      {/* Checkbox */}
      <button
        type="button"
        className="absolute top-2 left-2 z-10"
        onClick={onSelect}
        onKeyUp={(e) =>
          e.key === "Enter" && onSelect(e as unknown as React.MouseEvent)
        }
        aria-label={isSelected ? "Deselect file" : "Select file"}
      >
        <div
          className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${
            isSelected
              ? "bg-primary border-primary"
              : "bg-black/40 border-white/60 opacity-0 group-hover:opacity-100"
          }`}
        >
          {isSelected && (
            <Check className="w-3.5 h-3.5 text-primary-foreground" />
          )}
        </div>
      </button>

      {/* Action buttons */}
      <div className="absolute top-2 right-2 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={onDownload}
              className="w-7 h-7 rounded bg-black/60 hover:bg-black/80 flex items-center justify-center text-white/80 hover:text-white transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent>Download</TooltipContent>
        </Tooltip>
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  onClick={(e) => e.stopPropagation()}
                  className="w-7 h-7 rounded bg-black/60 hover:bg-primary/70 flex items-center justify-center text-white/80 hover:text-white transition-colors"
                >
                  <FolderInput className="w-3.5 h-3.5" />
                </button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>Move to folder</TooltipContent>
          </Tooltip>
          <DropdownMenuContent
            className="w-44 bg-popover border-border"
            onClick={(e) => e.stopPropagation()}
          >
            <FolderMenuContent file={file} folders={folders} />
          </DropdownMenuContent>
        </DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={onDelete}
              className="w-7 h-7 rounded bg-black/60 hover:bg-destructive/80 flex items-center justify-center text-white/80 hover:text-white transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent>Delete</TooltipContent>
        </Tooltip>
      </div>

      {/* Filename + folder badge */}
      <div className="p-2">
        <p className="text-xs text-muted-foreground truncate">
          {file.originalFilename}
        </p>
        {folderName && (
          <Badge
            variant="secondary"
            className="mt-1 text-[10px] h-4 px-1.5 py-0 bg-primary/10 text-primary border-primary/20 max-w-full block truncate"
          >
            {folderName}
          </Badge>
        )}
      </div>
    </motion.div>
  );
}

interface VideoCardProps {
  file: FileMetadata;
  isSelected: boolean;
  captureDate: Date;
  onSelect: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
  onDownload: (e: React.MouseEvent) => void;
  index: number;
  folders?: Folder[];
  currentFolderName?: string;
}

function VideoCard({
  file,
  isSelected,
  captureDate,
  onSelect,
  onDelete,
  onDownload,
  index,
  folders = [],
  currentFolderName,
}: VideoCardProps) {
  const folderName =
    !currentFolderName && file.folderId
      ? folders.find((f) => f.folderId === file.folderId)?.name
      : undefined;

  // Derive a human-readable format label from MIME type
  const formatLabel = file.mimeType
    .replace("video/", "")
    .replace("x-", "")
    .replace("quicktime", "MOV")
    .replace("msvideo", "AVI")
    .replace("matroska", "MKV")
    .toUpperCase();

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      className={`group relative rounded-lg border bg-card card-lift ${
        isSelected ? "card-selected" : "border-border"
      }`}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex flex-col items-center justify-center w-10 h-10 rounded-lg border border-violet-500/20 bg-violet-500/10 shrink-0">
            <Film className="w-5 h-5 text-violet-400" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {file.originalFilename}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {formatLabel} · {formatFileSize(file.sizeBytes)}
            </p>
          </div>

          <button
            type="button"
            className="flex items-center"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(e);
            }}
            aria-label={isSelected ? "Deselect" : "Select"}
          >
            <Checkbox
              checked={isSelected}
              className="w-5 h-5 pointer-events-none"
            />
          </button>
        </div>

        <p className="text-xs text-muted-foreground mt-2">
          {formatDateShort(captureDate)}
        </p>

        {/* Folder badge */}
        {folderName && (
          <Badge
            variant="secondary"
            className="mt-1.5 text-[10px] h-4 px-1.5 py-0 bg-violet-500/10 text-violet-400 border-violet-500/20"
          >
            {folderName}
          </Badge>
        )}

        <div className="flex gap-2 mt-3 pt-3 border-t border-border">
          <Button
            size="sm"
            variant="ghost"
            className="flex-1 h-7 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
            onClick={onDownload}
          >
            <Download className="w-3 h-3" />
            Download
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-xs text-muted-foreground hover:text-violet-400"
                onClick={(e) => e.stopPropagation()}
              >
                <FolderInput className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-44 bg-popover border-border">
              <FolderMenuContent file={file} folders={folders} />
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            size="sm"
            variant="ghost"
            className="flex-1 h-7 text-xs gap-1.5 text-destructive/80 hover:text-destructive hover:bg-destructive/10"
            onClick={onDelete}
          >
            <Trash2 className="w-3 h-3" />
            Delete
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

interface AudioCardProps {
  file: FileMetadata;
  isSelected: boolean;
  captureDate: Date;
  onSelect: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
  onDownload: (e: React.MouseEvent) => void;
  index: number;
  folders?: Folder[];
  currentFolderName?: string;
}

function AudioCard({
  file,
  isSelected,
  captureDate,
  onSelect,
  onDelete,
  onDownload,
  index,
  folders = [],
  currentFolderName,
}: AudioCardProps) {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const folderName =
    !currentFolderName && file.folderId
      ? folders.find((f) => f.folderId === file.folderId)?.name
      : undefined;

  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const handlePlayPause = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!audioUrl && !isLoading) {
      setIsLoading(true);
      try {
        const bytes = await file.blob.getBytes();
        const blob = new Blob([bytes], { type: file.mimeType });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        setIsLoading(false);
        setTimeout(() => {
          audioRef.current?.play();
          setIsPlaying(true);
        }, 100);
      } catch {
        setIsLoading(false);
      }
      return;
    }
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      className={`group relative rounded-lg border bg-card card-lift ${
        isSelected ? "card-selected" : "border-border"
      }`}
    >
      <div className="p-4">
        {/* Header row */}
        <div className="flex items-start gap-3">
          <button
            type="button"
            className="flex items-center justify-center w-10 h-10 rounded-lg bg-chart-1/10 border border-chart-1/20 shrink-0 cursor-pointer"
            onClick={handlePlayPause}
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-chart-1/30 border-t-chart-1 rounded-full animate-spin" />
            ) : isPlaying ? (
              <Pause className="w-4 h-4 text-chart-1" />
            ) : (
              <Play className="w-4 h-4 text-chart-1" />
            )}
          </button>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {file.originalFilename}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {formatFileSize(file.sizeBytes)}
            </p>
          </div>

          <button
            type="button"
            className="flex items-center"
            onClick={onSelect}
            aria-label={isSelected ? "Deselect" : "Select"}
          >
            <Checkbox
              checked={isSelected}
              className="w-5 h-5 pointer-events-none"
            />
          </button>
        </div>

        {/* Audio player */}
        {audioUrl && (
          <div className="mt-3">
            {/* biome-ignore lint/a11y/useMediaCaption: audio player for user-uploaded files */}
            <audio
              ref={audioRef}
              src={audioUrl}
              onEnded={() => setIsPlaying(false)}
              onPause={() => setIsPlaying(false)}
              onPlay={() => setIsPlaying(true)}
              controls
              className="w-full h-8"
              style={{ height: "32px" }}
            />
          </div>
        )}

        {/* Date */}
        <p className="text-xs text-muted-foreground mt-2">
          {formatDateShort(captureDate)}
        </p>

        {/* Folder badge */}
        {folderName && (
          <Badge
            variant="secondary"
            className="mt-1.5 text-[10px] h-4 px-1.5 py-0 bg-primary/10 text-primary border-primary/20"
          >
            {folderName}
          </Badge>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-3 pt-3 border-t border-border">
          <Button
            size="sm"
            variant="ghost"
            className="flex-1 h-7 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
            onClick={onDownload}
          >
            <Download className="w-3 h-3" />
            Download
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-xs text-muted-foreground hover:text-primary"
                onClick={(e) => e.stopPropagation()}
              >
                <FolderInput className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-44 bg-popover border-border">
              <FolderMenuContent file={file} folders={folders} />
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            size="sm"
            variant="ghost"
            className="flex-1 h-7 text-xs gap-1.5 text-destructive/80 hover:text-destructive hover:bg-destructive/10"
            onClick={onDelete}
          >
            <Trash2 className="w-3 h-3" />
            Delete
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

interface DocumentCardProps {
  file: FileMetadata;
  isSelected: boolean;
  isPdf: boolean;
  isHeic: boolean;
  captureDate: Date;
  onSelect: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
  onDownload: (e: React.MouseEvent) => void;
  index: number;
  folders?: Folder[];
  currentFolderName?: string;
}

function DocumentCard({
  file,
  isSelected,
  isPdf,
  isHeic,
  captureDate,
  onSelect,
  onDelete,
  onDownload,
  index,
  folders = [],
  currentFolderName,
}: DocumentCardProps) {
  const Icon = isPdf ? FileText : isHeic ? ImageIcon : FileText;
  const iconColor = isPdf
    ? "text-red-400"
    : isHeic
      ? "text-blue-400"
      : "text-muted-foreground";
  const iconBg = isPdf
    ? "bg-red-500/10 border-red-500/20"
    : isHeic
      ? "bg-blue-500/10 border-blue-500/20"
      : "bg-muted border-border";
  const label = isPdf ? "PDF" : isHeic ? "HEIC" : "FILE";

  const folderName =
    !currentFolderName && file.folderId
      ? folders.find((f) => f.folderId === file.folderId)?.name
      : undefined;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      className={`group relative rounded-lg border bg-card card-lift ${
        isSelected ? "card-selected" : "border-border"
      }`}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div
            className={`flex flex-col items-center justify-center w-10 h-10 rounded-lg border shrink-0 ${iconBg}`}
          >
            <Icon className={`w-5 h-5 ${iconColor}`} />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {file.originalFilename}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {label} · {formatFileSize(file.sizeBytes)}
            </p>
          </div>

          <button
            type="button"
            className="flex items-center"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(e);
            }}
            aria-label={isSelected ? "Deselect" : "Select"}
          >
            <Checkbox
              checked={isSelected}
              className="w-5 h-5 pointer-events-none"
            />
          </button>
        </div>

        <p className="text-xs text-muted-foreground mt-2">
          {formatDateShort(captureDate)}
        </p>

        {/* Folder badge */}
        {folderName && (
          <Badge
            variant="secondary"
            className="mt-1.5 text-[10px] h-4 px-1.5 py-0 bg-primary/10 text-primary border-primary/20"
          >
            {folderName}
          </Badge>
        )}

        <div className="flex gap-2 mt-3 pt-3 border-t border-border">
          <Button
            size="sm"
            variant="ghost"
            className="flex-1 h-7 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
            onClick={onDownload}
          >
            <Download className="w-3 h-3" />
            Download
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-xs text-muted-foreground hover:text-primary"
                onClick={(e) => e.stopPropagation()}
              >
                <FolderInput className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-44 bg-popover border-border">
              <FolderMenuContent file={file} folders={folders} />
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            size="sm"
            variant="ghost"
            className="flex-1 h-7 text-xs gap-1.5 text-destructive/80 hover:text-destructive hover:bg-destructive/10"
            onClick={onDelete}
          >
            <Trash2 className="w-3 h-3" />
            Delete
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
