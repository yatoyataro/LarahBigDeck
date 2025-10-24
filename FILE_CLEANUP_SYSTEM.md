# Automatic File Cleanup System

## Overview

This system automatically deletes uploaded files from Supabase Storage after 2 days while keeping decks and flashcards intact. This helps manage storage costs while preserving all deck data.

## How It Works

### Automatic Cleanup Flow

```
Day 0: File uploaded
  ↓
Day 1: File still available
  ↓
Day 2: File still available
  ↓
Day 3+: File automatically deleted from storage
  ├─ File removed from Supabase Storage
  ├─ Upload record marked as "file_deleted"
  ├─ file_url cleared
  └─ Deck and cards remain intact
```

### What Gets Deleted

- ✅ **Deleted**: Uploaded PDF/DOCX/PPT files from Supabase Storage
- ✅ **Preserved**: Decks, flashcards, card progress, statistics
- ✅ **Preserved**: Upload records (for history tracking)

### What Happens

1. **Files older than 2 days** are automatically identified
2. **Storage files** are deleted from `deck-uploads` bucket
3. **Upload records** are updated:
   - `file_deleted` = `true`
   - `file_deleted_at` = timestamp
   - `file_url` = `null`
4. **Decks and cards** continue working normally

## Implementation

### Files Created/Modified

#### 1. `src/services/fileCleanupService.ts` (NEW)
Functions for file cleanup:
- `cleanupOldUploadedFiles()` - Delete files older than 2 days
- `getDeckFileStatus(deckId)` - Check if deck has files and their status
- `cleanupDeckFiles(deckId)` - Manually cleanup a specific deck's files

#### 2. `src/app/api/cleanup/files/route.ts` (NEW)
API endpoint for automatic cleanup:
- `GET /api/cleanup/files` - Runs cleanup job
- Can be called manually or via cron job

#### 3. `src/services/deckService.ts` (MODIFIED)
Updated `deleteDeck()` function:
- Checks `file_deleted` status before attempting storage deletion
- Gracefully handles already-deleted files
- No errors if file was auto-deleted

## Usage

### Manual Cleanup (Frontend)

```typescript
import { cleanupOldUploadedFiles } from '@/services/fileCleanupService'

// Trigger cleanup
const result = await cleanupOldUploadedFiles()
console.log(`Deleted ${result.deletedCount} files`)
console.log(`Errors: ${result.errors.length}`)
```

### API Endpoint (Backend)

```bash
# Manual trigger via API
curl http://localhost:3001/api/cleanup/files

# Response:
{
  "success": true,
  "message": "Cleanup complete: 5 files deleted",
  "deletedCount": 5,
  "errors": [],
  "processedCount": 5
}
```

### Check Deck File Status

```typescript
import { getDeckFileStatus } from '@/services/fileCleanupService'

const status = await getDeckFileStatus(deckId)
console.log(status)
// {
//   hasFiles: true,
//   filesDeleted: false,
//   uploadCount: 1,
//   ageInDays: 3
// }
```

## Automation Options

### Option 1: Vercel Cron Jobs (Recommended for Production)

Create `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cleanup/files",
    "schedule": "0 2 * * *"
  }]
}
```

This runs cleanup daily at 2 AM.

### Option 2: GitHub Actions

Create `.github/workflows/cleanup.yml`:
```yaml
name: File Cleanup
on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM UTC
jobs:
  cleanup:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Cleanup
        run: |
          curl -X GET https://your-domain.com/api/cleanup/files
```

### Option 3: Manual Trigger

Add a button in your admin dashboard:
```tsx
<Button onClick={async () => {
  const res = await fetch('/api/cleanup/files')
  const data = await res.json()
  toast({ title: `Deleted ${data.deletedCount} files` })
}}>
  Run Cleanup Now
</Button>
```

## Database Schema Updates

Add these columns to the `uploads` table:

```sql
ALTER TABLE uploads
ADD COLUMN IF NOT EXISTS file_deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS file_deleted_at TIMESTAMPTZ;
```

## Benefits

### 1. **Storage Cost Savings**
- Uploaded files are typically large (PDFs, DOCX)
- After AI processing, the original file isn't needed
- Automatic cleanup prevents storage bloat

### 2. **No Data Loss**
- Decks and flashcards are preserved forever
- Only the original uploaded file is removed
- Upload records kept for audit trail

### 3. **No Breaking Changes**
- Deck deletion still works if files already deleted
- Graceful error handling for missing files
- Backwards compatible with existing decks

