# BOSS Storage 101

## Current State
A full-stack personal cloud storage app with drag-and-drop file uploads (photos, PDFs, MP3s, HEIC, videos), folder management, photo album/slideshow, music player, video playback, duplicate detection, and PWA support.

The backend `FileCategory` type is `{ #photo; #pdf; #audio; #heic; #other }` -- it does NOT have a `#video` variant. Video files are therefore stored with category `#other`, which causes the frontend to misclassify them and display them inconsistently.

Additionally, in `DropZone.tsx`, files with an empty or missing MIME type (common on some mobile browsers and OS drag-and-drop events) are silently rejected because the validation only checks MIME type without a proper extension-only fallback.

## Requested Changes (Diff)

### Add
- `#video` variant to `FileCategory` in the backend

### Modify
- `getMimeTypeCategory` in `fileUtils.ts` -- return `FileCategory.video` for `video/*` MIME types
- `DropZone.tsx` `handleFiles` -- add fallback: if MIME type is empty, infer it from the file extension before rejecting

### Remove
- Nothing removed

## Implementation Plan
1. Regenerate the Motoko backend with `FileCategory = { #photo; #pdf; #audio; #heic; #video; #other }` and all existing endpoints preserved
2. Update `getMimeTypeCategory` in `fileUtils.ts` to map `video/*` to `FileCategory.video`
3. Update `DropZone.tsx` `handleFiles` to accept files with empty MIME type if the extension matches a supported video or image format
4. Update `getCategoryLabel` in `fileUtils.ts` to return "Video" for the video category
