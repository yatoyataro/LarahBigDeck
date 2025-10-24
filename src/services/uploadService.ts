import { supabase } from '@/utils/supabase/client'

export interface CardInput {
  question: string
  answer: string
  card_type?: 'flashcard' | 'multiple_choice' | 'true_false'
  options?: string[]
  correct_option_index?: number
  tags?: string[]
}

export interface CreateDeckWithCardsInput {
  name: string
  description?: string
  cards: CardInput[]
}

/**
 * Create a new deck with cards manually
 */
export async function createDeckWithCards(input: CreateDeckWithCardsInput) {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      throw new Error('Not authenticated')
    }

    // Step 1: Create the deck
    // @ts-ignore - Supabase type inference issue
    const { data: deck, error: deckError } = await supabase
      .from('decks')
      // @ts-ignore
      .insert({
        // @ts-ignore
        user_id: user.id,
        name: input.name.trim(),
        description: input.description?.trim() || null,
      })
      .select()
      .single()

    if (deckError || !deck) {
      console.error('Error creating deck:', deckError)
      throw new Error(`Failed to create deck: ${deckError?.message || 'Unknown error'}`)
    }

    // Step 2: Create all cards for the deck
    if (input.cards.length > 0) {
      const cardsToInsert = input.cards.map((card, index) => ({
        deck_id: (deck as any).id,
        question: card.question.trim(),
        answer: card.answer.trim(),
        card_type: card.card_type || 'flashcard',
        options: card.options || null,
        correct_option_index: card.correct_option_index ?? null,
        tags: card.tags || null,
        position: index,
      }))

      const { error: cardsError } = await supabase
        .from('cards')
        // @ts-ignore
        .insert(cardsToInsert)

      if (cardsError) {
        console.error('Error creating cards:', cardsError)
        // Try to delete the deck if cards fail to create
        await supabase.from('decks').delete().eq('id', (deck as any).id)
        throw new Error(`Failed to create cards: ${cardsError.message}`)
      }
    }

    return { deck, cardCount: input.cards.length }
  } catch (error) {
    console.error('Error in createDeckWithCards:', error)
    throw error
  }
}

/**
 * Upload a file for processing
 */
export async function uploadFile(file: File, deckName: string, deckDescription?: string) {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      throw new Error('Not authenticated')
    }

    // Step 1: Create the deck first
    // @ts-ignore - Supabase type inference issue
    const { data: deck, error: deckError } = await supabase
      .from('decks')
      // @ts-ignore
      .insert({
        // @ts-ignore
        user_id: user.id,
        name: deckName.trim(),
        description: deckDescription?.trim() || null,
      })
      .select()
      .single()

    if (deckError || !deck) {
      console.error('Error creating deck:', deckError)
      throw new Error(`Failed to create deck: ${deckError?.message || 'Unknown error'}`)
    }

    // Step 2: Upload the file to Supabase Storage
    const timestamp = Date.now()
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const filePath = `${user.id}/${timestamp}-${sanitizedFileName}`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('deck-uploads')
      .upload(filePath, file, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      console.error('Error uploading file:', uploadError)
      // Clean up the deck if upload fails
      await supabase.from('decks').delete().eq('id', (deck as any).id)
      throw new Error(`Failed to upload file: ${uploadError.message}`)
    }

    // Step 3: Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('deck-uploads')
      .getPublicUrl(filePath)

    // Step 4: Create upload record
    const { data: upload, error: uploadRecordError } = await supabase
      .from('uploads')
      // @ts-ignore
      .insert({
        // @ts-ignore
        user_id: user.id,
        deck_id: (deck as any).id,
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
      })
      .select()
      .single()

    if (uploadRecordError) {
      console.error('Error creating upload record:', uploadRecordError)
      // Clean up on failure
      await supabase.storage.from('deck-uploads').remove([filePath])
      await supabase.from('decks').delete().eq('id', (deck as any).id)
      throw new Error(`Failed to create upload record: ${uploadRecordError.message}`)
    }

    return { deck, upload }
  } catch (error) {
    console.error('Error in uploadFile:', error)
    throw error
  }
}

