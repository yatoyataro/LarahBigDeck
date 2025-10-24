import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import { GoogleGenAI } from '@google/genai'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const geminiApiKey = process.env.GOOGLE_GEMINI_API_KEY!

// Server-side Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Initialize Gemini
const genAI = new GoogleGenAI({ apiKey: geminiApiKey })

/**
 * Process pasted notes with Gemini AI
 * POST /api/upload/process-notes
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  console.log('=== Process Notes Handler Called ===')
  console.log('Method:', req.method)

  // Handle OPTIONS request for CORS preflight
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request')
    return res.status(200).end()
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    console.log('Method not allowed:', req.method)
    return res.status(405).json({ error: `Method ${req.method} not allowed. Use POST.` })
  }

  console.log('POST request accepted, starting processing...')

  try {
    const { notes, deckName, deckDescription } = req.body

    if (!notes || typeof notes !== 'string') {
      return res.status(400).json({ error: 'Notes content is required' })
    }

    if (!deckName || typeof deckName !== 'string') {
      return res.status(400).json({ error: 'Deck name is required' })
    }

    if (notes.trim().length < 50) {
      return res.status(400).json({ error: 'Notes must be at least 50 characters long' })
    }

    console.log('=== AI Processing Started ===')
    console.log('Deck Name:', deckName)
    console.log('Notes length:', notes.length, 'characters')

    // Get user from session - In a real app, you'd extract this from auth headers
    // For now, we'll need to receive user_id in the request
    // Since we're using client-side Supabase auth, we need to get the user
    const authHeader = req.headers.authorization
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization required' })
    }

    // Verify the JWT token
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      console.error('Auth error:', authError)
      return res.status(401).json({ error: 'Invalid authentication token' })
    }

    console.log('User authenticated:', user.id)

    // Create the deck first
    const { data: deck, error: deckError } = await supabase
      .from('decks')
      .insert({
        user_id: user.id,
        name: deckName.trim(),
        description: deckDescription?.trim() || null,
      })
      .select()
      .single()

    if (deckError || !deck) {
      console.error('Deck creation error:', deckError)
      throw new Error('Failed to create deck')
    }

    console.log('Deck created:', deck.id)

    // Prepare the prompt for Gemini
    const prompt = `You are an expert at creating educational multiple choice questions from text content. 

Analyze the provided notes and create comprehensive multiple choice questions that cover the main concepts, definitions, and important information.

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
- Ensure to not make the right answer too obvious like the longest or most detailed option

Remember: ALL questions must be multiple choice format with exactly 4 options, with the correct answer ALWAYS in the first position.

Here are the notes to analyze:

${notes}`

    console.log('Calling Gemini API...')
    console.log('Model: gemini-2.5-flash')

    // Call Gemini API using the new @google/genai SDK
    const result = await genAI.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    })

    console.log('✅ Gemini API response received')
    const text = result.text
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

    // Create cards in the database
    const cardsToInsert = flashcardsData.flashcards.map((card: any, index: number) => {
      const isMultipleChoice = card.type === 'multiple_choice' && card.options?.length >= 2

      return {
        deck_id: deck.id,
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
    console.log('=== AI Processing Completed Successfully ===')

    return res.status(200).json({
      success: true,
      deck_id: deck.id,
      cards_created: createdCards?.length || 0,
      cards: createdCards,
    })
  } catch (error: any) {
    console.error('=== AI Processing Failed ===')
    console.error('❌ Error:', error.message)

    return res.status(500).json({
      error: error.message || 'Failed to process notes',
      details: error.toString(),
    })
  }
}
