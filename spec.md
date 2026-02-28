# BOSS Storage 101

## Current State
A full-stack ICP storage app with drag-and-drop upload (photos, videos, PDFs, MP3s, HEIC), folder organisation, photo lightbox, video lightbox, music player, photo album slideshow, and bulk download buttons. Download flows: per-file download button, "Download All" (current tab), and "Download Videos & Photos" (all media). No duplicate detection exists.

## Requested Changes (Diff)

### Add
- Duplicate detection utility: before any download starts, scan the file list for duplicates (same filename AND same file size). Group them into duplicate sets.
- `DuplicatesDialog` component: a modal that shows when duplicates are found before a download. Lists each duplicate group with thumbnails/icons, file names, sizes, and upload dates. User can select which copies to delete (defaults to keeping the newest, pre-selecting the older ones for deletion). Has "Delete Selected & Download", "Skip & Download Anyway", and "Cancel" actions.
- Duplicate detection hook in `FileGrid` that intercepts all three download entry points (per-file download does NOT trigger it; only batch downloads trigger it): "Download All", "Download Videos & Photos". Also add a standalone "Find Duplicates" button in the toolbar that opens the dialog without triggering a download.

### Modify
- `FileGrid.tsx`: add duplicate check before `handleDownloadAll` and `handleDownloadMediaFiles`. If duplicates found, open `DuplicatesDialog` and wait for resolution before proceeding with download. Add a "Find Duplicates" toolbar button that opens the dialog in inspect-only mode.
- `fileUtils.ts`: add `findDuplicates(files: FileMetadata[])` utility that groups files by `originalFilename + sizeBytes` and returns groups with more than one file.

### Remove
- Nothing removed.

## Implementation Plan
1. Add `findDuplicates` utility to `fileUtils.ts` -- groups files sharing the same filename and size into arrays.
2. Create `DuplicatesDialog.tsx` -- modal component that receives duplicate groups and a pending download callback. Shows each group as a card with file icon/thumbnail, name, size, date. Checkboxes to select files for deletion (older copies pre-selected). Buttons: "Delete & Download", "Download Anyway", "Cancel".
3. Update `FileGrid.tsx`: import and use `findDuplicates`; add state for `duplicatesDialogOpen`, `pendingDownloadFn`, `duplicateGroups`; wrap `handleDownloadAll` and `handleDownloadMediaFiles` to check duplicates first; add "Find Duplicates" button in toolbar (visible when files.length > 0).
