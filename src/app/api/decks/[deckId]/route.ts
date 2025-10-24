import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import type { Database } from '@/types/database.types'

type DeckUpdate = Database['public']['Tables']['decks']['Update']

/**
 * GET /api/decks/[deckId]
 * Fetch a specific deck by ID
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

    // Fetch deck
    const { data: deck, error } = await supabase
      .from('decks')
      .select('*')
      .eq('id', deckId)
      .eq('user_id', user.id)
      .single()

    if (error) {
      console.error('Error fetching deck:', error)
      return NextResponse.json(
        { error: 'Not found', message: 'Deck not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ deck }, { status: 200 })
  } catch (error) {
    console.error('Unexpected error in GET /api/decks/[deckId]:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/decks/[deckId]
 * Update a deck (rename or update description)
 * 
 * Body: { name?: string, description?: string }
 */
export async function PATCH(
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

    // Parse request body
    const body = await request.json()
    const { name, description } = body

    // Build update object
    const updates: DeckUpdate = {}
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return NextResponse.json(
          { error: 'Validation error', message: 'Deck name must be a non-empty string' },
          { status: 400 }
        )
      }
      if (name.length > 255) {
        return NextResponse.json(
          { error: 'Validation error', message: 'Deck name must be 255 characters or less' },
          { status: 400 }
        )
      }
      updates.name = name.trim()
    }
    if (description !== undefined) {
      updates.description = description?.trim() || null
    }

    // Ensure there's something to update
    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'Validation error', message: 'No valid fields to update' },
        { status: 400 }
      )
    }

    // Update deck
    const { data: deck, error } = await (supabase
      .from('decks')
      // @ts-ignore - Supabase generated types don't properly infer update parameter types
      .update(updates)
      .eq('id', deckId)
      .eq('user_id', user.id)
      .select()
      .single())

    if (error) {
      console.error('Error updating deck:', error)
      return NextResponse.json(
        { error: 'Database error', message: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ deck }, { status: 200 })
  } catch (error) {
    console.error('Unexpected error in PATCH /api/decks/[deckId]:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/decks/[deckId]
 * Delete a deck and all its cards
 */
export async function DELETE(
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

    // Delete deck (cascade will delete all cards)
    const { error } = await supabase
      .from('decks')
      .delete()
      .eq('id', deckId)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error deleting deck:', error)
      return NextResponse.json(
        { error: 'Database error', message: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'Deck deleted successfully' }, { status: 200 })
  } catch (error) {
    console.error('Unexpected error in DELETE /api/decks/[deckId]:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
