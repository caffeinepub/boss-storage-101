import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export type Time = bigint;
export interface FileMetadata {
    originalFilename: string;
    blob: ExternalBlob;
    mimeType: string;
    uploadTimestamp: Time;
    exifCaptureTimestamp?: Time;
    fileId: string;
    category: FileCategory;
    sizeBytes: bigint;
    folderId?: string;
}
export interface Folder {
    name: string;
    createdAt: Time;
    folderId: string;
}
export enum FileCategory {
    pdf = "pdf",
    audio = "audio",
    other = "other",
    heic = "heic",
    photo = "photo"
}
export interface backendInterface {
    createFolder(folderId: string, name: string): Promise<Folder>;
    deleteFile(fileId: string): Promise<void>;
    deleteFiles(fileIds: Array<string>): Promise<void>;
    deleteFolder(folderId: string): Promise<void>;
    getFileMetadata(fileId: string): Promise<FileMetadata>;
    listFiles(folderId: string | null): Promise<Array<FileMetadata>>;
    listFolders(): Promise<Array<Folder>>;
    moveFileToFolder(fileId: string, folderId: string | null): Promise<FileMetadata>;
    renameFolder(folderId: string, newName: string): Promise<Folder>;
    uploadFile(fileId: string, originalFilename: string, mimeType: string, sizeBytes: bigint, exifCaptureTimestamp: Time | null, category: FileCategory, blob: ExternalBlob, folderId: string | null): Promise<FileMetadata>;
}
