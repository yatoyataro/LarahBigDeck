import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

/**
 * GET /api/upload/[uploadId]
 * Get status and details of a specific upload
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ uploadId: string }> }
) {
  try {
    const supabase = await createClient()
    const { uploadId } = await params

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be logged in' },
        { status: 401 }
      )
    }

    // Fetch upload
    const { data: upload, error } = await supabase
      .from('uploads')
      .select('*')
      .eq('id', uploadId)
      .eq('user_id', user.id)
      .single()

    if (error) {
      console.error('Error fetching upload:', error)
      return NextResponse.json(
        { error: 'Not found', message: 'Upload not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ upload }, { status: 200 })
  } catch (error) {
    console.error('Unexpected error in GET /api/upload/[uploadId]:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/upload/[uploadId]
 * Update upload status (typically called by background processing job)
 * 
 * Body: {
 *   status: 'pending' | 'processing' | 'completed' | 'failed',
 *   error_message?: string,
 *   processed_at?: string
 * }
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ uploadId: string }> }
) {
  try {
    const supabase = await createClient()
    const { uploadId } = await params

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be logged in' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { status, error_message, processed_at } = body

    // Validate status
    const validStatuses = ['pending', 'processing', 'completed', 'failed']
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Validation error', message: 'Invalid status' },
        { status: 400 }
      )
    }

    // Build update object
    const updates: any = {}
    if (status) updates.status = status
    if (error_message !== undefined) updates.error_message = error_message
    if (processed_at !== undefined) updates.processed_at = processed_at

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'Validation error', message: 'No valid fields to update' },
        { status: 400 }
      )
    }

    // Update upload
    const { data: upload, error } = await supabase
      .from('uploads')
      // @ts-ignore - Supabase generated types don't properly infer update parameter types
      .update(updates)
      .eq('id', uploadId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating upload:', error)
      return NextResponse.json(
        { error: 'Database error', message: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ upload }, { status: 200 })
  } catch (error) {
    console.error('Unexpected error in PATCH /api/upload/[uploadId]:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/upload/[uploadId]
 * Delete an upload and its associated file from storage
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ uploadId: string }> }
) {
  try {
    const supabase = await createClient()
    const { uploadId } = await params

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be logged in' },
        { status: 401 }
      )
    }

    // Fetch upload to get storage path
    const { data: upload, error: fetchError } = await supabase
      .from('uploads')
      .select('metadata')
      .eq('id', uploadId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !upload) {
      return NextResponse.json(
        { error: 'Not found', message: 'Upload not found' },
        { status: 404 }
      )
    }

    // Extract storage path from metadata
    const metadata = (upload as any).metadata as any
    const storagePath = metadata?.storage_path

    // Delete from database
    const { error: deleteError } = await supabase
      .from('uploads')
      .delete()
      .eq('id', uploadId)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('Error deleting upload from database:', deleteError)
      return NextResponse.json(
        { error: 'Database error', message: deleteError.message },
        { status: 500 }
      )
    }

    // Delete file from storage if path exists
    if (storagePath) {
      const { error: storageError } = await supabase.storage
        .from('deck-uploads')
        .remove([storagePath])

      if (storageError) {
        console.error('Error deleting file from storage:', storageError)
        // Don't fail the request if storage deletion fails
        // The database record is already deleted
      }
    }

    return NextResponse.json(
      { message: 'Upload deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Unexpected error in DELETE /api/upload/[uploadId]:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
