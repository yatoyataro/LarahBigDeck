import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { convertDocxToPdf } from '../../utils/convertDocxToPdf'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const geminiApiKey = process.env.GOOGLE_GEMINI_API_KEY!

// Server-side Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Initialize Gemini
const genAI = new GoogleGenerativeAI(geminiApiKey)

/**
 * Process uploaded file with Gemini AI
 * POST /api/upload/[uploadId]/process
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Get uploadId from path parameter
    const { uploadId } = req.query

    if (!uploadId || typeof uploadId !== 'string') {
      return res.status(400).json({ error: 'Upload ID is required' })
    }

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
      return res.status(404).json({ error: 'Upload not found' })
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

    // Handle DOCX conversion to PDF
    let processedBuffer: Buffer;
    let finalMimeType: string = upload.mime_type || 'application/pdf';
    
    const arrayBuffer = await fileData.arrayBuffer();
    let fileBuffer = Buffer.from(arrayBuffer);

    // Check if file is DOCX and needs conversion
    if (upload.mime_type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      console.log('🔄 DOCX file detected, converting to PDF...');
      
      try {
        processedBuffer = await convertDocxToPdf(fileBuffer);
        finalMimeType = 'application/pdf';
        console.log('✅ DOCX converted to PDF successfully, new size:', processedBuffer.length, 'bytes');
      } catch (conversionError: any) {
        console.error('❌ DOCX conversion failed:', conversionError);
        throw new Error(`DOCX conversion failed: ${conversionError.message}`);
      }
    } else if (upload.mime_type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
      // PPTX file - not supported yet
      console.error('❌ PPTX files are not supported yet');
      throw new Error('PowerPoint files are not supported yet. Please convert to PDF first.');
    } else {
      // Already PDF or other supported format
      processedBuffer = fileBuffer;
      console.log('📄 File is already in supported format:', finalMimeType);
    }

    // Convert file to base64 for Gemini
    const base64Data = processedBuffer.toString('base64');
    console.log('File converted to base64, length:', base64Data.length)

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

Return the questions in the following JSON format:
{
  "flashcards": [
    {
      "question": "Which of the following best describes...",
      "answer": "The correct answer",
      "type": "multiple_choice",
      "options": ["Correct answer", "Incorrect option 1", "Incorrect option 2", "Incorrect option 3"],
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
- Make distractors realistic and based on common misconceptions
- Test understanding, not just memorization
- Cover different difficulty levels (easy, medium, hard)
- Ensure the correct answer is definitively correct

Remember: ALL questions must be multiple choice format with exactly 4 options, with the correct answer ALWAYS in the first position.`

    console.log('Calling Gemini API...')
    console.log('Model: gemini-1.5-flash')
    console.log('MIME type:', finalMimeType)

    // Call Gemini API
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
    
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: finalMimeType, // Use the processed file's mime type (always PDF after conversion)
          data: base64Data,
        },
      },
    ])

    console.log('✅ Gemini API response received')
    const response = await result.response
    const text = response.text()
    console.log('Response length:', text.length, 'characters')

    // Parse the JSON response
    let flashcardsData
    try {
      console.log('Parsing JSON response...')
      // Extract JSON from markdown code blocks if present
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```\n([\s\S]*?)\n```/)
      const jsonText = jsonMatch ? jsonMatch[1] : text
      
      flashcardsData = JSON.parse(jsonText)
      console.log('✅ JSON parsed successfully')
      console.log('Number of flashcards:', flashcardsData.flashcards?.length || 0)
    } catch (parseError) {
      console.error('❌ Failed to parse Gemini response')
      console.error('Parse error:', parseError)
      throw new Error('Failed to parse AI response. Please try again.')
    }

    if (!flashcardsData.flashcards || !Array.isArray(flashcardsData.flashcards)) {
      console.error('❌ Invalid flashcard data structure')
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

    // Create cards in the database
    const cardsToInsert = flashcardsData.flashcards.map((card: any, index: number) => {
      const isMultipleChoice = card.type === 'multiple_choice' && card.options?.length >= 2

      return {
        deck_id: upload.deck_id,
        question: card.question,
        answer: card.answer,
        card_type: isMultipleChoice ? 'multiple_choice' : 'flashcard',
        options: isMultipleChoice ? card.options : null,
        correct_option_index: isMultipleChoice ? 0 : null,
        tags: Array.isArray(card.tags) ? card.tags : null,
        position: index,
        difficulty: 3,
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

    return res.status(200).json({
      success: true,
      upload_id: uploadId,
      deck_id: upload.deck_id,
      cards_created: createdCards?.length || 0,
      cards: createdCards,
    })
  } catch (error: any) {
    console.error('=== AI Processing Failed ===')
    console.error('❌ Error:', error.message)

    // Update upload status to failed
    const { uploadId } = req.query
    if (uploadId && typeof uploadId === 'string') {
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
    }

    return res.status(500).json({
      error: error.message || 'Failed to process upload',
      details: error.toString(),
    })
  }
}
