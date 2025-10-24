import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

/**
 * POST /api/upload
 * Handle file upload to Supabase Storage and create upload metadata
 * 
 * This endpoint handles the file upload process:
 * 1. Uploads file to Supabase Storage bucket
 * 2. Creates upload record in database
 * 3. Returns upload metadata
 * 
 * NOTE: After this step, you would typically trigger a background job
 * to process the file and extract flashcards using your AI model.
 * This is where Step 3 (model generation) would plug in.
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be logged in to upload files' },
        { status: 401 }
      )
    }

    // Parse multipart form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const deckId = formData.get('deckId') as string | null

    // Validate file
    if (!file) {
      return NextResponse.json(
        { error: 'Validation error', message: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate deck if provided
    if (deckId) {
      const { data: deck, error: deckError } = await supabase
        .from('decks')
        .select('id')
        .eq('id', deckId)
        .eq('user_id', user.id)
        .single()

      if (deckError || !deck) {
        return NextResponse.json(
          { error: 'Not found', message: 'Deck not found' },
          { status: 404 }
        )
      }
    }

    // Validate file type (only PDF and DOCX for AI processing)
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error: 'Validation error',
          message: 'Unsupported file type. Only PDF and DOCX files are allowed for AI flashcard generation.',
        },
        { status: 400 }
      )
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'Validation error', message: 'File size must be less than 10MB' },
        { status: 400 }
      )
    }

    // Generate unique file path: userId/timestamp-filename
    const timestamp = Date.now()
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const filePath = `${user.id}/${timestamp}-${sanitizedFileName}`

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('deck-uploads')
      .upload(filePath, file, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      console.error('Error uploading file to storage:', uploadError)
      return NextResponse.json(
        { error: 'Storage error', message: uploadError.message },
        { status: 500 }
      )
    }

    // Get public URL for the uploaded file
    const {
      data: { publicUrl },
    } = supabase.storage.from('deck-uploads').getPublicUrl(filePath)

    // Create upload record in database
    const { data: upload, error: dbError } = await supabase
      .from('uploads')
      .insert({
        user_id: user.id,
        deck_id: deckId || null,
        file_name: file.name,
        file_url: publicUrl,
        file_size: file.size,
        mime_type: file.type,
        status: 'pending',
        metadata: {
          original_name: file.name,
          storage_path: filePath,
          uploaded_at: new Date().toISOString(),
        },
      } as any)
      .select()
      .single()

    if (dbError) {
      // If DB insert fails, try to clean up the uploaded file
      await supabase.storage.from('deck-uploads').remove([filePath])
      console.error('Error creating upload record:', dbError)
      return NextResponse.json(
        { error: 'Database error', message: dbError.message },
        { status: 500 }
      )
    }

    // TODO: Step 3 - Trigger background job to process file and generate flashcards
    // This is where you would:
    // 1. Queue a background job (e.g., using Supabase Edge Functions, Vercel serverless functions, or a job queue)
    // 2. The job would:
    //    - Download the file from storage
    //    - Extract text content
    //    - Send to AI model (OpenAI, Claude, etc.) to generate flashcards
    //    - Create cards in the database
    //    - Update upload status to 'completed' or 'failed'
    //
    // Example (pseudocode):
    // await queueProcessingJob({ uploadId: upload.id, filePath, deckId })

    return NextResponse.json(
      {
        upload,
        message: 'File uploaded successfully. Processing will begin shortly.',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Unexpected error in POST /api/upload:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/upload?deckId={deckId}
 * Fetch uploads for a specific deck or all user uploads
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient()

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

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const deckId = searchParams.get('deckId')

    // Build query
    let query = supabase
      .from('uploads')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (deckId) {
      query = query.eq('deck_id', deckId)
    }

    const { data: uploads, error } = await query

    if (error) {
      console.error('Error fetching uploads:', error)
      return NextResponse.json(
        { error: 'Database error', message: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ uploads }, { status: 200 })
  } catch (error) {
    console.error('Unexpected error in GET /api/upload:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
