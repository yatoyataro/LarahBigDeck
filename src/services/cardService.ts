import { supabase } from '@/utils/supabase/client'
import { Card } from './deckService'

/**
 * Card Service
 * Handles CRUD operations for individual cards
 */

export interface CardUpdate {
  question?: string
  answer?: string
  card_type?: 'flashcard' | 'multiple_choice' | 'true_false'
  options?: string[] | null
  correct_option_index?: number | null
  tags?: string[] | null
  position?: number
  difficulty?: number
}

/**
 * Get a single card by ID
 */
export async function getCard(cardId: string): Promise<Card | null> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      throw new Error('Not authenticated')
    }

    // Fetch card and verify ownership through deck
    const { data: card, error: cardError } = await supabase
      .from('cards')
      .select(`
        *,
        decks!inner (
          id,
          user_id
        )
      `)
      .eq('id', cardId)
      .eq('decks.user_id', user.id)
      .single()

    if (cardError) {
      if (cardError.code === 'PGRST116') {
        return null
      }
      console.error('Error fetching card:', cardError)
      throw cardError
    }

    return card as unknown as Card
  } catch (error) {
    console.error('Error in getCard:', error)
    throw error
  }
}

/**
 * Update a card
 */
export async function updateCard(
  cardId: string,
  updates: CardUpdate
): Promise<Card> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      throw new Error('Not authenticated')
    }

    // First verify ownership
    const card = await getCard(cardId)
    if (!card) {
      throw new Error('Card not found or access denied')
    }

    // Update the card
    // @ts-ignore - Supabase type inference issue
    const { data, error } = await supabase
      .from('cards')
      // @ts-ignore
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', cardId)
      .select()
      .single()

    if (error) {
      console.error('Error updating card:', error)
      throw error
    }

    return data as Card
  } catch (error) {
    console.error('Error in updateCard:', error)
    throw error
  }
}

/**
 * Delete a card
 */
export async function deleteCard(cardId: string): Promise<void> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      throw new Error('Not authenticated')
    }

    // First verify ownership
    const card = await getCard(cardId)
    if (!card) {
      throw new Error('Card not found or access denied')
    }

    // Delete the card
    const { error } = await supabase
      .from('cards')
      .delete()
      .eq('id', cardId)

    if (error) {
      console.error('Error deleting card:', error)
      throw error
    }
  } catch (error) {
    console.error('Error in deleteCard:', error)
    throw error
  }
}

/**
 * Create a new card in a deck
 */
export async function createCard(
  deckId: string,
  cardData: Omit<Card, 'id' | 'deck_id' | 'created_at'>
): Promise<Card> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      throw new Error('Not authenticated')
    }

    // Verify deck ownership
    const { data: deck, error: deckError } = await supabase
      .from('decks')
      .select('id')
      .eq('id', deckId)
      .eq('user_id', user.id)
      .single()

    if (deckError || !deck) {
      throw new Error('Deck not found or access denied')
    }

    // Create the card
    // @ts-ignore - Supabase type inference issue
    const { data, error } = await supabase
      .from('cards')
      // @ts-ignore
      .insert({
        deck_id: deckId,
        ...cardData,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating card:', error)
      throw error
    }

    return data as Card
  } catch (error) {
    console.error('Error in createCard:', error)
    throw error
  }
}

/**
 * Reorder cards in a deck
 */
export async function reorderCards(
  deckId: string,
  cardOrders: { cardId: string; position: number }[]
): Promise<void> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      throw new Error('Not authenticated')
    }

    // Verify deck ownership
    const { data: deck, error: deckError } = await supabase
      .from('decks')
      .select('id')
      .eq('id', deckId)
      .eq('user_id', user.id)
      .single()

    if (deckError || !deck) {
      throw new Error('Deck not found or access denied')
    }

    // Update each card's position
    const updates = cardOrders.map(({ cardId, position }) =>
      // @ts-ignore - Supabase type inference issue
      supabase
        .from('cards')
        // @ts-ignore
        .update({ position })
        .eq('id', cardId)
        .eq('deck_id', deckId)
    )

    await Promise.all(updates)
  } catch (error) {
    console.error('Error in reorderCards:', error)
    throw error
  }
}
