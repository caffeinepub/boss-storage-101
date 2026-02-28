import type { FileMetadata } from "../backend.d";
import { FileCategory } from "../backend.d";

export function isVideoMime(mimeType: string): boolean {
  return mimeType.startsWith("video/");
}

export function getMimeTypeCategory(mimeType: string): FileCategory {
  if (mimeType === "image/heic" || mimeType === "image/heif") {
    return FileCategory.heic;
  }
  if (mimeType.startsWith("image/")) {
    return FileCategory.photo;
  }
  if (mimeType === "application/pdf") {
    return FileCategory.pdf;
  }
  if (mimeType.startsWith("audio/")) {
    return FileCategory.audio;
  }
  // video/* and everything else stored as "other"
  return FileCategory.other;
}

export function formatFileSize(bytes: bigint | number): string {
  const n = typeof bytes === "bigint" ? Number(bytes) : bytes;
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

export function timestampToDate(timestamp: bigint): Date {
  // timestamp is in nanoseconds
  return new Date(Number(timestamp / 1_000_000n));
}

export function formatDateTime(date: Date): string {
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDateShort(date: Date): string {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export async function downloadFile(
  blob: { getBytes(): Promise<Uint8Array<ArrayBuffer>> },
  filename: string,
): Promise<void> {
  const bytes = await blob.getBytes();
  const blobObj = new Blob([bytes]);
  const url = URL.createObjectURL(blobObj);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function extractExifDate(file: File): Promise<bigint | null> {
  try {
    // Only try to extract EXIF from JPEG images
    if (
      !file.type.startsWith("image/jpeg") &&
      !file.type.startsWith("image/jpg")
    )
      return null;
    // Read the first 64KB to look for EXIF DateTimeOriginal
    const buffer = await file.slice(0, 65536).arrayBuffer();
    const bytes = new Uint8Array(buffer);
    // Look for ASCII "DateTimeOriginal" pattern in EXIF data (simplified approach)
    const marker = "DateTimeOriginal";
    const markerBytes = Array.from(marker).map((c) => c.charCodeAt(0));
    for (let i = 0; i < bytes.length - markerBytes.length - 20; i++) {
      let match = true;
      for (let j = 0; j < markerBytes.length; j++) {
        if (bytes[i + j] !== markerBytes[j]) {
          match = false;
          break;
        }
      }
      if (match) {
        // After "DateTimeOriginal\0\0", find the ASCII date string "YYYY:MM:DD HH:MM:SS"
        let offset = i + markerBytes.length + 6;
        while (offset < bytes.length - 20 && bytes[offset] === 0) offset++;
        const dateStr = String.fromCharCode(
          ...Array.from(bytes.slice(offset, offset + 19)),
        );
        if (/^\d{4}:\d{2}:\d{2} \d{2}:\d{2}:\d{2}$/.test(dateStr)) {
          const iso = dateStr.replace(/^(\d{4}):(\d{2}):(\d{2})/, "$1-$2-$3");
          const d = new Date(iso);
          if (!Number.isNaN(d.getTime())) {
            return BigInt(d.getTime()) * 1_000_000n;
          }
        }
      }
    }
    return null;
  } catch {
    return null;
  }
}

export function findDuplicates(files: FileMetadata[]): FileMetadata[][] {
  const groups = new Map<string, FileMetadata[]>();
  for (const file of files) {
    const key = `${file.originalFilename}__${file.sizeBytes}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(file);
  }
  return Array.from(groups.values()).filter((g) => g.length > 1);
}

export function getFileExtension(filename: string): string {
  const parts = filename.split(".");
  return parts.length > 1 ? parts[parts.length - 1].toUpperCase() : "";
}

export function getCategoryLabel(category: FileCategory): string {
  switch (category) {
    case FileCategory.photo:
      return "Photo";
    case FileCategory.pdf:
      return "PDF";
    case FileCategory.audio:
      return "MP3";
    case FileCategory.heic:
      return "HEIC";
    default:
      return "File";
  }
}
