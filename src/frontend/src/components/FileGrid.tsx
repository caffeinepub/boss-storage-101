import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BookImage,
  CheckSquare,
  CloudUpload,
  Download,
  ImagePlay,
  ScanSearch,
  Square,
  Trash2,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import type { FileMetadata } from "../backend.d";
import { FileCategory } from "../backend.d";
import type { Folder } from "../hooks/useQueries";
import { useDeleteFile, useDeleteFiles } from "../hooks/useQueries";
import { downloadFile, findDuplicates, isVideoMime } from "../utils/fileUtils";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import { DuplicatesDialog } from "./DuplicatesDialog";
import { FileCard } from "./FileCard";
import { PhotoLightbox } from "./PhotoLightbox";
import { VideoLightbox } from "./VideoLightbox";

type FilterTab = "all" | "photos" | "videos" | "pdfs" | "audio" | "heic";

interface FileGridProps {
  files: FileMetadata[];
  isLoading: boolean;
  folders?: Folder[];
  selectedFolderName?: string;
  onOpenAlbum?: () => void;
}

export function FileGrid({
  files,
  isLoading,
  folders = [],
  selectedFolderName,
  onOpenAlbum,
}: FileGridProps) {
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [videoLightboxFile, setVideoLightboxFile] =
    useState<FileMetadata | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    ids: string[];
    filename?: string;
  } | null>(null);

  const [duplicateGroups, setDuplicateGroups] = useState<FileMetadata[][]>([]);
  const [duplicatesOpen, setDuplicatesOpen] = useState(false);
  const [pendingDownload, setPendingDownload] = useState<
    (() => Promise<void>) | null
  >(null);
  const [isDeletingDuplicates, setIsDeletingDuplicates] = useState(false);

  const { mutateAsync: deleteFile, isPending: isDeletingSingle } =
    useDeleteFile();
  const { mutateAsync: deleteFiles, isPending: isDeletingMultiple } =
    useDeleteFiles();

  const filteredFiles = files.filter((f) => {
    switch (activeTab) {
      case "photos":
        return f.category === FileCategory.photo;
      case "videos":
        return f.category === FileCategory.video || isVideoMime(f.mimeType);
      case "pdfs":
        return f.category === FileCategory.pdf;
      case "audio":
        return f.category === FileCategory.audio;
      case "heic":
        return f.category === FileCategory.heic;
      default:
        return true;
    }
  });

  const photoFiles = files.filter((f) => f.category === FileCategory.photo);

  const handleSelect = useCallback((fileId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(fileId)) {
        next.delete(fileId);
      } else {
        next.add(fileId);
      }
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedIds(new Set(filteredFiles.map((f) => f.fileId)));
  }, [filteredFiles]);

  const handleDeselectAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const handleDeleteSingle = useCallback(
    (fileId: string) => {
      const file = files.find((f) => f.fileId === fileId);
      setDeleteTarget({ ids: [fileId], filename: file?.originalFilename });
    },
    [files],
  );

  const handleDeleteSelected = useCallback(() => {
    if (selectedIds.size === 0) return;
    setDeleteTarget({ ids: Array.from(selectedIds) });
  }, [selectedIds]);

  const confirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.ids.length === 1) {
        await deleteFile(deleteTarget.ids[0]);
        toast.success("File deleted");
      } else {
        await deleteFiles(deleteTarget.ids);
        toast.success(`${deleteTarget.ids.length} files deleted`);
      }
      setSelectedIds((prev) => {
        const next = new Set(prev);
        for (const id of deleteTarget.ids) {
          next.delete(id);
        }
        return next;
      });
    } catch {
      toast.error("Failed to delete file(s)");
    } finally {
      setDeleteTarget(null);
    }
  }, [deleteTarget, deleteFile, deleteFiles]);

  const handleOpenLightbox = useCallback(
    (file: FileMetadata) => {
      const idx = photoFiles.findIndex((f) => f.fileId === file.fileId);
      if (idx !== -1) setLightboxIndex(idx);
    },
    [photoFiles],
  );

  const checkDuplicatesBeforeDownload = useCallback(
    (filesToCheck: FileMetadata[], downloadFn: () => Promise<void>) => {
      const dupes = findDuplicates(
        filesToCheck.filter(
          (f) =>
            f.category === FileCategory.photo ||
            f.category === FileCategory.video ||
            isVideoMime(f.mimeType),
        ),
      );
      if (dupes.length > 0) {
        setDuplicateGroups(dupes);
        setPendingDownload(() => downloadFn);
        setDuplicatesOpen(true);
      } else {
        void downloadFn();
      }
    },
    [],
  );

  const handleDownloadAll = useCallback(() => {
    if (filteredFiles.length === 0) return;
    const actualDownload = async () => {
      toast.info(`Downloading ${filteredFiles.length} file(s)...`);
      for (const file of filteredFiles) {
        try {
          await downloadFile(file.blob, file.originalFilename);
          await new Promise((res) => setTimeout(res, 200));
        } catch {
          toast.error(`Failed to download "${file.originalFilename}"`);
        }
      }
    };
    checkDuplicatesBeforeDownload(filteredFiles, actualDownload);
  }, [filteredFiles, checkDuplicatesBeforeDownload]);

  const handleDownloadMediaFiles = useCallback(() => {
    const mediaFiles = files.filter(
      (f) =>
        f.category === FileCategory.photo ||
        f.category === FileCategory.video ||
        isVideoMime(f.mimeType),
    );
    if (mediaFiles.length === 0) return;
    const actualDownload = async () => {
      toast.info(`Downloading ${mediaFiles.length} photos & videos...`);
      for (const file of mediaFiles) {
        try {
          await downloadFile(file.blob, file.originalFilename);
          await new Promise((res) => setTimeout(res, 200));
        } catch {
          toast.error(`Failed to download "${file.originalFilename}"`);
        }
      }
    };
    checkDuplicatesBeforeDownload(mediaFiles, actualDownload);
  }, [files, checkDuplicatesBeforeDownload]);

  const handleFindDuplicates = useCallback(() => {
    const mediaFiles = files.filter(
      (f) =>
        f.category === FileCategory.photo ||
        f.category === FileCategory.video ||
        isVideoMime(f.mimeType),
    );
    const dupes = findDuplicates(mediaFiles);
    if (dupes.length === 0) {
      toast.success("No duplicate photos or videos found");
    } else {
      setDuplicateGroups(dupes);
      setPendingDownload(null);
      setDuplicatesOpen(true);
    }
  }, [files]);

  const tabCounts = {
    all: files.length,
    photos: files.filter((f) => f.category === FileCategory.photo).length,
    videos: files.filter(
      (f) => f.category === FileCategory.video || isVideoMime(f.mimeType),
    ).length,
    pdfs: files.filter((f) => f.category === FileCategory.pdf).length,
    audio: files.filter((f) => f.category === FileCategory.audio).length,
    heic: files.filter((f) => f.category === FileCategory.heic).length,
  };

  const mediaFilesCount = files.filter(
    (f) =>
      f.category === FileCategory.photo ||
      f.category === FileCategory.video ||
      isVideoMime(f.mimeType),
  ).length;

  const selectedInView = filteredFiles.filter((f) =>
    selectedIds.has(f.fileId),
  ).length;
  const allSelectedInView =
    filteredFiles.length > 0 && selectedInView === filteredFiles.length;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-9 w-20 rounded-md" />
          ))}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Skeleton key={i} className="aspect-square rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Tabs and toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as FilterTab)}
        >
          <TabsList className="bg-card border border-border h-9">
            <TabsTrigger
              value="all"
              className="text-xs h-7 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              All{" "}
              {tabCounts.all > 0 && (
                <span className="ml-1 opacity-60">{tabCounts.all}</span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="photos"
              className="text-xs h-7 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Photos{" "}
              {tabCounts.photos > 0 && (
                <span className="ml-1 opacity-60">{tabCounts.photos}</span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="pdfs"
              className="text-xs h-7 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              PDFs{" "}
              {tabCounts.pdfs > 0 && (
                <span className="ml-1 opacity-60">{tabCounts.pdfs}</span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="audio"
              className="text-xs h-7 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              MP3s{" "}
              {tabCounts.audio > 0 && (
                <span className="ml-1 opacity-60">{tabCounts.audio}</span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="videos"
              className="text-xs h-7 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Videos{" "}
              {tabCounts.videos > 0 && (
                <span className="ml-1 opacity-60">{tabCounts.videos}</span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="heic"
              className="text-xs h-7 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              HEIC{" "}
              {tabCounts.heic > 0 && (
                <span className="ml-1 opacity-60">{tabCounts.heic}</span>
              )}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2 flex-wrap">
          {tabCounts.photos > 0 && onOpenAlbum && (
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs gap-1.5 text-primary border-primary/30 hover:bg-primary/10 hover:border-primary/60"
              onClick={onOpenAlbum}
            >
              <BookImage className="w-3.5 h-3.5" />
              Album
            </Button>
          )}

          {files.length > 0 && (
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs gap-1.5 text-muted-foreground border-border hover:bg-muted/50 hover:text-foreground"
              onClick={handleFindDuplicates}
            >
              <ScanSearch className="w-3.5 h-3.5" />
              Find Duplicates
            </Button>
          )}

          {mediaFilesCount > 0 && (
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs gap-1.5 text-primary border-primary/30 hover:bg-primary/10 hover:border-primary/60"
              onClick={handleDownloadMediaFiles}
            >
              <ImagePlay className="w-3.5 h-3.5" />
              Download Videos &amp; Photos ({mediaFilesCount})
            </Button>
          )}

          {filteredFiles.length > 0 && (
            <>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
                onClick={
                  allSelectedInView ? handleDeselectAll : handleSelectAll
                }
              >
                {allSelectedInView ? (
                  <CheckSquare className="w-3.5 h-3.5 text-primary" />
                ) : (
                  <Square className="w-3.5 h-3.5" />
                )}
                {allSelectedInView ? "Deselect All" : "Select All"}
              </Button>

              <Button
                size="sm"
                variant="ghost"
                className="h-8 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
                onClick={handleDownloadAll}
              >
                <Download className="w-3.5 h-3.5" />
                Download All
              </Button>
            </>
          )}

          <AnimatePresence>
            {selectedIds.size > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <Button
                  size="sm"
                  variant="destructive"
                  className="h-8 text-xs gap-1.5"
                  onClick={handleDeleteSelected}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete Selected ({selectedIds.size})
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Selection status */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex items-center justify-between px-3 py-2 bg-primary/10 border border-primary/20 rounded-lg text-sm">
              <span className="text-primary font-medium">
                {selectedIds.size} file{selectedIds.size !== 1 ? "s" : ""}{" "}
                selected
              </span>
              <button
                type="button"
                onClick={handleDeselectAll}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Clear selection
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty state */}
      {filteredFiles.length === 0 && !isLoading && (
        <EmptyState
          activeTab={activeTab}
          hasFiles={files.length > 0}
          selectedFolderName={selectedFolderName}
        />
      )}

      {/* File grid */}
      {filteredFiles.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {filteredFiles.map((file, index) => (
            <FileCard
              key={file.fileId}
              file={file}
              isSelected={selectedIds.has(file.fileId)}
              onSelect={handleSelect}
              onDelete={handleDeleteSingle}
              onOpenLightbox={handleOpenLightbox}
              onOpenVideoPlayer={(f) => setVideoLightboxFile(f)}
              index={index}
              folders={folders}
              currentFolderName={selectedFolderName}
            />
          ))}
        </div>
      )}

      {/* Photo Lightbox */}
      {lightboxIndex !== null && (
        <PhotoLightbox
          files={files}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      )}

      {/* Video Lightbox */}
      {videoLightboxFile && (
        <VideoLightbox
          file={videoLightboxFile}
          onClose={() => setVideoLightboxFile(null)}
        />
      )}

      {/* Delete dialog */}
      <DeleteConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        count={deleteTarget?.ids.length ?? 0}
        filename={deleteTarget?.filename}
        isLoading={isDeletingSingle || isDeletingMultiple}
      />

      {/* Duplicates dialog */}
      <DuplicatesDialog
        open={duplicatesOpen}
        onClose={() => {
          setDuplicatesOpen(false);
          setPendingDownload(null);
        }}
        duplicateGroups={duplicateGroups}
        downloadMode={pendingDownload !== null}
        onDeleteAndDownload={async (ids) => {
          setIsDeletingDuplicates(true);
          try {
            await deleteFiles(ids);
            toast.success(`${ids.length} duplicate(s) deleted`);
            setDuplicatesOpen(false);
            await pendingDownload?.();
          } catch {
            toast.error("Failed to delete duplicates");
          } finally {
            setIsDeletingDuplicates(false);
            setPendingDownload(null);
          }
        }}
        onSkipAndDownload={async () => {
          setDuplicatesOpen(false);
          await pendingDownload?.();
          setPendingDownload(null);
        }}
        isDeleting={isDeletingDuplicates}
      />
    </div>
  );
}

function EmptyState({
  activeTab,
  hasFiles,
  selectedFolderName,
}: {
  activeTab: FilterTab;
  hasFiles: boolean;
  selectedFolderName?: string;
}) {
  const folderPrefix = selectedFolderName ? `"${selectedFolderName}"` : null;

  const messages: Record<FilterTab, { title: string; sub: string }> = {
    all: {
      title: folderPrefix ? `${folderPrefix} is empty` : "Your vault is empty",
      sub: folderPrefix
        ? "Upload files or move files into this folder"
        : "Drag and drop files above to get started",
    },
    photos: {
      title: "No photos yet",
      sub: hasFiles
        ? "Upload photos to see them here"
        : "Drag and drop photos to get started",
    },
    videos: {
      title: "No videos yet",
      sub: hasFiles
        ? "Upload videos to see them here"
        : "Drag and drop MP4, MOV, AVI, or WebM files to get started",
    },
    pdfs: {
      title: "No PDFs yet",
      sub: hasFiles
        ? "Upload PDFs to see them here"
        : "Drag and drop PDFs to get started",
    },
    audio: {
      title: "No audio files yet",
      sub: hasFiles
        ? "Upload MP3s to see them here"
        : "Drag and drop MP3 files to get started",
    },
    heic: {
      title: "No HEIC files yet",
      sub: hasFiles
        ? "Upload HEIC images to see them here"
        : "Upload HEIC images to get started",
    },
  };

  const msg = messages[activeTab];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 text-center"
    >
      <div className="w-16 h-16 rounded-2xl bg-muted/50 border border-border flex items-center justify-center mb-4">
        <CloudUpload className="w-7 h-7 text-muted-foreground" />
      </div>
      <h3 className="text-base font-semibold text-foreground mb-1">
        {msg.title}
      </h3>
      <p className="text-sm text-muted-foreground max-w-xs">{msg.sub}</p>
    </motion.div>
  );
}
