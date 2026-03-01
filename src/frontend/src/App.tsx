import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useQueryClient } from "@tanstack/react-query";
import { Download, HardDrive, Loader2, LogOut } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { FileCategory } from "./backend.d";
import { DropZone } from "./components/DropZone";
import { FileGrid } from "./components/FileGrid";
import { FolderSidebar } from "./components/FolderSidebar";
import { LoginScreen } from "./components/LoginScreen";
import { MusicPlayer } from "./components/MusicPlayer";
import { PhotoAlbum } from "./components/PhotoAlbum";
import { useActor } from "./hooks/useActor";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { useListFiles, useListFolders } from "./hooks/useQueries";
import { downloadFile, formatFileSize } from "./utils/fileUtils";

function StorageStats({
  files,
}: { files: import("./backend.d").FileMetadata[] }) {
  const totalBytes = files.reduce((sum, f) => sum + Number(f.sizeBytes), 0);
  return (
    <div className="flex items-center gap-4 text-xs text-muted-foreground">
      <span className="flex items-center gap-1.5">
        <HardDrive className="w-3.5 h-3.5" />
        {files.length} file{files.length !== 1 ? "s" : ""}
      </span>
      <span>·</span>
      <span>{formatFileSize(totalBytes)} used</span>
    </div>
  );
}

/** Inner content — only rendered when authenticated; all hooks are unconditional here */
function AppContent() {
  const { clear } = useInternetIdentity();
  const { actor, isFetching } = useActor();
  const queryClient = useQueryClient();
  const claimedRef = useRef(false);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [albumMode, setAlbumMode] = useState(false);

  // Recover legacy files (uploaded before passkey was added) once per session
  useEffect(() => {
    if (!actor || isFetching || claimedRef.current) return;
    claimedRef.current = true;

    actor
      .claimLegacyData()
      .then((count) => {
        const n = Number(count);
        if (n > 0) {
          toast.success(
            `Recovered ${n} file${n !== 1 ? "s" : ""} from before your passkey was set up.`,
            { duration: 6000 },
          );
          // Refresh file and folder lists so recovered files appear immediately
          queryClient.invalidateQueries({ queryKey: ["files"] });
          queryClient.invalidateQueries({ queryKey: ["folders"] });
        }
      })
      .catch(() => {
        // Silently ignore — legacy claim is best-effort
      });
  }, [actor, isFetching, queryClient]);

  // All files (for stats + sidebar counts)
  const { data: allFiles = [] } = useListFiles(null);
  // Filtered files by folder
  const { data: files = [], isLoading } = useListFiles(selectedFolderId);
  const { data: folders = [] } = useListFolders();

  const audioFiles = allFiles.filter((f) => f.category === FileCategory.audio);
  const photoFiles = allFiles.filter((f) => f.category === FileCategory.photo);

  const selectedFolder = selectedFolderId
    ? folders.find((f) => f.folderId === selectedFolderId)
    : null;

  const handleDownloadAll = async () => {
    if (files.length === 0) return;
    toast.info(`Downloading ${files.length} file(s)...`);
    for (const file of files) {
      try {
        await downloadFile(file.blob, file.originalFilename);
        await new Promise((res) => setTimeout(res, 250));
      } catch {
        toast.error(`Failed to download "${file.originalFilename}"`);
      }
    }
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <header className="boss-header-bg border-b border-border sticky top-0 z-40 backdrop-blur-sm">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Logo + Name */}
              <motion.div
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3"
              >
                <div className="w-9 h-9 rounded-lg overflow-hidden border border-primary/20 shrink-0 bg-card">
                  <img
                    src="/assets/generated/boss-logo-transparent.dim_128x128.png"
                    alt="BOSS Storage 101"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h1 className="text-base font-bold text-foreground tracking-tight leading-none">
                    BOSS <span className="text-primary">Storage</span>
                  </h1>
                  <p className="text-[10px] text-muted-foreground tracking-widest uppercase leading-none mt-0.5">
                    101
                  </p>
                </div>
              </motion.div>

              {/* Right side */}
              <motion.div
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3"
              >
                {allFiles.length > 0 && (
                  <div className="hidden sm:block">
                    <StorageStats files={allFiles} />
                  </div>
                )}
                {files.length > 0 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
                    onClick={handleDownloadAll}
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Download All</span>
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
                  onClick={clear}
                  title="Sign out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sign out</span>
                </Button>
              </motion.div>
            </div>
          </div>
        </header>

        {/* Body: sidebar + content */}
        <div className="flex flex-1 max-w-[1600px] mx-auto w-full overflow-hidden">
          {/* Folder Sidebar — desktop left panel + mobile chips */}
          <FolderSidebar
            selectedFolderId={selectedFolderId}
            onSelectFolder={setSelectedFolderId}
            files={allFiles}
          />

          {/* Main content */}
          <main className="flex-1 min-w-0 overflow-y-auto flex flex-col">
            <div
              className={`px-4 sm:px-6 lg:px-8 py-6 space-y-6 flex-1 ${audioFiles.length > 0 ? "pb-24" : ""}`}
            >
              {/* Upload zone */}
              <motion.section
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <DropZone folderId={selectedFolderId} />
              </motion.section>

              {/* File grid */}
              <motion.section
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <FileGrid
                  files={files}
                  isLoading={isLoading}
                  folders={folders}
                  selectedFolderName={selectedFolder?.name}
                  onOpenAlbum={() => setAlbumMode(true)}
                />
              </motion.section>
            </div>
          </main>
        </div>

        {/* Footer */}
        <footer className="border-t border-border py-4 mt-auto">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-xs text-muted-foreground text-center">
              © {new Date().getFullYear()}. Built with{" "}
              <span className="text-primary">♥</span> using{" "}
              <a
                href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors"
              >
                caffeine.ai
              </a>
            </p>
          </div>
        </footer>

        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: "oklch(var(--card))",
              border: "1px solid oklch(var(--border))",
              color: "oklch(var(--foreground))",
            },
          }}
        />

        {/* Photo Album Overlay */}
        {albumMode && photoFiles.length > 0 && (
          <PhotoAlbum files={photoFiles} onClose={() => setAlbumMode(false)} />
        )}

        {/* Persistent Music Player */}
        <MusicPlayer audioFiles={audioFiles} />
      </div>
    </TooltipProvider>
  );
}

/** Outer shell — handles auth state and renders the appropriate screen */
export default function App() {
  const { identity, isInitializing } = useInternetIdentity();

  // Full-screen loader while the auth client checks stored credentials
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2
          className="w-8 h-8 animate-spin"
          style={{ color: "oklch(var(--primary))" }}
        />
      </div>
    );
  }

  // Not authenticated — show login screen
  if (!identity) {
    return <LoginScreen />;
  }

  // Authenticated — show the full app
  return <AppContent />;
}