/**
 * Get upload status
 */
export async function getUploadStatus(uploadId: string) {
  try {
    const { data, error } = await supabase
      .from('uploads')
      .select('*')
      .eq('id', uploadId)
      .single()

    if (error) {
      console.error('Error fetching upload status:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('Error in getUploadStatus:', error)
    throw error
  }
}

/**
 * Process uploaded file with AI to generate flashcards
 * Calls the serverless API endpoint to process the file
 */
export async function processUploadWithAI(uploadId: string) {
  try {
    // Get current origin/base URL
    // In production, this will be the Vercel domain
    // In development, it will be localhost
    const baseUrl = typeof window !== 'undefined' 
      ? window.location.origin 
      : 'http://localhost:8080'

    console.log('Processing upload with AI:', uploadId)
    console.log('API Base URL:', baseUrl)

    // Call the processing endpoint
    const response = await fetch(`${baseUrl}/api/upload/${uploadId}/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    console.log('Response status:', response.status)
    console.log('Response headers:', response.headers.get('content-type'))

    // Check if response has content before parsing
    const text = await response.text()
    console.log('Response text (first 200 chars):', text.substring(0, 200))

    if (!response.ok) {
      let errorMessage = 'Failed to process upload'
      
      try {
        const error = JSON.parse(text)
        errorMessage = error.error || error.message || errorMessage
      } catch (parseError) {
        // Response is not JSON, might be HTML error page
        console.error('Non-JSON error response:', text)
        errorMessage = `Server error (${response.status}): ${response.statusText}`
      }
      
      console.error('AI processing failed:', errorMessage)
      throw new Error(errorMessage)
    }

    let result
    try {
      result = JSON.parse(text)
    } catch (parseError) {
      console.error('Failed to parse success response as JSON:', text)
      throw new Error('Invalid response from server')
    }

    console.log('AI processing successful:', result)
    
    return result
  } catch (error) {
    console.error('Error in processUploadWithAI:', error)
    throw error
  }
}

/**
 * Process pasted notes with AI to generate flashcards
 * Calls the serverless API endpoint to process text content
 */
export async function processNotesWithAI(notes: string, deckName: string, deckDescription?: string) {
  try {
    const { data: { user, session }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user || !session) {
      throw new Error('Not authenticated')
    }

    // Get current origin/base URL
    const baseUrl = typeof window !== 'undefined' 
      ? window.location.origin 
      : 'http://localhost:8080'

    console.log('Processing notes with AI')
    console.log('API Base URL:', baseUrl)
    console.log('Notes length:', notes.length)

    // Call the processing endpoint for text notes
    const response = await fetch(`${baseUrl}/api/upload/process-notes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        notes: notes.trim(),
        deckName: deckName.trim(),
        deckDescription: deckDescription?.trim() || null,
      }),
    })

    console.log('Response status:', response.status)
    console.log('Response headers:', response.headers.get('content-type'))

    // Check if response has content before parsing
    const text = await response.text()
    console.log('Response text (first 200 chars):', text.substring(0, 200))

    if (!response.ok) {
      let errorMessage = 'Failed to process notes'
      
      try {
        const error = JSON.parse(text)
        errorMessage = error.error || error.message || errorMessage
      } catch (parseError) {
        // Response is not JSON, might be HTML error page
        console.error('Non-JSON error response:', text)
        errorMessage = `Server error (${response.status}): ${response.statusText}`
      }
      
      console.error('AI processing failed:', errorMessage)
      throw new Error(errorMessage)
    }

    let result
    try {
      result = JSON.parse(text)
    } catch (parseError) {
      console.error('Failed to parse success response as JSON:', text)
      throw new Error('Invalid response from server')
    }

    console.log('AI processing successful:', result)
    
    return result
  } catch (error) {
    console.error('Error in processNotesWithAI:', error)
    throw error
  }
}
