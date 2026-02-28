import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ExternalBlob } from "../backend";
import type { FileMetadata, Folder } from "../backend.d";
import { FileCategory } from "../backend.d";
import { useActor } from "./useActor";

export function useListFiles(folderId?: string | null) {
  const { actor, isFetching } = useActor();
  return useQuery<FileMetadata[]>({
    queryKey: ["files", folderId ?? null],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listFiles(folderId ?? null);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useListFolders() {
  const { actor, isFetching } = useActor();
  return useQuery<Folder[]>({
    queryKey: ["folders"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listFolders();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateFolder() {
  const queryClient = useQueryClient();
  const { actor } = useActor();
  return useMutation({
    mutationFn: async ({
      folderId,
      name,
    }: { folderId: string; name: string }) => {
      if (!actor) throw new Error("Not connected");
      return actor.createFolder(folderId, name);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["folders"] });
    },
  });
}

export function useDeleteFolder() {
  const queryClient = useQueryClient();
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (folderId: string) => {
      if (!actor) throw new Error("Not connected");
      return actor.deleteFolder(folderId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["folders"] });
      queryClient.invalidateQueries({ queryKey: ["files"] });
    },
  });
}

export function useRenameFolder() {
  const queryClient = useQueryClient();
  const { actor } = useActor();
  return useMutation({
    mutationFn: async ({
      folderId,
      newName,
    }: { folderId: string; newName: string }) => {
      if (!actor) throw new Error("Not connected");
      return actor.renameFolder(folderId, newName);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["folders"] });
    },
  });
}

export function useMoveFileToFolder() {
  const queryClient = useQueryClient();
  const { actor } = useActor();
  return useMutation({
    mutationFn: async ({
      fileId,
      folderId,
    }: { fileId: string; folderId: string | null }) => {
      if (!actor) throw new Error("Not connected");
      return actor.moveFileToFolder(fileId, folderId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files"] });
    },
  });
}

export function useDeleteFile() {
  const queryClient = useQueryClient();
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (fileId: string) => {
      if (!actor) throw new Error("Not connected");
      return actor.deleteFile(fileId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files"] });
    },
  });
}

export function useDeleteFiles() {
  const queryClient = useQueryClient();
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (fileIds: string[]) => {
      if (!actor) throw new Error("Not connected");
      return actor.deleteFiles(fileIds);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files"] });
    },
  });
}

export function useUploadFile() {
  const queryClient = useQueryClient();
  const { actor } = useActor();
  return useMutation({
    mutationFn: async ({
      fileId,
      originalFilename,
      mimeType,
      sizeBytes,
      exifCaptureTimestamp,
      category,
      blob,
      folderId,
    }: {
      fileId: string;
      originalFilename: string;
      mimeType: string;
      sizeBytes: bigint;
      exifCaptureTimestamp: bigint | null;
      category: FileCategory;
      blob: ExternalBlob;
      folderId?: string | null;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.uploadFile(
        fileId,
        originalFilename,
        mimeType,
        sizeBytes,
        exifCaptureTimestamp,
        category,
        blob,
        folderId ?? null,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files"] });
    },
  });
}

export { FileCategory };
export type { FileMetadata, Folder };
