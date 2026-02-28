import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Film, ImageIcon, Info, Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { FileMetadata } from "../backend.d";
import {
  formatDateShort,
  formatFileSize,
  isVideoMime,
  timestampToDate,
} from "../utils/fileUtils";

interface DuplicatesDialogProps {
  open: boolean;
  onClose: () => void;
  duplicateGroups: FileMetadata[][];
  onDeleteAndDownload: (idsToDelete: string[]) => void;
  onSkipAndDownload: () => void;
  isDeleting: boolean;
  downloadMode?: boolean;
}

function getNewestFile(group: FileMetadata[]): FileMetadata {
  return group.reduce((a, b) =>
    a.uploadTimestamp > b.uploadTimestamp ? a : b,
  );
}

export function DuplicatesDialog({
  open,
  onClose,
  duplicateGroups,
  onDeleteAndDownload,
  onSkipAndDownload,
  isDeleting,
  downloadMode = true,
}: DuplicatesDialogProps) {
  // Pre-select all except the newest in each group
  const buildInitialSelected = useCallback(() => {
    const ids = new Set<string>();
    for (const group of duplicateGroups) {
      const newest = getNewestFile(group);
      for (const file of group) {
        if (file.fileId !== newest.fileId) {
          ids.add(file.fileId);
        }
      }
    }
    return ids;
  }, [duplicateGroups]);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Reset selection whenever dialog opens or groups change
  useEffect(() => {
    if (open) {
      setSelectedIds(buildInitialSelected());
    }
  }, [open, buildInitialSelected]);

  const toggleId = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const totalDuplicateCount = duplicateGroups.reduce(
    (sum, g) => sum + g.length - 1,
    0,
  );

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col gap-0 p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <DialogTitle className="text-lg font-semibold flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/15 text-amber-500 text-xs font-bold">
              {duplicateGroups.length}
            </span>
            Duplicate Files Found
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {duplicateGroups.length} duplicate group
            {duplicateGroups.length !== 1 ? "s" : ""} detected (
            {totalDuplicateCount} extra file
            {totalDuplicateCount !== 1 ? "s" : ""}). Select which copies to
            delete.
          </DialogDescription>
        </DialogHeader>

        {/* Info note */}
        <div className="mx-6 mt-4 mb-2 flex items-start gap-2 px-3 py-2.5 rounded-md bg-muted/50 border border-border text-xs text-muted-foreground">
          <Info className="w-3.5 h-3.5 mt-0.5 shrink-0 text-primary/60" />
          <span>Duplicates are matched by filename and file size.</span>
        </div>

        {/* Duplicate groups list */}
        <ScrollArea className="flex-1 min-h-0 px-6 py-2">
          <div className="space-y-4 pb-2">
            {duplicateGroups.map((group) => {
              const newest = getNewestFile(group);
              const isVideo = isVideoMime(group[0].mimeType);
              const Icon = isVideo ? Film : ImageIcon;
              const groupKey = group.map((f) => f.fileId).join("-");

              // Sort: newest first
              const sorted = [...group].sort((a, b) =>
                Number(b.uploadTimestamp - a.uploadTimestamp),
              );

              return (
                <div
                  key={groupKey}
                  className="rounded-lg border border-border bg-card overflow-hidden"
                >
                  <div className="flex items-center gap-2 px-3 py-2 bg-muted/30 border-b border-border">
                    <Icon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span className="text-xs font-medium text-foreground truncate">
                      {group[0].originalFilename}
                    </span>
                  </div>
                  <div className="divide-y divide-border">
                    {sorted.map((file) => {
                      const isNewest = file.fileId === newest.fileId;
                      const uploadDate = timestampToDate(file.uploadTimestamp);

                      return (
                        <div
                          key={file.fileId}
                          className={`flex items-center gap-3 px-3 py-2.5 transition-colors ${
                            isNewest
                              ? "opacity-60 cursor-default"
                              : selectedIds.has(file.fileId)
                                ? "bg-destructive/5"
                                : "hover:bg-muted/30"
                          }`}
                        >
                          {isNewest ? (
                            <div className="w-4 h-4 shrink-0" />
                          ) : (
                            <Checkbox
                              id={`dup-${file.fileId}`}
                              checked={selectedIds.has(file.fileId)}
                              onCheckedChange={() => toggleId(file.fileId)}
                              className="shrink-0"
                              aria-label={`Select ${file.originalFilename} for deletion`}
                            />
                          )}

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs text-muted-foreground">
                                {formatFileSize(file.sizeBytes)}
                              </span>
                              <span className="text-xs text-muted-foreground/50">
                                ·
                              </span>
                              <span className="text-xs text-muted-foreground">
                                Uploaded {formatDateShort(uploadDate)}
                              </span>
                            </div>
                          </div>

                          {isNewest && (
                            <Badge
                              variant="outline"
                              className="text-[10px] px-1.5 py-0 h-5 border-emerald-500/30 text-emerald-600 bg-emerald-500/10 shrink-0"
                            >
                              Keep (newest)
                            </Badge>
                          )}

                          {!isNewest && selectedIds.has(file.fileId) && (
                            <Badge
                              variant="outline"
                              className="text-[10px] px-1.5 py-0 h-5 border-destructive/30 text-destructive bg-destructive/10 shrink-0"
                            >
                              Delete
                            </Badge>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        <DialogFooter className="px-6 py-4 border-t border-border bg-muted/20 flex-col sm:flex-row gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={isDeleting}
            className="sm:mr-auto order-last sm:order-first"
          >
            Cancel
          </Button>

          {downloadMode && (
            <Button
              variant="outline"
              size="sm"
              onClick={onSkipAndDownload}
              disabled={isDeleting}
            >
              Download Anyway
            </Button>
          )}

          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDeleteAndDownload(Array.from(selectedIds))}
            disabled={selectedIds.size === 0 || isDeleting}
            className="gap-1.5"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Deleting…
              </>
            ) : downloadMode ? (
              <>Delete Selected &amp; Download ({selectedIds.size})</>
            ) : (
              <>Delete Selected ({selectedIds.size})</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
