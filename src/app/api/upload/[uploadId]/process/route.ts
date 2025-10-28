import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { GoogleGenAI } from '@google/genai'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const geminiApiKey = process.env.GOOGLE_GEMINI_API_KEY!

// Server-side Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Initialize Gemini with the new SDK
const genAI = new GoogleGenAI({ apiKey: geminiApiKey })

interface ProcessUploadParams {
  params: Promise<{
    uploadId: string
  }>
}

/**
 * Process uploaded file with Gemini AI
 * POST /api/upload/[uploadId]/process
 */
export async function POST(
  request: NextRequest,
  { params }: ProcessUploadParams
) {
  try {
    const { uploadId } = await params
    console.log('=== AI Processing Started ===')
    console.log('Upload ID:', uploadId)

    // Get the upload record
    const { data: upload, error: uploadError } = await supabase
      .from('uploads')
      .select('*')
      .eq('id', uploadId)
      .single()

    if (uploadError || !upload) {
      console.error('Upload not found:', uploadError)
      return NextResponse.json(
        { error: 'Upload not found' },
        { status: 404 }
      )
    }

    console.log('Upload record found:', {
      id: upload.id,
      deck_id: upload.deck_id,
      mime_type: upload.mime_type,
      file_name: upload.file_name
    })

    // Update status to processing
    await supabase
      .from('uploads')
      .update({ status: 'processing' })
      .eq('id', uploadId)
    
    console.log('Status updated to: processing')

    console.log('Status updated to: processing')

    // Download the file from storage
    const filePath = upload.metadata?.storage_path
    if (!filePath) {
      console.error('Storage path not found in metadata:', upload.metadata)
      throw new Error('Storage path not found in upload metadata')
    }

    console.log('Downloading file from storage:', filePath)

    const { data: fileData, error: downloadError } = await supabase.storage
      .from('deck-uploads')
      .download(filePath)

    if (downloadError || !fileData) {
      console.error('Download error:', downloadError)
      throw new Error(`Failed to download file: ${downloadError?.message}`)
    }

    console.log('File downloaded successfully, size:', fileData.size, 'bytes')

    // Convert file to base64 for Gemini
    const arrayBuffer = await fileData.arrayBuffer()
    const base64Data = Buffer.from(arrayBuffer).toString('base64')
    console.log('File converted to base64, length:', base64Data.length)

    // Determine mime type - Gemini supports PDF natively
    // For DOCX/PPT, we'll need to handle them as PDFs or extract text
    let mimeType = upload.mime_type || 'application/pdf'
    console.log('Original MIME type:', mimeType)
    
    // Gemini API only supports PDF for document processing
    // If it's not a PDF, we need to convert or extract text
    if (mimeType !== 'application/pdf') {
      console.log('⚠️ Non-PDF file detected. Gemini API only supports PDF for document vision.')
      console.log('⚠️ For DOCX/PPT files, consider converting to PDF first or extracting text.')
      // For now, we'll try to process it anyway and let Gemini handle it
      // You may want to add text extraction here for DOCX files
    }

    // Prepare the prompt for Gemini
    const prompt = `You are an expert at creating educational multiple choice questions from documents. 

    Analyze the provided document and create comprehensive multiple choice questions that cover the main concepts, definitions, and important information.
    Make sure that all the details are accurate and relevant from the document.

    IMPORTANT: Create ONLY multiple choice questions. Do NOT create regular flashcards.

    For each multiple choice question:
    1. Create a clear, specific question that tests understanding
    2. Provide exactly 4 answer options
    3. The FIRST option must ALWAYS be the correct answer
    4. The other 3 options should be plausible but incorrect distractors
    5. Make the incorrect options challenging but clearly wrong to someone who knows the material
    6. Add relevant tags for categorization

    CRITICAL GUIDELINES FOR ANSWER OPTIONS:
    - ALL four options MUST be similar in length (within 10-20% word count)
    - DO NOT make the correct answer significantly longer or more detailed than the distractors
    - DO NOT include multiple concepts or clauses only in the correct answer
    - Each option should use similar sentence structure and complexity
    - Avoid patterns where correct answers are always the most comprehensive or detailed
    - Distractors should be specific and concrete, not vague or obviously wrong
    - Each option should stand alone as a complete, plausible answer
    - Use parallel construction across all four options

    BAD EXAMPLE (avoid this):
    ❌ "An interdisciplinary field that combines mathematics, computer science, and domain-specific knowledge to model, simulate, and solve real-world problems efficiently."
    ❌ "A type of software"
    ❌ "A programming language"
    ❌ "Computer hardware"

    GOOD EXAMPLE (aim for this):
    ✓ "An interdisciplinary field combining mathematics, computer science, and domain knowledge"
    ✓ "A field focused on developing algorithms for complex mathematical equations"
    ✓ "A branch of computer science dedicated to optimizing hardware performance"
    ✓ "The study of theoretical physics using traditional analytical methods"

    Return the questions in the following JSON format:
    {
    "flashcards": [
        {
        "question": "Which of the following best describes...",
        "answer": "The correct answer",
        "type": "multiple_choice",
        "options": ["Correct answer (concise)", "Wrong but plausible (same length)", "Another incorrect (same length)", "Third wrong answer (same length)"],
        "tags": ["topic1", "topic2"]
        },
        {
        "question": "What is the primary purpose of...",
        "answer": "The correct answer",
        "type": "multiple_choice",
        "options": ["Correct answer", "Plausible wrong answer", "Another wrong answer", "Third wrong answer"],
        "tags": ["topic1"]
        }
    ]
    }

    Create between 15-60 multiple choice questions depending on the content length. Focus on:
    - Key concepts and their definitions
    - Important facts, figures, and data
    - Processes, procedures, and methodologies
    - Cause and effect relationships
    - Comparisons and contrasts
    - Applications and examples
    - Critical thinking and analysis

    Guidelines for quality questions:
    - Questions should be clear and unambiguous
    - Avoid "all of the above" or "none of the above" options
    - Make distractors realistic and based on common misconceptions or related concepts
    - Test understanding, not just memorization
    - Cover different difficulty levels (easy, medium, hard)
    - Ensure the correct answer is definitively correct
    - BALANCE THE LENGTH: Each option should have roughly the same word count
    - Use specific, concrete language in ALL options, not just the correct answer
    - Distractors should be wrong for subtle conceptual reasons, not obvious lack of detail

    Remember: ALL questions must be multiple choice format with exactly 4 options of SIMILAR LENGTH, with the correct answer ALWAYS in the first position.`

    console.log('Calling Gemini API...')
    console.log('Model: gemini-2.5-flash')
    console.log('MIME type:', mimeType)

    // Call Gemini API using the newer SDK format with gemini-2.5-flash
    const response = await genAI.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        { text: prompt },
        {
          inlineData: {
            mimeType: 'application/pdf', // Force PDF MIME type for Gemini
            data: base64Data,
          },
        },
      ],
    })

    console.log('✅ Gemini API response received')
    const text = response.text
    console.log('Response length:', text.length, 'characters')
    console.log('First 200 chars:', text.substring(0, 200))

    // Parse the JSON response
    let flashcardsData
    try {
      console.log('Parsing JSON response...')
      // Extract JSON from markdown code blocks if present
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```\n([\s\S]*?)\n```/)
      const jsonText = jsonMatch ? jsonMatch[1] : text
      
      if (jsonMatch) {
        console.log('Found JSON in markdown code block')
      } else {
        console.log('No markdown code block, parsing raw text')
      }
      
      flashcardsData = JSON.parse(jsonText)
      console.log('✅ JSON parsed successfully')
      console.log('Number of flashcards:', flashcardsData.flashcards?.length || 0)
    } catch (parseError) {
      console.error('❌ Failed to parse Gemini response')
      console.error('Parse error:', parseError)
      console.error('Raw response:', text)
      throw new Error('Failed to parse AI response. Please try again.')
    }

    if (!flashcardsData.flashcards || !Array.isArray(flashcardsData.flashcards)) {
      console.error('❌ Invalid flashcard data structure')
      console.error('Data:', flashcardsData)
      throw new Error('Invalid flashcard data structure')
    }

    console.log('Flashcards to create:', flashcardsData.flashcards.length)

    // Get the deck
    const { data: deck, error: deckError } = await supabase
      .from('decks')
      .select('*')
      .eq('id', upload.deck_id)
      .single()

    if (deckError || !deck) {
      console.error('❌ Deck not found:', deckError)
      throw new Error('Deck not found')
    }

    console.log('Deck found:', { id: deck.id, title: deck.title, name: deck.name })

    // Create cards in the database
    const cardsToInsert = flashcardsData.flashcards.map((card: any, index: number) => {
      const isMultipleChoice = card.type === 'multiple_choice' && card.options?.length >= 2

      return {
        deck_id: upload.deck_id,
        question: card.question,
        answer: card.answer,
        card_type: isMultipleChoice ? 'multiple_choice' : 'flashcard',
        options: isMultipleChoice ? card.options : null,
        correct_option_index: isMultipleChoice ? 0 : null, // First option is correct
        tags: Array.isArray(card.tags) ? card.tags : null,
        position: index,
        difficulty: 3, // Changed from 2.5 to 3 (integer)
        times_reviewed: 0,
        times_correct: 0,
      }
    })

    console.log('Inserting', cardsToInsert.length, 'cards into database...')

    const { data: createdCards, error: cardsError } = await supabase
      .from('cards')
      .insert(cardsToInsert)
      .select()

    if (cardsError) {
      console.error('❌ Error creating cards:', cardsError)
      throw new Error(`Failed to create cards: ${cardsError.message}`)
    }

    console.log('✅ Cards created successfully:', createdCards?.length || 0)

    console.log('✅ Cards created successfully:', createdCards?.length || 0)

    // Update upload status to completed
    await supabase
      .from('uploads')
      .update({
        status: 'completed',
        metadata: {
          ...upload.metadata,
          processed_at: new Date().toISOString(),
          cards_created: createdCards?.length || 0,
        },
      })
      .eq('id', uploadId)

    console.log('✅ Upload status updated to: completed')
    console.log('=== AI Processing Completed Successfully ===')

    return NextResponse.json({
      success: true,
      upload_id: uploadId,
      deck_id: upload.deck_id,
      cards_created: createdCards?.length || 0,
      cards: createdCards,
    })
  } catch (error: any) {
    console.error('=== AI Processing Failed ===')
    console.error('❌ Error type:', error.name)
    console.error('❌ Error message:', error.message)
    console.error('❌ Error stack:', error.stack)

    // Update upload status to failed
    const { uploadId } = await params
    await supabase
      .from('uploads')
      .update({
        status: 'failed',
        metadata: {
          error: error.message,
          failed_at: new Date().toISOString(),
        },
      })
      .eq('id', uploadId)

    console.log('Upload status updated to: failed')

    return NextResponse.json(
      {
        error: error.message || 'Failed to process upload',
        details: error.toString(),
      },
      { status: 500 }
    )
  }
}
