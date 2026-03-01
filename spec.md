# BOSS Storage 101

## Current State
A PWA personal cloud storage app with drag-and-drop file uploads (photos, PDFs, MP3s, HEICs, videos), folder management, photo album mode with music player, video playback, duplicate detection, and bulk download. The app currently has no authentication -- any visitor can access all files and folders. Backend uses blob-storage component. Frontend is React + TypeScript + Tailwind.

## Requested Changes (Diff)

### Add
- Internet Identity (passkey/biometric) authentication using the Caffeine `authorization` component
- Login screen shown to unauthenticated users, with an "Sign In with Passkey" button
- On successful login, the main app is displayed
- Logout button visible in the app header/sidebar
- Per-user file isolation: each user's files and folders are stored under their own principal, so users cannot see each other's data

### Modify
- All backend functions (`uploadFile`, `listFiles`, `deleteFile`, `deleteFiles`, `getFileMetadata`, `moveFileToFolder`, `createFolder`, `listFolders`, `deleteFolder`, `renameFolder`) to scope data by caller principal
- Frontend `App.tsx` to check auth state on load and gate the main UI behind login
- Sidebar / header to include a logout button

### Remove
- Nothing removed

## Implementation Plan
1. Add `authorization` Caffeine component
2. Regenerate Motoko backend with per-principal Map storage (keyed by principal) and authorization mixin included; all file and folder operations scoped to `caller`
3. Update frontend:
   - Wire `useAuth` hook from authorization component
   - Show a branded login/welcome screen when unauthenticated
   - Hide all file management UI until authenticated
   - Add logout button to sidebar header
   - Pass authenticated principal context where needed
