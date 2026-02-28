import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Folder,
  FolderOpen,
  FolderPlus,
  Loader2,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { FileMetadata } from "../backend.d";
import {
  useCreateFolder,
  useDeleteFolder,
  useListFolders,
  useRenameFolder,
} from "../hooks/useQueries";
import type { Folder as FolderType } from "../hooks/useQueries";

interface FolderSidebarProps {
  selectedFolderId: string | null;
  onSelectFolder: (folderId: string | null) => void;
  files: FileMetadata[];
  onNewFolderCreated?: (folderId: string) => void;
}

interface CreateFolderDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: (folderId: string) => void;
}

function CreateFolderDialog({
  open,
  onClose,
  onCreated,
}: CreateFolderDialogProps) {
  const [name, setName] = useState("");
  const { mutateAsync: createFolder, isPending } = useCreateFolder();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setName("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const handleCreate = useCallback(async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    try {
      const folderId = crypto.randomUUID();
      await createFolder({ folderId, name: trimmed });
      toast.success(`Folder "${trimmed}" created`);
      onCreated(folderId);
      onClose();
    } catch {
      toast.error("Failed to create folder");
    }
  }, [name, createFolder, onCreated, onClose]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleCreate();
    if (e.key === "Escape") onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-sm bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <FolderPlus className="w-4 h-4 text-primary" />
            New Folder
          </DialogTitle>
        </DialogHeader>
        <div className="py-2">
          <Input
            ref={inputRef}
            placeholder="Folder name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            className="bg-input border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-primary"
          />
        </div>
        <DialogFooter>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleCreate}
            disabled={!name.trim() || isPending}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isPending ? (
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            ) : null}
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface FolderRowProps {
  folder: FolderType;
  isSelected: boolean;
  fileCount: number;
  onSelect: () => void;
  onDelete: () => void;
}

