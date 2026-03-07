# BOSS Storage 101

## Current State
FileGrid.tsx has a "Videos" tab that shows all video files together (MP4, MOV, AVI, WebM, MKV, etc.) based on `FileCategory.video` or any video MIME type.

## Requested Changes (Diff)

### Add
- "MP4" tab that filters files where `mimeType === "video/mp4"` or filename ends with `.mp4`
- "MOV" tab that filters files where `mimeType === "video/quicktime"` or filename ends with `.mov`
- Tab counts for MP4 and MOV
- Empty state messages for mp4 and mov tabs

### Modify
- `FilterTab` type to include `"mp4"` and `"mov"`
- `filteredFiles` switch to handle the two new cases
- `tabCounts` object to include mp4 and mov counts
- `EmptyState` messages to include mp4 and mov entries
- TabsList to render the two new tab triggers (after the Videos tab)

### Remove
Nothing removed — the existing Videos tab stays for all other video types.

## Implementation Plan
1. Extend `FilterTab` type with `"mp4" | "mov"`
2. Add helper checks: isMP4(file) and isMOV(file)
3. Add mp4/mov cases to filteredFiles switch
4. Add mp4/mov entries to tabCounts
5. Render two new TabsTrigger elements (MP4 and MOV) after Videos in the TabsList
6. Add empty state messages for mp4 and mov
