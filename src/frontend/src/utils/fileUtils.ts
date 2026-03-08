import { toast } from "sonner";
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
  if (mimeType.startsWith("video/")) {
    return FileCategory.video;
  }
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
  blob: {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL?(): string;
  },
  filename: string,
): Promise<void> {
  // Prefer direct URL (no memory overhead, works for large files)
  if (typeof blob.getDirectURL === "function") {
    const url = blob.getDirectURL();
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return;
  }
  // Fallback: fetch bytes into memory (small files only)
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

// ---------------------------------------------------------------------------
// Minimal ZIP builder (no external deps, STORE method – no compression)
// ---------------------------------------------------------------------------
function uint16LE(n: number): number[] {
  return [n & 0xff, (n >> 8) & 0xff];
}
function uint32LE(n: number): number[] {
  return [n & 0xff, (n >> 8) & 0xff, (n >> 16) & 0xff, (n >> 24) & 0xff];
}
function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  const table = crc32Table();
  for (let i = 0; i < data.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ data[i]) & 0xff];
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function crc32Table(): number[] {
  const t: number[] = [];
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[i] = c;
  }
  return t;
}
function buildZip(entries: { path: string; data: Uint8Array }[]): Uint8Array {
  const enc = new TextEncoder();
  const localHeaders: Uint8Array[] = [];
  const centralHeaders: Uint8Array[] = [];
  let offset = 0;

  for (const entry of entries) {
    const pathBytes = enc.encode(entry.path);
    const crc = crc32(entry.data);
    const size = entry.data.length;

    // Local file header
    const lh = new Uint8Array([
      0x50,
      0x4b,
      0x03,
      0x04, // signature
      ...uint16LE(20), // version needed
      ...uint16LE(0), // flags
      ...uint16LE(0), // compression (STORE)
      ...uint16LE(0), // mod time
      ...uint16LE(0), // mod date
      ...uint32LE(crc),
      ...uint32LE(size),
      ...uint32LE(size),
      ...uint16LE(pathBytes.length),
      ...uint16LE(0), // extra field length
      ...pathBytes,
    ]);

    // Central directory header
    const ch = new Uint8Array([
      0x50,
      0x4b,
      0x01,
      0x02, // signature
      ...uint16LE(20), // version made by
      ...uint16LE(20), // version needed
      ...uint16LE(0), // flags
      ...uint16LE(0), // compression
      ...uint16LE(0), // mod time
      ...uint16LE(0), // mod date
      ...uint32LE(crc),
      ...uint32LE(size),
      ...uint32LE(size),
      ...uint16LE(pathBytes.length),
      ...uint16LE(0), // extra
      ...uint16LE(0), // comment
      ...uint16LE(0), // disk start
      ...uint16LE(0), // internal attr
      ...uint32LE(0), // external attr
      ...uint32LE(offset), // local header offset
      ...pathBytes,
    ]);

    localHeaders.push(lh);
    localHeaders.push(entry.data);
    centralHeaders.push(ch);
    offset += lh.length + size;
  }

  const centralStart = offset;
  const centralSize = centralHeaders.reduce((s, h) => s + h.length, 0);

  const eocd = new Uint8Array([
    0x50,
    0x4b,
    0x05,
    0x06, // signature
    ...uint16LE(0), // disk number
    ...uint16LE(0), // disk with central dir
    ...uint16LE(entries.length),
    ...uint16LE(entries.length),
    ...uint32LE(centralSize),
    ...uint32LE(centralStart),
    ...uint16LE(0), // comment length
  ]);

  const all = [...localHeaders, ...centralHeaders, eocd];
  const total = all.reduce((s, a) => s + a.length, 0);
  const result = new Uint8Array(total);
  let pos = 0;
  for (const chunk of all) {
    result.set(chunk, pos);
    pos += chunk.length;
  }
  return result;
}
// ---------------------------------------------------------------------------

export async function downloadAsZip(
  files: FileMetadata[],
  zipFilename: string,
  onProgress?: (done: number, total: number) => void,
): Promise<void> {
  const getFolder = (file: FileMetadata): string => {
    if (file.category === FileCategory.video || isVideoMime(file.mimeType))
      return "Videos";
    if (file.category === FileCategory.photo) return "Photos";
    if (file.category === FileCategory.heic) return "Photos";
    if (file.category === FileCategory.audio) return "Audio";
    if (file.category === FileCategory.pdf) return "PDFs";
    return "Other";
  };

  const entries: { path: string; data: Uint8Array }[] = [];
  let done = 0;
  for (const file of files) {
    const bytes = await file.blob.getBytes();
    const folder = getFolder(file);
    entries.push({ path: `${folder}/${file.originalFilename}`, data: bytes });
    done++;
    onProgress?.(done, files.length);
  }

  const zipBytes = buildZip(entries);
  const blob = new Blob([zipBytes.buffer as ArrayBuffer], {
    type: "application/zip",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = zipFilename;
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

export async function shareFile(
  blob: { getDirectURL: () => string; getBytes: () => Promise<Uint8Array> },
  filename: string,
  mimeType: string,
): Promise<void> {
  const url = blob.getDirectURL();

  // Try sharing as a File object (shows as attachment in Messages, WhatsApp, etc.)
  if (typeof navigator !== "undefined" && navigator.canShare) {
    try {
      const bytes = await blob.getBytes();
      const file = new File([bytes as Uint8Array<ArrayBuffer>], filename, {
        type: mimeType,
      });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: filename });
        return;
      }
    } catch {
      // Fall through to URL share
    }
  }

  // Try sharing just the URL (still opens the native share sheet on mobile)
  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({ title: filename, url });
      return;
    } catch {
      // Fall through to clipboard
    }
  }

  // Desktop fallback: copy URL to clipboard
  try {
    await navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard");
  } catch {
    // silent
  }
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
    case FileCategory.video:
      return "Video";
    default:
      return "File";
  }
}
