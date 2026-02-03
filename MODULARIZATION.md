# App.tsx Modularization Summary

## Overview
The App.tsx has been successfully modularized by extracting logic and UI components into separate, reusable modules.

## New Structure

### 1. **Custom Hooks** (in `src/hooks/`)

#### `useFileUpload.ts`
Handles all file upload and drag-drop logic:
- File selection and validation
- Drag-drop handlers (global and local)
- File clearing/reset functionality
- Returns: `file`, `isDragging`, `fileInputRef`, `onFileChange`, `clearFile`, `handleDragOver`, `handleDragLeave`, `handleDrop`

#### `useFileParsing.ts`
Encapsulates all file parsing logic:
- CSV parsing using PapaParse
- XML parsing using react-xml-parser
- Metadata extraction
- Progress tracking
- Pagination state management
- Returns: `loading`, `progress`, `data`, `metadata`, `setMetadata`, `loadedCount`, `setLoadedCount`, `parseFile`, `resetParsing`

### 2. **Components** (in `src/components/`)

#### `UploadCard.tsx`
First step of the workflow - file upload interface:
- File input with drag-drop support
- File preview with size information
- Clear/undo button
- Parse trigger button
- Includes `formatBytes()` utility function

#### `PreviewCard.tsx`
Second step of the workflow - data preview and editing:
- Title and subtitle input fields
- Data table with pagination
- Dynamic pagination based on loaded data
- Loading skeletons
- Back button to return to upload
- PDF conversion trigger button (placeholder)

### 3. **App.tsx** (Simplified)
Now a clean orchestrator that:
- Manages overall workflow state (`step` between "upload" and "preview")
- Handles pagination loading and progress
- Coordinates between hooks and components
- Manages transitions between screens
- Minimal JSX - delegates to UploadCard and PreviewCard components

## Benefits

1. **Separation of Concerns**: Each module has a single responsibility
2. **Reusability**: Hooks and components can be used elsewhere
3. **Testability**: Easier to test logic and components in isolation
4. **Maintainability**: Changes to parsing or upload logic don't affect UI components
5. **Code Organization**: Clear structure makes it easier to navigate and understand
6. **Scalability**: Easy to add new features or modify existing ones

## Data Flow

```
App.tsx
├─ useFileUpload() → handles file selection
├─ useFileParsing() → handles parsing logic
├─ UploadCard → renders file upload UI
│  └─ Calls: onFileChange, onClearFile, onParse
└─ PreviewCard → renders preview & metadata UI
   └─ Calls: onMetadataChange, onLoadMore, onBack
```

## File Locations

- `src/App.tsx` - Main app orchestrator
- `src/hooks/useFileUpload.ts` - Upload logic hook
- `src/hooks/useFileParsing.ts` - Parsing logic hook
- `src/components/UploadCard.tsx` - Upload UI component
- `src/components/PreviewCard.tsx` - Preview UI component
