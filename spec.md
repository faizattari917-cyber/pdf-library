# PDF Library

## Current State
A PDF library app where:
- Admin (token: dxnamaaz90) can upload unlimited PDFs with title and description
- Users can view PDFs without login (just name entry)
- PDFs stored via blob-storage component
- Backend has `addPdf`, `deletePdf`, `listPdfs`, `getPdf` functions

Known bug: `pdfEntries` Map is NOT stable, so data is wiped on every canister upgrade. This is why uploads appear to fail -- PDFs get stored to blob storage but after canister upgrade the metadata is gone, so the list is always empty.

## Requested Changes (Diff)

### Add
- `stable` storage for PDF entries so data persists across canister upgrades (preupgrade/postupgrade hooks)

### Modify
- Backend: make `pdfEntries` persistent using stable variable + preupgrade/postupgrade lifecycle hooks
- `Int.toText` usage for `Time.now()` in id generation (previously used `.toText()` method which may not exist)

### Remove
- Nothing

## Implementation Plan
1. Regenerate Motoko backend with stable PDF storage
2. Frontend is already correct -- no changes needed to frontend upload logic
3. Build and deploy
