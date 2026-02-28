# BOSS Storage 101

## Current State
VideoCard in FileCard.tsx shows a film icon, filename, size, and date with Download/Move/Delete buttons. There is no way to play a video inline or in a lightbox -- clicking the card does nothing.

## Requested Changes (Diff)

### Add
- Video player lightbox/modal: clicking a video card opens a full-screen overlay with a native HTML5 `<video>` element, play/pause/seek controls, close button (Escape key and X button), and the filename in the header.
- VideoLightbox component (new file `src/components/VideoLightbox.tsx`) similar in structure to PhotoLightbox but renders a `<video>` tag with `controls` and `autoPlay`.
- A play-button overlay on the VideoCard thumbnail area so it looks clickable.

### Modify
- `VideoCard` in `FileCard.tsx`: add a clickable area (play icon overlay over the film icon) that triggers `onOpenVideoPlayer` callback.
- `FileGrid.tsx`: manage `videoLightboxFile` state, pass `onOpenVideoPlayer` to `FileCard`, and render `<VideoLightbox>` when a video file is selected.
- `FileCard.tsx`: add `onOpenVideoPlayer` optional prop to `FileCardProps` and pass it through to `VideoCard`.

### Remove
- Nothing removed.

## Implementation Plan
1. Create `src/components/VideoLightbox.tsx`: accepts `file: FileMetadata` and `onClose: () => void`. Loads video blob URL on mount, renders a dark overlay with centered `<video controls autoPlay>`, filename header, and close button. Supports Escape key to close.
2. Update `VideoCard` in `FileCard.tsx`: add `onOpenVideoPlayer?: () => void` prop. Make the icon area / card header clickable with a Play icon overlay. Stop propagation on Download/Folder/Delete buttons.
3. Update `FileCard` component: add `onOpenVideoPlayer` to `FileCardProps`, pass to `VideoCard`.
4. Update `FileGrid.tsx`: add `videoLightboxFile` state (`FileMetadata | null`), wire `onOpenVideoPlayer` on `FileCard` to set that state, render `<VideoLightbox>` when state is set.
