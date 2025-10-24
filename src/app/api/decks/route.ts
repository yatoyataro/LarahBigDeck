import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

/**
 * GET /api/decks
 * Fetch all decks for the authenticated user
 */
export async function GET() {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be logged in to access decks' },
        { status: 401 }
      )
    }

    // Fetch user's decks
    const { data: decks, error } = await supabase
      .from('decks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching decks:', error)
      return NextResponse.json(
        { error: 'Database error', message: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ decks }, { status: 200 })
  } catch (error) {
    console.error('Unexpected error in GET /api/decks:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/decks
 * Create a new deck for the authenticated user
 * 
 * Body: { name: string, description?: string }
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be logged in to create a deck' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { name, description } = body

    // Validate input
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Validation error', message: 'Deck name is required and must be a non-empty string' },
        { status: 400 }
      )
    }

    if (name.length > 255) {
      return NextResponse.json(
        { error: 'Validation error', message: 'Deck name must be 255 characters or less' },
        { status: 400 }
      )
    }

    // Create deck
    const { data: deck, error } = await supabase
      .from('decks')
      .insert({
        user_id: user.id,
        name: name.trim(),
        description: description?.trim() || null,
      } as any)
      .select()
      .single()

    if (error) {
      console.error('Error creating deck:', error)
      return NextResponse.json(
        { error: 'Database error', message: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ deck }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error in POST /api/decks:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
