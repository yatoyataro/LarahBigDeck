import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

/**
 * GET /api/decks/[deckId]/cards
 * Fetch all cards for a specific deck
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ deckId: string }> }
) {
  try {
    const supabase = await createClient()
    const { deckId } = await params

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

    // Verify deck ownership
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

    // Fetch cards
    const { data: cards, error } = await supabase
      .from('cards')
      .select('*')
      .eq('deck_id', deckId)
      .order('position', { ascending: true })

    if (error) {
      console.error('Error fetching cards:', error)
      return NextResponse.json(
        { error: 'Database error', message: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ cards }, { status: 200 })
  } catch (error) {
    console.error('Unexpected error in GET /api/decks/[deckId]/cards:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/decks/[deckId]/cards
 * Create a new card in a deck
 * 
 * Body: {
 *   question: string,
 *   answer: string,
 *   card_type?: 'flashcard' | 'multiple_choice' | 'true_false',
 *   options?: string[],
 *   correct_option_index?: number,
 *   tags?: string[]
 * }
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ deckId: string }> }
) {
  try {
    const supabase = await createClient()
    const { deckId } = await params

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

    // Verify deck ownership
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

    // Parse request body
    const body = await request.json()
    const {
      question,
      answer,
      card_type = 'flashcard',
      options,
      correct_option_index,
      tags,
    } = body

    // Validate required fields
    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      return NextResponse.json(
        { error: 'Validation error', message: 'Question is required' },
        { status: 400 }
      )
    }

    if (!answer || typeof answer !== 'string' || answer.trim().length === 0) {
      return NextResponse.json(
        { error: 'Validation error', message: 'Answer is required' },
        { status: 400 }
      )
    }

    // Validate card type
    const validCardTypes = ['flashcard', 'multiple_choice', 'true_false']
    if (!validCardTypes.includes(card_type)) {
      return NextResponse.json(
        { error: 'Validation error', message: 'Invalid card type' },
        { status: 400 }
      )
    }

    // Validate multiple choice specific fields
    if (card_type === 'multiple_choice') {
      if (!Array.isArray(options) || options.length < 2) {
        return NextResponse.json(
          { error: 'Validation error', message: 'Multiple choice cards require at least 2 options' },
          { status: 400 }
        )
      }
      if (
        typeof correct_option_index !== 'number' ||
        correct_option_index < 0 ||
        correct_option_index >= options.length
      ) {
        return NextResponse.json(
          { error: 'Validation error', message: 'Invalid correct_option_index' },
          { status: 400 }
        )
      }
    }

    // Get the current max position for this deck
    const { data: maxPositionData } = await supabase
      .from('cards')
      .select('position')
      .eq('deck_id', deckId)
      .order('position', { ascending: false })
      .limit(1)
      .single()

    const nextPosition = maxPositionData ? (maxPositionData as any).position + 1 : 0

    // Create card
    const { data: card, error } = await supabase
      .from('cards')
      .insert({
        deck_id: deckId,
        question: question.trim(),
        answer: answer.trim(),
        card_type,
        options: options || null,
        correct_option_index: correct_option_index ?? null,
        tags: tags || null,
        position: nextPosition,
      } as any)
      .select()
      .single()

    if (error) {
      console.error('Error creating card:', error)
      return NextResponse.json(
        { error: 'Database error', message: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ card }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error in POST /api/decks/[deckId]/cards:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
