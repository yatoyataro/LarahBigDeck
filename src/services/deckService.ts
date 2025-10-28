import { supabase } from '@/utils/supabase/client'

export interface Deck {
  id: string
  user_id: string
  name: string
  description: string | null
  created_at: string
  updated_at: string
}

export interface DeckWithCardCount extends Deck {
  card_count: number
}

/**
 * Fetch all decks for the current user
 */
export async function getUserDecks(): Promise<DeckWithCardCount[]> {
  try {
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      throw new Error('Not authenticated')
    }

    // Fetch decks
    const { data: decks, error: decksError } = await supabase
      .from('decks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (decksError) {
      console.error('Error fetching decks:', decksError)
      throw decksError
    }

    if (!decks || decks.length === 0) {
      return []
    }

    // Fetch card counts for each deck
    const decksWithCount: DeckWithCardCount[] = await Promise.all(
      decks.map(async (deck: any) => {
        const { count, error: countError } = await supabase
          .from('cards')
          .select('*', { count: 'exact', head: true })
          .eq('deck_id', deck.id)

        return {
          ...(deck as Deck),
          card_count: countError ? 0 : (count || 0),
        }
      })
    )

    return decksWithCount
  } catch (error) {
    console.error('Error in getUserDecks:', error)
    throw error
  }
}

/**
 * Create a new deck
 */
export async function createDeck(name: string, description?: string): Promise<Deck> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      throw new Error('Not authenticated')
    }

    const { data, error } = await supabase
      .from('decks')
      // @ts-ignore - Supabase type inference issue with insert
      .insert({
        user_id: user.id,
        name: name.trim(),
        description: description?.trim() || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating deck:', error)
      throw error
    }

    return data as Deck
  } catch (error) {
    console.error('Error in createDeck:', error)
    throw error
  }
}

/**
 * Get a single deck by ID
 */
export async function getDeck(deckId: string): Promise<Deck | null> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      throw new Error('Not authenticated')
    }

    // Don't filter by user_id - let RLS handle access control
    // This allows viewing both owned decks AND shared decks
    const { data, error } = await supabase
      .from('decks')
      .select('*')
      .eq('id', deckId)
      .maybeSingle()

    if (error) {
      console.error('Error fetching deck:', error)
      throw error
    }

    if (!data) {
      return null
    }

    return data as Deck
  } catch (error) {
    console.error('Error in getDeck:', error)
    throw error
  }
}

/**
 * Update a deck
 */
export async function updateDeck(deckId: string, updates: { name?: string; description?: string }): Promise<Deck> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      throw new Error('Not authenticated')
    }

    // @ts-ignore - Supabase type inference issue with update
    const { data, error } = await supabase
      .from('decks')
      // @ts-ignore
      .update(updates)
      .eq('id', deckId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating deck:', error)
      throw error
    }

    return data as Deck
  } catch (error) {
    console.error('Error in updateDeck:', error)
    throw error
  }
}

/**
 * Delete a deck and all associated data
 * - Deletes all cards in the deck
 * - Deletes associated upload records
 * - Deletes files from Supabase Storage
 * - Deletes the deck itself
 */
export async function deleteDeck(deckId: string): Promise<void> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      throw new Error('Not authenticated')
    }

    // First, get all upload records associated with this deck
    const { data: uploads, error: uploadsError } = await supabase
      .from('uploads')
      .select('id, file_url, file_deleted')
      .eq('deck_id', deckId)
      .eq('user_id', user.id)

    if (uploadsError) {
      console.error('Error fetching uploads:', uploadsError)
    }

    // Delete files from storage if they exist and haven't been auto-deleted
    if (uploads && uploads.length > 0) {
      for (const upload of uploads) {
        // Only attempt to delete if file hasn't been marked as deleted
        if ((upload as any).file_url && (upload as any).file_deleted !== true) {
          try {
            // Extract the file path from the URL
            // URL format: https://<project>.supabase.co/storage/v1/object/public/deck-uploads/<user_id>/<filename>
            const urlParts = (upload as any).file_url.split('deck-uploads/')
            if (urlParts.length > 1) {
              const filePath = urlParts[1]
              
              const { error: storageError } = await supabase.storage
                .from('deck-uploads')
                .remove([filePath])

              if (storageError) {
                console.error('Error deleting file from storage:', storageError)
              }
            }
          } catch (storageErr) {
            console.error('Error processing storage deletion:', storageErr)
          }
        }
      }
    }

    // Delete upload records
    if (uploads && uploads.length > 0) {
      const { error: deleteUploadsError } = await supabase
        .from('uploads')
        .delete()
        .eq('deck_id', deckId)
        .eq('user_id', user.id)

      if (deleteUploadsError) {
        console.error('Error deleting upload records:', deleteUploadsError)
      }
    }

    // Delete all cards (cascade will handle this, but being explicit)
    const { error: cardsError } = await supabase
      .from('cards')
      .delete()
      .eq('deck_id', deckId)

    if (cardsError) {
      console.error('Error deleting cards:', cardsError)
      // Continue anyway, cascade should handle it
    }

    // Finally, delete the deck
    const { error } = await supabase
      .from('decks')
      .delete()
      .eq('id', deckId)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error deleting deck:', error)
      throw error
    }
  } catch (error) {
    console.error('Error in deleteDeck:', error)
    throw error
  }
}

/**
 * Card interface matching database structure
 */
export interface Card {
  id: string
  deck_id: string
  question: string
  answer: string
  card_type: 'flashcard' | 'multiple_choice' | 'true_false'
  options: string[] | null
  correct_option_index: number | null
  tags: string[] | null
  position: number
  difficulty: number
  times_reviewed: number
  times_correct: number
  created_at: string
}

/**
 * Get all cards for a specific deck
 */
export async function getDeckCards(deckId: string): Promise<Card[]> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      throw new Error('Not authenticated')
    }

    // Don't verify ownership - let RLS handle access control
    // This allows fetching cards from both owned decks AND shared decks
    const { data: cards, error: cardsError } = await supabase
      .from('cards')
      .select('*')
      .eq('deck_id', deckId)
      .order('position', { ascending: true })

    if (cardsError) {
      console.error('Error fetching cards:', cardsError)
      throw cardsError
    }

    return (cards || []) as Card[]
  } catch (error) {
    console.error('Error in getDeckCards:', error)
    throw error
  }
}
