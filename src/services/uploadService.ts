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
 */
export async function processUploadWithAI(uploadId: string) {
  try {
    const response = await fetch(`http://localhost:3001/api/upload/${uploadId}/process`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to process upload')
    }

    return response.json()
  } catch (error) {
    console.error('Error processing upload with AI:', error)
    throw error
  }
}
