/**
 * Example Background Job for Processing Uploaded Files
 * 
 * This is a template for implementing AI-powered flashcard generation.
 * This can be implemented as:
 * - Supabase Edge Function
 * - Vercel Serverless Function
 * - Separate worker service
 * - Next.js API route with queue system
 */

import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

/**
 * Configuration
 */
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

/**
 * Initialize Supabase client with service role
 * This bypasses RLS for administrative operations
 */
const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_KEY)

/**
 * Main processing function
 * Call this when a new upload is created
 */
export async function processUpload(uploadId: string) {
  try {
    console.log(`Starting processing for upload: ${uploadId}`)

    // 1. Update status to 'processing'
    await updateUploadStatus(uploadId, 'processing')

    // 2. Fetch upload details
    const upload = await fetchUpload(uploadId)
    if (!upload) {
      throw new Error('Upload not found')
    }

    // 3. Download file from storage
    const fileContent = await downloadFile((upload as any).metadata.storage_path)

    // 4. Extract text based on file type
    const extractedText = await extractText(fileContent, (upload as any).mime_type)

    // 5. Generate flashcards using AI
    const flashcards = await generateFlashcardsWithAI(extractedText)

    // 6. Insert cards into database
    await insertCards((upload as any).deck_id!, flashcards, uploadId)

    // 7. Update status to 'completed'
    await updateUploadStatus(uploadId, 'completed', new Date().toISOString())

    console.log(`Successfully processed upload: ${uploadId}`)
    return { success: true, cardsCreated: flashcards.length }
  } catch (error) {
    console.error(`Error processing upload ${uploadId}:`, error)

    // Update status to 'failed' with error message
    await updateUploadStatus(
      uploadId,
      'failed',
      undefined,
      error instanceof Error ? error.message : 'Unknown error'
    )

    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Update upload status
 */
async function updateUploadStatus(
  uploadId: string,
  status: 'pending' | 'processing' | 'completed' | 'failed',
  processedAt?: string,
  errorMessage?: string
) {
  const updates: any = { status }
  if (processedAt) updates.processed_at = processedAt
  if (errorMessage) updates.error_message = errorMessage

  const { error } = await supabase
    .from('uploads')
    // @ts-ignore - Supabase generated types don't properly infer update parameter types
    .update(updates)
    .eq('id', uploadId)

  if (error) throw error
}

/**
 * Fetch upload from database
 */
async function fetchUpload(uploadId: string) {
  const { data, error } = await supabase
    .from('uploads')
    .select('*')
    .eq('id', uploadId)
    .single()

  if (error) throw error
  return data
}

/**
 * Download file from Supabase Storage
 */
async function downloadFile(storagePath: string): Promise<Blob> {
  const { data, error } = await supabase.storage
    .from('deck-uploads')
    .download(storagePath)

  if (error) throw error
  return data
}

/**
 * Extract text from different file types
 */
async function extractText(file: Blob, mimeType: string): Promise<string> {
  // TODO: Implement text extraction based on file type
  // For now, this is a placeholder

  if (mimeType === 'text/plain' || mimeType === 'text/markdown') {
    // Simple text files
    return await file.text()
  }

  if (mimeType === 'application/pdf') {
    // Use a library like pdf-parse or pdf.js
    // Example with pdf-parse (install: npm install pdf-parse)
    // const pdfParse = require('pdf-parse')
    // const buffer = await file.arrayBuffer()
    // const data = await pdfParse(Buffer.from(buffer))
    // return data.text
    
    throw new Error('PDF parsing not yet implemented. Install pdf-parse library.')
  }

  if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    // DOCX - use mammoth library
    // Example: npm install mammoth
    // const mammoth = require('mammoth')
    // const buffer = await file.arrayBuffer()
    // const result = await mammoth.extractRawText({ buffer: Buffer.from(buffer) })
    // return result.value
    
    throw new Error('DOCX parsing not yet implemented. Install mammoth library.')
  }

  throw new Error(`Unsupported file type: ${mimeType}`)
}

/**
 * Generate flashcards using AI (OpenAI, Claude, etc.)
 */
async function generateFlashcardsWithAI(text: string): Promise<Flashcard[]> {
  // TODO: Implement AI integration
  // This is where you'd call OpenAI, Claude, or your preferred AI model

  // Example with OpenAI (install: npm install openai)
  /*
  import OpenAI from 'openai'
  
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  })

  const prompt = `
You are an expert at creating educational flashcards. 
Extract key concepts from the following text and create flashcards.
Return ONLY a JSON array with this exact format:

[
  {
    "question": "What is...?",
    "answer": "...",
    "card_type": "flashcard"
  },
  {
    "question": "Which of the following...?",
    "answer": "Option B",
    "card_type": "multiple_choice",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct_option_index": 1
  }
]

Text to process:
${text}
`

  const completion = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      { role: "system", content: "You are a helpful assistant that creates educational flashcards." },
      { role: "user", content: prompt }
    ],
    temperature: 0.7,
    max_tokens: 2000
  })

  const responseText = completion.choices[0].message.content || '[]'
  const flashcards = JSON.parse(responseText)
  return flashcards
  */

  // Placeholder - return empty array
  console.warn('AI generation not implemented. Returning mock data.')
  
  // Mock data for testing
  return [
    {
      question: 'Sample question from extracted text?',
      answer: 'Sample answer',
      card_type: 'flashcard',
    },
  ]
}

/**
 * Insert generated cards into database
 */
async function insertCards(
  deckId: string,
  flashcards: Flashcard[],
  uploadId: string
) {
  // Get current max position
  const { data: maxPositionData } = await supabase
    .from('cards')
    .select('position')
    .eq('deck_id', deckId)
    .order('position', { ascending: false })
    .limit(1)
    .single()

  let nextPosition = maxPositionData ? (maxPositionData as any).position + 1 : 0

  // Prepare cards for insertion
  const cardsToInsert = flashcards.map((card, index) => ({
    deck_id: deckId,
    upload_id: uploadId,
    question: card.question,
    answer: card.answer,
    card_type: card.card_type || 'flashcard',
    options: card.options || null,
    correct_option_index: card.correct_option_index ?? null,
    position: nextPosition + index,
  }))

  // Batch insert
  const { error } = await supabase.from('cards').insert(cardsToInsert as any)

  if (error) throw error
}

/**
 * Type definitions
 */
interface Flashcard {
  question: string
  answer: string
  card_type?: 'flashcard' | 'multiple_choice' | 'true_false'
  options?: string[]
  correct_option_index?: number
}

/**
 * Webhook handler (if using Supabase webhooks)
 */
export async function handleWebhook(request: Request) {
  const payload = await request.json()
  
  // Verify webhook signature (important for security!)
  // const signature = request.headers.get('x-webhook-signature')
  // if (!verifySignature(signature, payload)) {
  //   return new Response('Unauthorized', { status: 401 })
  // }

  const { record } = payload
  const uploadId = record.id

  // Process in background (don't block webhook response)
  processUpload(uploadId).catch(console.error)

  return new Response('Processing started', { status: 202 })
}

/**
 * API Route handler (if using Next.js API route)
 */
export async function POST(request: Request) {
  const { uploadId } = await request.json()

  if (!uploadId) {
    return Response.json(
      { error: 'uploadId is required' },
      { status: 400 }
    )
  }

  // Start processing (could also use a job queue here)
  processUpload(uploadId).catch(console.error)

  return Response.json(
    { message: 'Processing started', uploadId },
    { status: 202 }
  )
}
