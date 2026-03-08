# BOSS Storage 101

## Current State
- FileCard.tsx has PhotoCard, VideoCard, AudioCard, DocumentCard sub-components with Download and Delete buttons
- PhotoLightbox.tsx has a disabled Email button in its top bar
- VideoLightbox.tsx has a Download button in its top bar
- No native share functionality exists anywhere in the app

## Requested Changes (Diff)

### Add
- A Share button (using `Share2` icon from lucide-react) on PhotoCard action buttons overlay (alongside Download and Delete)
- A Share button on VideoCard action row (alongside Download and Delete)
- A Share button in the PhotoLightbox top bar (replacing the disabled Email button)
- A Share button in the VideoLightbox top bar (alongside Download)
- A `shareFile` utility function in `utils/fileUtils.ts` that:
  - Uses the Web Share API (`navigator.share`) when available (mobile)
  - Falls back to copying the direct URL to clipboard on desktop with a toast notification
  - For photos/videos: attempts to share as a File object (so it appears as an attachment in Messages/iMessage/WhatsApp)
  - Falls back to sharing just the URL if File sharing is not supported

### Modify
- PhotoLightbox.tsx: replace the disabled Email button with a functional Share button
- VideoLightbox.tsx: add Share button next to Download in the top bar
- FileCard.tsx PhotoCard: add Share button in the hover action overlay
- FileCard.tsx VideoCard: add Share button in the action row at the bottom

### Remove
- The disabled Email button in PhotoLightbox.tsx

## Implementation Plan
1. Add `shareFile(blob, filename, mimeType)` utility to `utils/fileUtils.ts`:
   - Gets direct URL from blob
   - If `navigator.canShare` with files is supported: fetch the file bytes, create a File object, call `navigator.share({ files: [file], title: filename })`
   - Else if `navigator.share` is supported: call `navigator.share({ title: filename, url: directUrl })`
   - Else: copy URL to clipboard and show a toast "Link copied to clipboard"
2. Update PhotoCard in FileCard.tsx: add Share button (Share2 icon) in the top-right hover overlay between Download and Delete
3. Update VideoCard in FileCard.tsx: add Share button in the bottom action row between Download and Delete
4. Update PhotoLightbox.tsx: replace disabled Email button with Share button using `shareFile`
5. Update VideoLightbox.tsx: add Share button next to Download button in top bar
6. Add data-ocid markers to all new share buttons
