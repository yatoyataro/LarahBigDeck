/**
 * API Routes: Study Sessions
 * 
 * POST /api/sessions/start - Start a new study session
 * PATCH /api/sessions/[sessionId]/complete - Complete a study session
 */

import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * POST - Start a new study session
 * Body: { deckId: string, mode: 'flashcard' | 'multiple_choice' | 'flagged_only' | 'mixed' }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const { deckId, mode = 'flashcard' } = body

    if (!deckId) {
      return NextResponse.json(
        { error: 'Deck ID is required' },
        { status: 400 }
      )
    }

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify deck exists and user has access
    const { data: deck, error: deckError } = await supabase
      .from('decks')
      .select('id, user_id, name')
      .eq('id', deckId)
      .eq('user_id', user.id)
      .single()

    if (deckError || !deck) {
      return NextResponse.json(
        { error: 'Deck not found or access denied' },
        { status: 404 }
      )
    }

    // Create new study session
    const { data: session, error: sessionError } = await supabase
      .from('study_sessions')
      .insert({
        user_id: user.id,
        deck_id: deckId,
        mode: mode,
        started_at: new Date().toISOString(),
        cards_studied: 0,
        cards_correct: 0,
        completed: false
      } as any)
      .select()
      .single()

    if (sessionError) {
      console.error('Error creating study session:', sessionError)
      return NextResponse.json(
        { error: 'Failed to create study session' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      session_id: (session as any).id,
      deck_id: deckId,
      deck_name: (deck as any).name,
      mode: (session as any).mode,
      started_at: (session as any).started_at
    }, { status: 201 })

  } catch (error) {
    console.error('Error in POST /api/sessions/start:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
