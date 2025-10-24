import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Server-side Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey)

/**
 * Cleanup old uploaded files (older than 2 days)
 * GET /api/cleanup/files
 */
export async function GET() {
  try {
    console.log('🧹 Starting automatic file cleanup...')

    // Calculate the cutoff date (2 days ago)
    const twoDaysAgo = new Date()
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)
    const cutoffDate = twoDaysAgo.toISOString()

    console.log('Cutoff date:', cutoffDate)

    // Get all upload records older than 2 days that still have files
    const { data: oldUploads, error: uploadsError } = await supabase
      .from('uploads')
      .select('id, file_url, file_name, created_at, user_id')
      .lt('created_at', cutoffDate)
      .or('file_deleted.is.null,file_deleted.eq.false')
      .not('file_url', 'is', null)

    if (uploadsError) {
      console.error('Error fetching old uploads:', uploadsError)
      throw uploadsError
    }

    if (!oldUploads || oldUploads.length === 0) {
      console.log('✅ No old files to clean up')
      return NextResponse.json({
        success: true,
        message: 'No files to clean up',
        deletedCount: 0,
        errors: []
      })
    }

    console.log(`📁 Found ${oldUploads.length} files to clean up`)

    let deletedCount = 0
    const errors: string[] = []

    // Delete each file from storage and mark as deleted
    for (const upload of oldUploads) {
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
              console.warn('Storage deletion warning:', storageError)
              if (!storageError.message.includes('not found')) {
                errors.push(`Failed to delete ${upload.file_name}: ${storageError.message}`)
              }
            }

            // Mark upload record as file deleted
            // @ts-ignore - Supabase type inference issue
            const { error: updateError } = await supabase
              .from('uploads')
              // @ts-ignore
              .update({ 
                file_deleted: true,
                file_deleted_at: new Date().toISOString(),
                file_url: null
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

    return NextResponse.json({
      success: true,
      message: `Cleanup complete: ${deletedCount} files deleted`,
      deletedCount,
      errors,
      processedCount: oldUploads.length
    })
  } catch (error: any) {
    console.error('=== File Cleanup Failed ===')
    console.error('Error:', error)

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to cleanup files',
        details: error.toString(),
      },
      { status: 500 }
    )
  }
}
