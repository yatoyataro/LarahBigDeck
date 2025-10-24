/**
 * API Route: Get User Overall Statistics
 * GET /api/stats/user
 * 
 * Returns aggregated statistics for the authenticated user including:
 * - Total decks and cards
 * - Overall study progress
 * - Accuracy and streaks
 * - Recent activity
 */

import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get total decks
    const { count: totalDecks } = await supabase
      .from('decks')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    // Get total cards across all decks
    const { data: userDecks } = await supabase
      .from('decks')
      .select('id')
      .eq('user_id', user.id)

    const deckIds = userDecks?.map(d => (d as any).id) || []

    const { count: totalCards } = await supabase
      .from('cards')
      .select('*', { count: 'exact', head: true })
      .in('deck_id', deckIds)

    // Get all user card stats
    const { data: allCardStats } = await supabase
      .from('user_card_stats')
      .select('*')
      .eq('user_id', user.id)

    // Calculate overall statistics
    const cardsStudied = allCardStats?.length || 0
    const totalAttempts = allCardStats?.reduce((sum, stat) => sum + ((stat as any).attempts || 0), 0) || 0
    const totalCorrect = allCardStats?.reduce((sum, stat) => sum + ((stat as any).correct || 0), 0) || 0
    const flaggedCount = allCardStats?.filter(stat => (stat as any).flagged).length || 0
    const bestStreak = allCardStats?.reduce((max, stat) => Math.max(max, (stat as any).best_streak || 0), 0) || 0
    
    // Calculate current active streak (cards with current_streak > 0)
    const currentStreaks = allCardStats?.map(stat => (stat as any).current_streak || 0) || []
    const averageCurrentStreak = currentStreaks.length > 0 
      ? Math.round(currentStreaks.reduce((sum, s) => sum + s, 0) / currentStreaks.length) 
      : 0

    // Get total study sessions
    const { count: totalSessions } = await supabase
      .from('study_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .not('completed_at', 'is', null)

    // Get recent sessions
    const { data: recentSessions } = await supabase
      .from('study_sessions')
      .select(`
        id,
        deck_id,
        mode,
        started_at,
        completed_at,
        cards_studied,
        cards_correct,
        duration_seconds,
        decks (
          name
        )
      `)
      .eq('user_id', user.id)
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false })
      .limit(10)

    // Calculate total study time
    const { data: allSessions } = await supabase
      .from('study_sessions')
      .select('duration_seconds')
      .eq('user_id', user.id)
      .not('duration_seconds', 'is', null)

    const totalStudySeconds = allSessions?.reduce((sum, s) => sum + ((s as any).duration_seconds || 0), 0) || 0
    const totalStudyHours = Math.round((totalStudySeconds / 3600) * 10) / 10

    // Get flagged cards details
    const { data: flaggedCards } = await supabase
      .from('user_card_stats')
      .select(`
        card_id,
        attempts,
        correct,
        last_reviewed_at,
        cards (
          question,
          answer,
          card_type,
          deck_id,
          decks (
            name
          )
        )
      `)
      .eq('user_id', user.id)
      .eq('flagged', true)
      .order('last_reviewed_at', { ascending: false })
      .limit(20)

    // Get last activity date
    const lastReviewed = allCardStats?.reduce((latest: string | null, stat) => {
      const reviewedAt = (stat as any).last_reviewed_at
      if (!reviewedAt) return latest
      if (!latest) return reviewedAt
      return reviewedAt > latest ? reviewedAt : latest
    }, null)

    // Calculate study streak (days with activity in last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: recentActivity } = await supabase
      .from('study_sessions')
      .select('completed_at')
      .eq('user_id', user.id)
      .not('completed_at', 'is', null)
      .gte('completed_at', thirtyDaysAgo.toISOString())
      .order('completed_at', { ascending: false })

    // Count unique study days
    const studyDays = new Set(
      recentActivity?.map(s => new Date((s as any).completed_at).toDateString()) || []
    )

    const response = {
      overview: {
        total_decks: totalDecks || 0,
        total_cards: totalCards || 0,
        cards_studied: cardsStudied,
        cards_unstudied: (totalCards || 0) - cardsStudied,
        study_progress_percentage: totalCards && totalCards > 0
          ? Math.round((cardsStudied / totalCards) * 100)
          : 0,
        flagged_cards: flaggedCount,
        total_sessions: totalSessions || 0,
        total_study_hours: totalStudyHours,
        last_activity: lastReviewed,
        days_active_last_30: studyDays.size
      },
      performance: {
        total_attempts: totalAttempts,
        total_correct: totalCorrect,
        overall_accuracy: totalAttempts > 0 
          ? Math.round((totalCorrect / totalAttempts) * 100)
          : 0,
        best_streak: bestStreak,
        average_current_streak: averageCurrentStreak
      },
      flagged_cards: flaggedCards?.map(fc => ({
        card_id: (fc as any).card_id,
        question: (fc as any).cards?.question || '',
        deck_name: (fc as any).cards?.decks?.name || '',
        deck_id: (fc as any).cards?.deck_id,
        attempts: (fc as any).attempts,
        correct: (fc as any).correct,
        accuracy: (fc as any).attempts > 0 
          ? Math.round(((fc as any).correct / (fc as any).attempts) * 100)
          : 0,
        last_reviewed: (fc as any).last_reviewed_at
      })) || [],
      recent_sessions: recentSessions?.map(session => ({
        id: (session as any).id,
        deck_id: (session as any).deck_id,
        deck_name: (session as any).decks?.name || 'Unknown Deck',
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
    console.error('Error in GET /api/stats/user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
