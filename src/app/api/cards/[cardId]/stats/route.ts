/**
 * API Routes: Card Statistics and Flagging
 * 
 * GET /api/cards/[cardId]/stats - Get statistics for a specific card
 * POST /api/cards/[cardId]/stats - Update card statistics after interaction
 * PATCH /api/cards/[cardId]/flag - Toggle flag status for a card
 */

import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET - Fetch card statistics for the authenticated user
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ cardId: string }> }
) {
  try {
    const { cardId } = await params
    const supabase = await createClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify card exists and user has access to its deck
    const { data: card, error: cardError } = await supabase
      .from('cards')
      .select(`
        id,
        question,
        answer,
        card_type,
        deck_id,
        decks (
          user_id
        )
      `)
      .eq('id', cardId)
      .single()

    if (cardError || !card || (card as any).decks?.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Card not found or access denied' },
        { status: 404 }
      )
    }

    // Get or create user card stats
    const { data: stats, error: statsError } = await supabase
      .from('user_card_stats')
      .select('*')
      .eq('user_id', user.id)
      .eq('card_id', cardId)
      .single()

    if (statsError && statsError.code !== 'PGRST116') {
      console.error('Error fetching card stats:', statsError)
      return NextResponse.json(
        { error: 'Failed to fetch statistics' },
        { status: 500 }
      )
    }

    // If stats don't exist, return empty stats
    const response = stats ? {
      card_id: cardId,
      attempts: (stats as any).attempts,
      correct: (stats as any).correct,
      accuracy: (stats as any).attempts > 0 
        ? Math.round(((stats as any).correct / (stats as any).attempts) * 100)
        : 0,
      flagged: (stats as any).flagged,
      last_reviewed_at: (stats as any).last_reviewed_at,
      current_streak: (stats as any).current_streak,
      best_streak: (stats as any).best_streak,
      ease_factor: (stats as any).ease_factor,
      interval_days: (stats as any).interval_days
    } : {
      card_id: cardId,
      attempts: 0,
      correct: 0,
      accuracy: 0,
      flagged: false,
      last_reviewed_at: null,
      current_streak: 0,
      best_streak: 0,
      ease_factor: 2.5,
      interval_days: 1
    }

    return NextResponse.json(response, { status: 200 })

  } catch (error) {
    console.error('Error in GET /api/cards/[cardId]/stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST - Update card statistics after user interaction
 * Body: { correct: boolean, sessionId?: string, responseTime?: number, interactionType: 'flip' | 'multiple_choice', selectedOptionIndex?: number }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ cardId: string }> }
) {
  try {
    const { cardId } = await params
    const supabase = await createClient()
    const body = await request.json()

    const {
      correct,
      sessionId,
      responseTime,
      interactionType = 'flip',
      selectedOptionIndex
    } = body

    if (typeof correct !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid request: correct must be a boolean' },
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

    // Verify card exists and user has access
    const { data: card, error: cardError } = await supabase
      .from('cards')
      .select(`
        id,
        deck_id,
        decks (
          user_id
        )
      `)
      .eq('id', cardId)
      .single()

    if (cardError || !card || (card as any).decks?.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Card not found or access denied' },
        { status: 404 }
      )
    }

    // Get or create card stats
    let { data: stats, error: statsError } = await supabase
      .from('user_card_stats')
      .select('*')
      .eq('user_id', user.id)
      .eq('card_id', cardId)
      .single()

    // If stats don't exist, create them
    if (statsError && statsError.code === 'PGRST116') {
      const { data: newStats, error: createError } = await supabase
        .from('user_card_stats')
        .insert({
          user_id: user.id,
          card_id: cardId,
          attempts: 0,
          correct: 0,
          flagged: false
        } as any)
        .select()
        .single()

      if (createError) {
        console.error('Error creating card stats:', createError)
        return NextResponse.json(
          { error: 'Failed to create statistics' },
          { status: 500 }
        )
      }
      stats = newStats
    }

    // Calculate new streak
    const currentStreak = correct ? ((stats as any).current_streak + 1) : 0
    const bestStreak = Math.max((stats as any).best_streak, currentStreak)

    // Update stats
    const { data: updatedStats, error: updateError } = await supabase
      .from('user_card_stats')
      // @ts-ignore - Supabase generated types don't properly infer update parameter types
      .update({
        attempts: (stats as any).attempts + 1,
        correct: (stats as any).correct + (correct ? 1 : 0),
        last_reviewed_at: new Date().toISOString(),
        current_streak: currentStreak,
        best_streak: bestStreak
      })
      .eq('user_id', user.id)
      .eq('card_id', cardId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating card stats:', updateError)
      return NextResponse.json(
        { error: 'Failed to update statistics' },
        { status: 500 }
      )
    }

    // Record the interaction
    const { error: interactionError } = await supabase
      .from('card_interactions')
      .insert({
        user_id: user.id,
        card_id: cardId,
        session_id: sessionId || null,
        interaction_type: interactionType,
        correct,
        response_time_seconds: responseTime || null,
        selected_option_index: selectedOptionIndex || null
      } as any)

    if (interactionError) {
      console.error('Error recording interaction:', interactionError)
      // Don't fail the request if interaction recording fails
    }

    // Update session stats if sessionId provided
    if (sessionId) {
      const { error: sessionError } = await supabase
        .from('study_sessions')
        // @ts-ignore - Supabase generated types don't properly infer update parameter types
        .update({
          cards_studied: (stats as any).attempts + 1,
          cards_correct: (stats as any).correct + (correct ? 1 : 0)
        })
        .eq('id', sessionId)
        .eq('user_id', user.id)

      if (sessionError) {
        console.error('Error updating session:', sessionError)
        // Don't fail the request
      }
    }

    return NextResponse.json({
      card_id: cardId,
      attempts: (updatedStats as any).attempts,
      correct: (updatedStats as any).correct,
      accuracy: (updatedStats as any).attempts > 0 
        ? Math.round(((updatedStats as any).correct / (updatedStats as any).attempts) * 100)
        : 0,
      current_streak: (updatedStats as any).current_streak,
      best_streak: (updatedStats as any).best_streak
    }, { status: 200 })

  } catch (error) {
    console.error('Error in POST /api/cards/[cardId]/stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH - Toggle flag status for a card
 * Body: { flagged: boolean }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ cardId: string }> }
) {
  try {
    const { cardId } = await params
    const supabase = await createClient()
    const body = await request.json()

    const { flagged } = body

    if (typeof flagged !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid request: flagged must be a boolean' },
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

    // Verify card exists and user has access
    const { data: card, error: cardError } = await supabase
      .from('cards')
      .select(`
        id,
        deck_id,
        decks (
          user_id
        )
      `)
      .eq('id', cardId)
      .single()

    if (cardError || !card || (card as any).decks?.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Card not found or access denied' },
        { status: 404 }
      )
    }

    // Get or create card stats
    let { data: stats, error: statsError } = await supabase
      .from('user_card_stats')
      .select('*')
      .eq('user_id', user.id)
      .eq('card_id', cardId)
      .single()

    // If stats don't exist, create them
    if (statsError && statsError.code === 'PGRST116') {
      const { data: newStats, error: createError } = await supabase
        .from('user_card_stats')
        .insert({
          user_id: user.id,
          card_id: cardId,
          attempts: 0,
          correct: 0,
          flagged: flagged
        } as any)
        .select()
        .single()

      if (createError) {
        console.error('Error creating card stats:', createError)
        return NextResponse.json(
          { error: 'Failed to create statistics' },
          { status: 500 }
        )
      }
      stats = newStats
    } else {
      // Update existing stats
      const { data: updatedStats, error: updateError } = await supabase
        .from('user_card_stats')
        // @ts-ignore - Supabase generated types don't properly infer update parameter types
        .update({
          flagged: flagged,
          flagged_at: flagged ? new Date().toISOString() : null
        })
        .eq('user_id', user.id)
        .eq('card_id', cardId)
        .select()
        .single()

      if (updateError) {
        console.error('Error updating flag status:', updateError)
        return NextResponse.json(
          { error: 'Failed to update flag status' },
          { status: 500 }
        )
      }
      stats = updatedStats
    }

    // Record the flag/unflag interaction
    const { error: interactionError } = await supabase
      .from('card_interactions')
      .insert({
        user_id: user.id,
        card_id: cardId,
        interaction_type: flagged ? 'flag' : 'unflag',
        correct: null
      } as any)

    if (interactionError) {
      console.error('Error recording flag interaction:', interactionError)
      // Don't fail the request
    }

    return NextResponse.json({
      card_id: cardId,
      flagged: (stats as any).flagged,
      flagged_at: (stats as any).flagged_at
    }, { status: 200 })

  } catch (error) {
    console.error('Error in PATCH /api/cards/[cardId]/flag:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