### 4. **Transparent to Users**
- Users see flashcards working normally
- No impact on study progress or statistics
- Deck functionality unchanged

## Safety Features

### 1. **Graceful Degradation**
```typescript
// DeleteDeck checks if file is already deleted
if (upload.file_deleted !== true) {
  // Only delete if file exists
  deleteFromStorage(filePath)
}
```

### 2. **Error Handling**
- Continues cleanup even if individual files fail
- Logs all errors for monitoring
- Returns detailed error report

### 3. **Audit Trail**
- Upload records never deleted
- `file_deleted_at` timestamp preserved
- Can track when files were cleaned up

## Monitoring

### Backend Logs

The API route provides detailed logs:

```
🧹 Starting automatic file cleanup...
Cutoff date: 2025-10-22T12:00:00.000Z
📁 Found 5 files to clean up
🗑️ Deleting file: user-123/file1.pdf
✅ Deleted: file1.pdf
🗑️ Deleting file: user-123/file2.pdf
✅ Deleted: file2.pdf
🎉 Cleanup complete: 5 files deleted, 0 errors
```

### Response Format

```typescript
{
  success: true,
  message: "Cleanup complete: 5 files deleted",
  deletedCount: 5,
  errors: [],
  processedCount: 5
}
```

## Testing

### Test Cleanup Logic

```typescript
// 1. Create a test deck with file upload
const deck = await createDeck("Test Deck")
const upload = await uploadFile(deck.id, file)

// 2. Manually set created_at to 3 days ago (for testing)
await supabase
  .from('uploads')
  .update({ created_at: '2025-10-21T00:00:00Z' })
  .eq('id', upload.id)

// 3. Run cleanup
const result = await fetch('/api/cleanup/files')
const data = await result.json()

// 4. Verify
console.log(data.deletedCount) // Should be 1
console.log(await getDeckCards(deck.id)) // Cards still exist!
```

### Test Deck Deletion

```typescript
// 1. Delete a deck with auto-deleted files
await deleteDeck(deckId)

// Should succeed without errors
// No "file not found" errors
```

## Migration Guide

### For Existing Uploads

If you have existing uploads without the new columns:

```sql
-- Add columns
ALTER TABLE uploads
ADD COLUMN IF NOT EXISTS file_deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS file_deleted_at TIMESTAMPTZ;

-- Mark very old uploads as already deleted (optional)
UPDATE uploads
SET 
  file_deleted = TRUE,
  file_deleted_at = NOW(),
  file_url = NULL
WHERE 
  created_at < NOW() - INTERVAL '30 days'
  AND (file_deleted IS NULL OR file_deleted = FALSE);
```

## Troubleshooting

### Issue: Files Not Being Deleted

**Check:**
1. Are files actually older than 2 days?
2. Is `file_deleted` already `true`?
3. Check backend logs for errors

**Solution:**
```bash
# Check upload records
SELECT id, file_name, created_at, file_deleted 
FROM uploads 
WHERE created_at < NOW() - INTERVAL '2 days';
```

### Issue: "File not found" errors during deck deletion

**This is normal!** Files may have been auto-deleted. The code handles this gracefully.

### Issue: Cleanup not running automatically

**Check:**
1. Is cron job configured (Vercel/GitHub Actions)?
2. Check cron schedule syntax
3. Verify API endpoint is accessible

## Future Enhancements

### Possible Improvements

1. **Configurable Retention Period**
   ```typescript
   const RETENTION_DAYS = process.env.FILE_RETENTION_DAYS || 2
   ```

2. **Premium Users Keep Files Longer**
   ```typescript
   const retentionDays = user.isPremium ? 30 : 2
   ```

3. **User Notification Before Deletion**
   - Email 1 day before cleanup
   - "Your file will be deleted in 24 hours"

4. **Re-upload Capability**
   - Allow users to re-upload original file
   - Re-generate flashcards if desired

5. **Storage Analytics**
   - Dashboard showing storage usage
   - Cost savings from cleanup
   - Number of files cleaned per month

## Summary

✅ **Automatic** - Files deleted after 2 days  
✅ **Safe** - Decks and cards preserved  
✅ **Efficient** - Reduces storage costs  
✅ **Robust** - Handles edge cases gracefully  
✅ **Monitored** - Detailed logs and error reporting  

Your flashcard app now has intelligent file management that saves storage costs while maintaining full functionality!