function FolderRow({
  folder,
  isSelected,
  fileCount,
  onSelect,
  onDelete,
}: FolderRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(folder.name);
  const { mutateAsync: renameFolder, isPending: isRenaming } =
    useRenameFolder();
  const editRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) {
      setEditName(folder.name);
      setTimeout(() => {
        editRef.current?.focus();
        editRef.current?.select();
      }, 50);
    }
  }, [isEditing, folder.name]);

  const handleRename = useCallback(async () => {
    const trimmed = editName.trim();
    if (!trimmed || trimmed === folder.name) {
      setIsEditing(false);
      return;
    }
    try {
      await renameFolder({ folderId: folder.folderId, newName: trimmed });
      toast.success("Folder renamed");
    } catch {
      toast.error("Failed to rename folder");
    }
    setIsEditing(false);
  }, [editName, folder, renameFolder]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleRename();
    if (e.key === "Escape") {
      setEditName(folder.name);
      setIsEditing(false);
    }
  };

  const handleStartEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete();
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -8 }}
      className={`group relative flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-all duration-150 ${
        isSelected
          ? "bg-primary/15 text-primary"
          : "hover:bg-surface-hover text-muted-foreground hover:text-foreground"
      }`}
      onClick={!isEditing ? onSelect : undefined}
    >
      {isSelected ? (
        <FolderOpen className="w-4 h-4 shrink-0 text-primary" />
      ) : (
        <Folder className="w-4 h-4 shrink-0" />
      )}

      {isEditing ? (
        <div className="flex-1 flex items-center gap-1">
          <input
            ref={editRef}
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleRename}
            onClick={(e) => e.stopPropagation()}
            className="flex-1 text-sm bg-input border border-border rounded px-1.5 py-0.5 text-foreground focus:outline-none focus:border-primary min-w-0"
          />
          {isRenaming ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground shrink-0" />
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleRename();
              }}
              className="p-0.5 rounded hover:bg-primary/20 text-primary"
            >
              <Check className="w-3 h-3" />
            </button>
          )}
        </div>
      ) : (
        <>
          <span className="flex-1 text-sm truncate">{folder.name}</span>
          <div className="flex items-center gap-1">
            {fileCount > 0 && (
              <Badge
                variant="secondary"
                className={`text-[10px] h-4 px-1.5 py-0 ${
                  isSelected
                    ? "bg-primary/20 text-primary border-primary/20"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {fileCount}
              </Badge>
            )}
            <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={handleStartEdit}
                    className="p-0.5 rounded hover:bg-surface-hover text-muted-foreground hover:text-foreground"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Rename</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={handleDeleteClick}
                    className="p-0.5 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Delete folder</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
}

export function FolderSidebar({
  selectedFolderId,
  onSelectFolder,
  files,
  onNewFolderCreated,
}: FolderSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<FolderType | null>(null);
  const { data: folders = [], isLoading: foldersLoading } = useListFolders();
  const { mutateAsync: deleteFolder, isPending: isDeletingFolder } =
    useDeleteFolder();

  const getFolderFileCount = (folderId: string) =>
    files.filter((f) => f.folderId === folderId).length;

  const handleDeleteFolder = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      await deleteFolder(deleteTarget.folderId);
      toast.success(`Folder "${deleteTarget.name}" deleted`);
      if (selectedFolderId === deleteTarget.folderId) {
        onSelectFolder(null);
      }
    } catch {
      toast.error("Failed to delete folder");
    }
    setDeleteTarget(null);
  }, [deleteTarget, deleteFolder, selectedFolderId, onSelectFolder]);

  const handleNewFolder = useCallback(
    (folderId: string) => {
      onNewFolderCreated?.(folderId);
      onSelectFolder(folderId);
    },
    [onNewFolderCreated, onSelectFolder],
  );

  return (
    <>
      {/* Desktop sidebar */}
      <motion.aside
        animate={{ width: isCollapsed ? 40 : 220 }}
        transition={{ type: "spring", stiffness: 400, damping: 40 }}
        className="hidden md:flex flex-col shrink-0 border-r border-border bg-sidebar overflow-hidden"
        style={{ minHeight: 0 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-3 border-b border-border">
          {!isCollapsed && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-xs font-semibold text-muted-foreground uppercase tracking-widest"
            >
              Folders
            </motion.span>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => setIsCollapsed((c) => !c)}
                className="ml-auto p-1 rounded hover:bg-surface-hover text-muted-foreground hover:text-foreground transition-colors"
              >
                {isCollapsed ? (
                  <ChevronRight className="w-4 h-4" />
                ) : (
                  <ChevronLeft className="w-4 h-4" />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">
              {isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            </TooltipContent>
          </Tooltip>
        </div>

        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col flex-1 overflow-hidden"
          >
            <ScrollArea className="flex-1 px-2 py-2">
              {/* All Files entry */}
              <button
                type="button"
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-all duration-150 text-left ${
                  selectedFolderId === null
                    ? "bg-primary/15 text-primary"
                    : "hover:bg-surface-hover text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => onSelectFolder(null)}
              >
                {selectedFolderId === null ? (
                  <FolderOpen className="w-4 h-4 shrink-0 text-primary" />
                ) : (
                  <Folder className="w-4 h-4 shrink-0" />
                )}
                <span className="flex-1 text-sm">All Files</span>
                <Badge
                  variant="secondary"
                  className={`text-[10px] h-4 px-1.5 py-0 ${
                    selectedFolderId === null
                      ? "bg-primary/20 text-primary border-primary/20"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {files.length}
                </Badge>
              </button>

              {/* Folder list */}
              {foldersLoading ? (
                <div className="py-4 flex justify-center">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <AnimatePresence>
                  {folders.map((folder) => (
                    <FolderRow
                      key={folder.folderId}
                      folder={folder}
                      isSelected={selectedFolderId === folder.folderId}
                      fileCount={getFolderFileCount(folder.folderId)}
                      onSelect={() => onSelectFolder(folder.folderId)}
                      onDelete={() => setDeleteTarget(folder)}
                    />
                  ))}
                </AnimatePresence>
              )}

              {folders.length === 0 && !foldersLoading && (
                <p className="text-xs text-muted-foreground text-center py-4 px-2">
                  No folders yet
                </p>
              )}
            </ScrollArea>

            {/* New folder button */}
            <div className="p-2 border-t border-border">
              <Button
                variant="ghost"
                size="sm"
                className="w-full h-8 text-xs gap-2 text-muted-foreground hover:text-foreground justify-start"
                onClick={() => setIsCreateOpen(true)}
              >
                <FolderPlus className="w-3.5 h-3.5" />
                New Folder
              </Button>
            </div>
          </motion.div>
        )}

        {isCollapsed && (
          <div className="flex flex-col items-center gap-2 py-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => onSelectFolder(null)}
                  className={`p-1.5 rounded transition-colors ${
                    selectedFolderId === null
                      ? "bg-primary/15 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-surface-hover"
                  }`}
                >
                  <Folder className="w-4 h-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">All Files</TooltipContent>
            </Tooltip>
            {folders.map((folder) => (
              <Tooltip key={folder.folderId}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => onSelectFolder(folder.folderId)}
                    className={`p-1.5 rounded transition-colors ${
                      selectedFolderId === folder.folderId
                        ? "bg-primary/15 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-surface-hover"
                    }`}
                  >
                    <Folder className="w-4 h-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">{folder.name}</TooltipContent>
              </Tooltip>
            ))}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => {
                    setIsCollapsed(false);
                    setIsCreateOpen(true);
                  }}
                  className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-surface-hover transition-colors"
                >
                  <FolderPlus className="w-4 h-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">New Folder</TooltipContent>
            </Tooltip>
          </div>
        )}
      </motion.aside>

      {/* Mobile: horizontal scroll chips */}
      <div className="flex md:hidden items-center gap-2 pt-4 overflow-x-auto pb-1 scrollbar-none px-4">
        <button
          type="button"
          onClick={() => onSelectFolder(null)}
          className={`flex items-center gap-1.5 whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium transition-all shrink-0 border ${
            selectedFolderId === null
              ? "bg-primary/15 text-primary border-primary/30"
              : "bg-muted text-muted-foreground border-border hover:text-foreground"
          }`}
        >
          <Folder className="w-3 h-3" />
          All Files
          <span className="opacity-60">{files.length}</span>
        </button>

        {folders.map((folder) => (
          <button
            key={folder.folderId}
            type="button"
            onClick={() => onSelectFolder(folder.folderId)}
            className={`flex items-center gap-1.5 whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium transition-all shrink-0 border ${
              selectedFolderId === folder.folderId
                ? "bg-primary/15 text-primary border-primary/30"
                : "bg-muted text-muted-foreground border-border hover:text-foreground"
            }`}
          >
            <Folder className="w-3 h-3" />
            {folder.name}
            {getFolderFileCount(folder.folderId) > 0 && (
              <span className="opacity-60">
                {getFolderFileCount(folder.folderId)}
              </span>
            )}
          </button>
        ))}

        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-1.5 whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium transition-all shrink-0 border border-dashed border-border text-muted-foreground hover:text-foreground hover:border-primary/50"
        >
          <FolderPlus className="w-3 h-3" />
          New
        </button>
      </div>

      {/* Create Folder Dialog */}
      <CreateFolderDialog
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={handleNewFolder}
      />

      {/* Delete Folder Confirm Dialog */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <DialogContent className="sm:max-w-sm bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-destructive" />
              Delete Folder
            </DialogTitle>
          </DialogHeader>
          <div className="py-2 text-sm text-muted-foreground">
            {deleteTarget && getFolderFileCount(deleteTarget.folderId) > 0 ? (
              <p>
                Delete{" "}
                <strong className="text-foreground">{deleteTarget.name}</strong>
                ? The{" "}
                <strong className="text-foreground">
                  {getFolderFileCount(deleteTarget.folderId)} file
                  {getFolderFileCount(deleteTarget.folderId) !== 1 ? "s" : ""}
                </strong>{" "}
                inside will not be deleted — they&apos;ll just be moved out of
                the folder.
              </p>
            ) : (
              <p>
                Delete folder{" "}
                <strong className="text-foreground">
                  {deleteTarget?.name}
                </strong>
                ?
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDeleteTarget(null)}
              disabled={isDeletingFolder}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleDeleteFolder}
              disabled={isDeletingFolder}
            >
              {isDeletingFolder ? (
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              ) : (
                <X className="w-3.5 h-3.5 mr-1.5" />
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
