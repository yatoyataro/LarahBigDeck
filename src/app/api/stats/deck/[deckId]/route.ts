/**
 * API Route: Get Deck Statistics
 * GET /api/stats/deck/[deckId]
 * 
 * Returns aggregated statistics for a specific deck including:
 * - Total cards and cards studied
 * - Flagged cards count
 * - Overall accuracy percentage
 * - Session count and last studied date
 */

import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ deckId: string }> }
) {
  try {
    const { deckId } = await params
    const supabase = await createClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify deck ownership
    const { data: deck, error: deckError } = await supabase
      .from('decks')
      .select('id, user_id, name, card_count')
      .eq('id', deckId)
      .eq('user_id', user.id)
      .single()

    if (deckError || !deck) {
      return NextResponse.json(
        { error: 'Deck not found or access denied' },
        { status: 404 }
      )
    }

    // Get deck statistics from the view
    const { data: stats, error: statsError } = await supabase
      .from('deck_statistics' as any)
      .select('*')
      .eq('deck_id', deckId)
      .eq('user_id', user.id)
      .single()

    if (statsError) {
      console.error('Error fetching deck statistics:', statsError)
      return NextResponse.json(
        { error: 'Failed to fetch statistics' },
        { status: 500 }
      )
    }

    // Get cards for this deck
    const { data: deckCardIds } = await supabase
      .from('cards')
      .select('id')
      .eq('deck_id', deckId)

    const cardIds = deckCardIds?.map(c => (c as any).id) || []

    // Get flagged cards details
    const { data: flaggedCards, error: flaggedError } = await supabase
      .from('user_card_stats')
      .select(`
        card_id,
        attempts,
        correct,
        last_reviewed_at,
        cards (
          question,
          answer,
          card_type
        )
      `)
      .eq('user_id', user.id)
      .eq('flagged', true)
      .in('card_id', cardIds)

    if (flaggedError) {
      console.error('Error fetching flagged cards:', flaggedError)
    }

    // Get recent study sessions
    const { data: recentSessions, error: sessionsError } = await supabase
      .from('study_sessions')
      .select('*')
      .eq('deck_id', deckId)
      .eq('user_id', user.id)
      .order('started_at', { ascending: false })
      .limit(10)

    if (sessionsError) {
      console.error('Error fetching recent sessions:', sessionsError)
    }

    // Calculate additional metrics
    const response = {
      deck: {
        id: (deck as any).id,
        name: (deck as any).name,
        card_count: (deck as any).card_count
      },
      statistics: {
        total_cards: (stats as any)?.card_count || 0,
        cards_studied: (stats as any)?.cards_studied || 0,
        cards_unstudied: ((stats as any)?.card_count || 0) - ((stats as any)?.cards_studied || 0),
        flagged_count: (stats as any)?.flagged_count || 0,
        total_attempts: (stats as any)?.total_attempts || 0,
        total_correct: (stats as any)?.total_correct || 0,
        accuracy_percentage: (stats as any)?.accuracy_percentage || 0,
        session_count: (stats as any)?.session_count || 0,
        last_studied_at: (stats as any)?.last_studied_at || null,
        completion_percentage: (deck as any).card_count > 0 
          ? Math.round((((stats as any)?.cards_studied || 0) / (deck as any).card_count) * 100)
          : 0
      },
      flagged_cards: flaggedCards?.map(fc => ({
        card_id: (fc as any).card_id,
        question: (fc as any).cards?.question || '',
        attempts: (fc as any).attempts,
        correct: (fc as any).correct,
        accuracy: (fc as any).attempts > 0 ? Math.round(((fc as any).correct / (fc as any).attempts) * 100) : 0,
        last_reviewed: (fc as any).last_reviewed_at
      })) || [],
      recent_sessions: recentSessions?.map(session => ({
        id: (session as any).id,
        mode: (session as any).mode,
        started_at: (session as any).started_at,
        completed_at: (session as any).completed_at,
        cards_studied: (session as any).cards_studied,
        cards_correct: (session as any).cards_correct,
        accuracy: (session as any).cards_studied > 0 
          ? Math.round(((session as any).cards_correct / (session as any).cards_studied) * 100)
          : 0,
        duration_minutes: (session as any).duration_seconds 
          ? Math.round((session as any).duration_seconds / 60)
          : null
      })) || []
    }

    return NextResponse.json(response, { status: 200 })

  } catch (error) {
    console.error('Error in GET /api/stats/deck/[deckId]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
