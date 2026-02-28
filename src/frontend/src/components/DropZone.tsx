import { Progress } from "@/components/ui/progress";
import {
  CloudUpload,
  FileImage,
  FileText,
  Loader2,
  Music,
  Video,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { ExternalBlob } from "../backend";
import { useUploadFile } from "../hooks/useQueries";
import { extractExifDate, getMimeTypeCategory } from "../utils/fileUtils";

interface UploadingFile {
  id: string;
  name: string;
  progress: number;
  size: number;
}

const ACCEPTED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/heic",
  "image/heif",
  "application/pdf",
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/ogg",
  "audio/aac",
  "video/mp4",
  "video/quicktime",
  "video/x-msvideo",
  "video/webm",
  "video/x-matroska",
  "video/x-m4v",
  "video/mpeg",
  "video/ogg",
];

interface DropZoneProps {
  folderId?: string | null;
}

export function DropZone({ folderId }: DropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const { mutateAsync: uploadFile } = useUploadFile();

  const inferMimeType = useCallback((file: File): string => {
    if (file.type) return file.type;
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    const extMap: Record<string, string> = {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      webp: "image/webp",
      heic: "image/heic",
      heif: "image/heif",
      pdf: "application/pdf",
      mp3: "audio/mpeg",
      wav: "audio/wav",
      ogg: "audio/ogg",
      aac: "audio/aac",
      mp4: "video/mp4",
      mov: "video/quicktime",
      avi: "video/x-msvideo",
      webm: "video/webm",
      mkv: "video/x-matroska",
      m4v: "video/x-m4v",
      mpeg: "video/mpeg",
      mpg: "video/mpeg",
    };
    return extMap[ext] ?? "application/octet-stream";
  }, []);

  const processFile = useCallback(
    async (file: File) => {
      const fileId = crypto.randomUUID();
      const uploadEntry: UploadingFile = {
        id: fileId,
        name: file.name,
        progress: 0,
        size: file.size,
      };

      setUploadingFiles((prev) => [...prev, uploadEntry]);

      try {
        const mimeType = inferMimeType(file);
        const [arrayBuffer, exifTimestamp] = await Promise.all([
          file.arrayBuffer(),
          extractExifDate(file),
        ]);

        const uint8Array = new Uint8Array(arrayBuffer);
        const category = getMimeTypeCategory(mimeType);

        const blobWithProgress = ExternalBlob.fromBytes(
          uint8Array,
        ).withUploadProgress((percentage) => {
          setUploadingFiles((prev) =>
            prev.map((f) =>
              f.id === fileId ? { ...f, progress: percentage } : f,
            ),
          );
        });

        await uploadFile({
          fileId,
          originalFilename: file.name,
          mimeType,
          sizeBytes: BigInt(file.size),
          exifCaptureTimestamp: exifTimestamp,
          category,
          blob: blobWithProgress,
          folderId: folderId ?? null,
        });

        toast.success(`"${file.name}" uploaded successfully`);
      } catch (err) {
        toast.error(`Failed to upload "${file.name}"`);
        console.error(err);
      } finally {
        setUploadingFiles((prev) => prev.filter((f) => f.id !== fileId));
      }
    },
    [uploadFile, folderId, inferMimeType],
  );

  const ACCEPTED_EXTENSIONS = [
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".webp",
    ".heic",
    ".heif",
    ".pdf",
    ".mp3",
    ".wav",
    ".ogg",
    ".aac",
    ".mp4",
    ".mov",
    ".avi",
    ".webm",
    ".mkv",
    ".m4v",
    ".mpeg",
    ".mpg",
  ];

  const handleFiles = useCallback(
    (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      const valid = fileArray.filter((f) => {
        const ext = `.${f.name.split(".").pop()?.toLowerCase()}`;
        const ok =
          ACCEPTED_MIME_TYPES.includes(f.type) ||
          f.type.startsWith("video/") ||
          f.type.startsWith("image/") ||
          f.type.startsWith("audio/") ||
          ACCEPTED_EXTENSIONS.includes(ext);
        if (!ok) toast.error(`"${f.name}" is not a supported file type`);
        return ok;
      });
      valid.forEach(processFile);
    },
    [processFile],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        handleFiles(e.target.files);
        e.target.value = "";
      }
    },
    [handleFiles],
  );

  const isUploading = uploadingFiles.length > 0;

  return (
    <div className="space-y-3">
      <motion.div
        className={`relative border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-200 ${
          isDragOver
            ? "border-primary drop-zone-active"
            : "border-border hover:border-muted-foreground"
        }`}
        animate={isDragOver ? { scale: 1.005 } : { scale: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <label className="flex flex-col items-center justify-center gap-4 p-8 md:p-12 cursor-pointer">
          <input
            type="file"
            multiple
            accept="image/*,.heic,.heif,application/pdf,audio/*,video/*,.mp4,.mov,.avi,.webm,.mkv,.m4v"
            onChange={handleInputChange}
            className="sr-only"
          />

          <motion.div
            className={`relative flex items-center justify-center w-16 h-16 rounded-full border border-border ${
              isDragOver ? "bg-primary/10" : "bg-muted/50"
            }`}
            animate={isDragOver ? { y: -4 } : { y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <CloudUpload
              className={`w-8 h-8 transition-colors ${
                isDragOver ? "text-primary" : "text-muted-foreground"
              }`}
            />
          </motion.div>

          <div className="text-center space-y-1">
            <p
              className={`text-base font-semibold transition-colors ${
                isDragOver ? "text-primary" : "text-foreground"
              }`}
            >
              {isDragOver ? "Drop files here" : "Drag & drop files here"}
            </p>
            <p className="text-sm text-muted-foreground">
              or{" "}
              <span className="text-primary hover:underline">
                browse your device
              </span>
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap justify-center">
            <span className="flex items-center gap-1.5">
              <FileImage className="w-3.5 h-3.5" />
              Photos
            </span>
            <span className="flex items-center gap-1.5">
              <Video className="w-3.5 h-3.5" />
              Videos
            </span>
            <span className="flex items-center gap-1.5">
              <FileImage className="w-3.5 h-3.5" />
              HEIC
            </span>
            <span className="flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              PDFs
            </span>
            <span className="flex items-center gap-1.5">
              <Music className="w-3.5 h-3.5" />
              MP3
            </span>
          </div>
        </label>
      </motion.div>

      {/* Upload Progress */}
      <AnimatePresence>
        {isUploading && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2 overflow-hidden"
          >
            {uploadingFiles.map((file) => (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="flex items-center gap-3 p-3 bg-card rounded-lg border border-border"
              >
                <Loader2 className="w-4 h-4 text-primary animate-spin shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium truncate text-foreground">
                      {file.name}
                    </span>
                    <span className="text-xs text-primary ml-2 shrink-0">
                      {file.progress}%
                    </span>
                  </div>
                  <Progress value={file.progress} className="h-1" />
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
