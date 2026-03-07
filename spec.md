# BOSS Storage 101

## Current State
VideoLightbox accepts a single `file: FileMetadata` prop and plays that one video with no navigation. FileGrid opens it by passing `videoLightboxFile` (a single file). There are no prev/next controls in the video player.

## Requested Changes (Diff)

### Add
- Left/right arrow buttons in the VideoLightbox to navigate to the previous/next video in sequence
- Keyboard arrow key support (ArrowLeft / ArrowRight) for navigation
- Video counter indicator (e.g. "2 / 5") in the top bar
- Auto-load the new video when navigating (reset player state)

### Modify
- `VideoLightbox` props: replace single `file` with `files: FileMetadata[]` and `currentIndex: number`, add `onNavigate: (index: number) => void`
- `FileGrid`: compute a `videoFiles` list (all files that are video), open lightbox by index into that list, pass `videoFiles` + `currentIndex` + `onNavigate` to VideoLightbox

### Remove
- Nothing removed

## Implementation Plan
1. Update `VideoLightbox.tsx` — accept `files`, `currentIndex`, `onNavigate`; derive current file from index; add prev/next arrow buttons; add ArrowLeft/ArrowRight keyboard handler; show "N / total" counter; reset video on index change
2. Update `FileGrid.tsx` — build `videoFiles` array (video category or isVideoMime); change `videoLightboxFile` state to `videoLightboxIndex: number | null`; open by index; pass updated props to VideoLightbox
