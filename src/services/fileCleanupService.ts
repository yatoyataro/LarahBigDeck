import { supabase } from '@/utils/supabase/client'

interface UploadRecord {
  id: string
  file_url: string | null
  file_name: string
  created_at: string
  deck_id: string
  file_deleted: boolean | null
  file_deleted_at?: string | null
}

/**
 * Delete files from Supabase Storage that are older than 2 days
 * This helps manage storage costs while keeping decks and cards intact
 */
export async function cleanupOldUploadedFiles(): Promise<{
  deletedCount: number
  errors: string[]
}> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      throw new Error('Not authenticated')
    }

    // Calculate the cutoff date (2 days ago)
    const twoDaysAgo = new Date()
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)
    const cutoffDate = twoDaysAgo.toISOString()

    console.log('🧹 Starting file cleanup for files older than:', cutoffDate)

    // Get all upload records older than 2 days that still have files
    const { data: oldUploads, error: uploadsError } = await supabase
      .from('uploads')
      .select('id, file_url, file_name, created_at, deck_id, file_deleted')
      .eq('user_id', user.id)
      .lt('created_at', cutoffDate)
      .or('file_deleted.is.null,file_deleted.eq.false')

    if (uploadsError) {
      console.error('Error fetching old uploads:', uploadsError)
      throw uploadsError
    }

    if (!oldUploads || oldUploads.length === 0) {
      console.log('✅ No old files to clean up')
      return { deletedCount: 0, errors: [] }
    }

    console.log(`📁 Found ${oldUploads.length} files to clean up`)

    let deletedCount = 0
    const errors: string[] = []

    // Delete each file from storage and mark as deleted
    for (const upload of (oldUploads as UploadRecord[])) {
      try {
        if (upload.file_url) {
          // Extract the file path from the URL
          const urlParts = upload.file_url.split('deck-uploads/')
          if (urlParts.length > 1) {
            const filePath = urlParts[1]
            
            console.log(`🗑️ Deleting file: ${filePath}`)
            
            // Delete from storage
            const { error: storageError } = await supabase.storage
              .from('deck-uploads')
              .remove([filePath])

            if (storageError) {
              // File might already be deleted, log but continue
              console.warn('Storage deletion warning:', storageError)
              if (!storageError.message.includes('not found')) {
                errors.push(`Failed to delete ${upload.file_name}: ${storageError.message}`)
              }
            }

          // Mark upload record as file deleted (keep the record for history)
          // @ts-ignore - Supabase type inference issue
          const { error: updateError } = await supabase
            .from('uploads')
            // @ts-ignore
            .update({ 
              file_deleted: true,
              file_deleted_at: new Date().toISOString(),
              file_url: null // Clear the URL since file no longer exists
            })
            .eq('id', upload.id)

          if (updateError) {
              console.error('Error updating upload record:', updateError)
              errors.push(`Failed to update record for ${upload.file_name}`)
            } else {
              deletedCount++
              console.log(`✅ Deleted: ${upload.file_name}`)
            }
          }
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err)
        console.error(`Error processing upload ${upload.id}:`, err)
        errors.push(`Error processing ${upload.file_name}: ${errorMsg}`)
      }
    }

    console.log(`🎉 Cleanup complete: ${deletedCount} files deleted, ${errors.length} errors`)

    return { deletedCount, errors }
  } catch (error) {
    console.error('Error in cleanupOldUploadedFiles:', error)
    throw error
  }
}

/**
 * Check if a deck has associated files and their status
 */
export async function getDeckFileStatus(deckId: string): Promise<{
  hasFiles: boolean
  filesDeleted: boolean
  uploadCount: number
  ageInDays: number | null
}> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      throw new Error('Not authenticated')
    }

    const { data: uploads, error } = await supabase
      .from('uploads')
      .select('id, file_url, created_at, file_deleted')
      .eq('deck_id', deckId)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error fetching deck file status:', error)
      throw error
    }

    if (!uploads || uploads.length === 0) {
      return {
        hasFiles: false,
        filesDeleted: false,
        uploadCount: 0,
        ageInDays: null
      }
    }

    const hasFiles = uploads.length > 0
    const filesDeleted = uploads.every((u: any) => u.file_deleted === true)
    const oldestUpload = uploads[0] as UploadRecord
    const ageInDays = oldestUpload.created_at 
      ? Math.floor((Date.now() - new Date(oldestUpload.created_at).getTime()) / (1000 * 60 * 60 * 24))
      : null

    return {
      hasFiles,
      filesDeleted,
      uploadCount: uploads.length,
      ageInDays
    }
  } catch (error) {
    console.error('Error in getDeckFileStatus:', error)
    throw error
  }
}

/**
 * Manually trigger cleanup for a specific deck's files
 */
export async function cleanupDeckFiles(deckId: string): Promise<boolean> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      throw new Error('Not authenticated')
    }

    const { data: uploads, error } = await supabase
      .from('uploads')
      .select('id, file_url, file_name')
      .eq('deck_id', deckId)
      .eq('user_id', user.id)
      .or('file_deleted.is.null,file_deleted.eq.false')

    if (error) {
      console.error('Error fetching deck uploads:', error)
      throw error
    }

    if (!uploads || uploads.length === 0) {
      return true // Nothing to clean
    }

    for (const upload of uploads) {
      if ((upload as UploadRecord).file_url) {
        const urlParts = (upload as UploadRecord).file_url!.split('deck-uploads/')
        if (urlParts.length > 1) {
          const filePath = urlParts[1]
          
          // Delete from storage (ignore errors if already deleted)
          await supabase.storage
            .from('deck-uploads')
            .remove([filePath])

          // Mark as deleted
          // @ts-ignore - Supabase type inference issue
          await supabase
            .from('uploads')
            // @ts-ignore
            .update({ 
              file_deleted: true,
              file_deleted_at: new Date().toISOString(),
              file_url: null
            })
            .eq('id', (upload as UploadRecord).id)
        }
      }
    }

    return true
  } catch (error) {
    console.error('Error in cleanupDeckFiles:', error)
    return false
  }
}
