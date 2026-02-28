# BOSS Storage 101

## Current State
A full-stack file storage app with drag-and-drop uploads, folder organization, file grid with tabs (All, Photos, PDFs, MP3s, Videos, HEIC), audio playback on cards, photo lightbox, select/delete, and PWA support.

## Requested Changes (Diff)

### Add
- **Photo Album view**: A dedicated full-screen slideshow/gallery mode that displays only photos in a beautiful album layout with smooth transitions between slides.
- **Background music player**: A persistent mini music player bar (bottom of screen) that allows the user to pick any uploaded audio file and play it as background music while browsing or viewing the photo album. Controls: play/pause, previous/next track, track name display, volume slider.
- **Album mode toggle**: A button in the header or file grid toolbar to switch between the standard file grid view and the Photo Album view.
- **Slideshow auto-advance**: Optional auto-advance toggle in album mode that cycles through photos every few seconds.

### Modify
- **App.tsx**: Add state for music player (current track, playing state) and album mode toggle. Pass music context down or use a simple state.
- **FileGrid.tsx**: Add "Album View" button in the toolbar when photos exist.

### Remove
- Nothing removed.

## Implementation Plan
1. Create `MusicPlayer` component -- persistent bottom bar, reads audio files from the file list, play/pause/next/prev controls, volume, track name. Uses same audio loading pattern as AudioCard.
2. Create `PhotoAlbum` component -- full-screen grid or slideshow of photos with navigation arrows, auto-advance toggle, and a close button to return to grid view.
3. Update `App.tsx` -- add `albumMode` state, `musicPlayer` state (current track index, playing), render `MusicPlayer` always when audio files exist, show `PhotoAlbum` when `albumMode` is true.
4. Update `FileGrid.tsx` -- add "Photo Album" button in toolbar when `tabCounts.photos > 0`, calls `onOpenAlbum` prop.
