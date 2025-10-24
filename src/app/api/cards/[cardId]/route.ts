import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

/**
 * PATCH /api/cards/[cardId]
 * Update a card's study progress
 * 
 * Body: {
 *   difficulty?: number,
 *   times_reviewed?: number,
 *   times_correct?: number,
 *   last_reviewed_at?: string,
 *   next_review_at?: string
 * }
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ cardId: string }> }
) {
  try {
    const supabase = await createClient()
    const { cardId } = await params

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

    // Parse request body
    const body = await request.json()
    const {
      difficulty,
      times_reviewed,
      times_correct,
      last_reviewed_at,
      next_review_at,
    } = body

    // Build update object
    const updates: any = {}
    if (difficulty !== undefined) {
      if (typeof difficulty !== 'number' || difficulty < 0 || difficulty > 5) {
        return NextResponse.json(
          { error: 'Validation error', message: 'Difficulty must be between 0 and 5' },
          { status: 400 }
        )
      }
      updates.difficulty = difficulty
    }
    if (times_reviewed !== undefined) updates.times_reviewed = times_reviewed
    if (times_correct !== undefined) updates.times_correct = times_correct
    if (last_reviewed_at !== undefined) updates.last_reviewed_at = last_reviewed_at
    if (next_review_at !== undefined) updates.next_review_at = next_review_at

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'Validation error', message: 'No valid fields to update' },
        { status: 400 }
      )
    }

    // Update card (RLS will ensure user owns this card via deck)
    const { data: card, error } = await supabase
      .from('cards')
      // @ts-ignore - Supabase generated types don't properly infer update parameter types
      .update(updates)
      .eq('id', cardId)
      .select()
      .single()

    if (error) {
      console.error('Error updating card:', error)
      return NextResponse.json(
        { error: 'Database error', message: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ card }, { status: 200 })
  } catch (error) {
    console.error('Unexpected error in PATCH /api/cards/[cardId]:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/cards/[cardId]
 * Delete a card
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ cardId: string }> }
) {
  try {
    const supabase = await createClient()
    const { cardId } = await params

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

    // Delete card (RLS will ensure user owns this card via deck)
    const { error } = await supabase
      .from('cards')
      .delete()
      .eq('id', cardId)

    if (error) {
      console.error('Error deleting card:', error)
      return NextResponse.json(
        { error: 'Database error', message: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'Card deleted successfully' }, { status: 200 })
  } catch (error) {
    console.error('Unexpected error in DELETE /api/cards/[cardId]:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
