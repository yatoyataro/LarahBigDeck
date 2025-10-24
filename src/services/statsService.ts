/**
 * Stats Service
 * Handles all API calls related to user statistics, sessions, and card interactions
 * Now calls Supabase directly instead of going through backend API
 */

import { supabase } from '@/utils/supabase/client'

export interface DeckStatistics {
  deck: {
    id: string
    name: string
    card_count: number
  }
  statistics: {
    total_cards: number
    cards_studied: number
    cards_unstudied: number
    flagged_count: number
    total_attempts: number
    total_correct: number
    accuracy_percentage: number
    session_count: number
    last_studied_at: string | null
    completion_percentage: number
  }
  flagged_cards: Array<{
    card_id: string
    question: string
    attempts: number
    correct: number
    accuracy: number
    last_reviewed: string | null
  }>
  recent_sessions: Array<{
    id: string
    mode: string
    started_at: string
    completed_at: string | null
    cards_studied: number
    cards_correct: number
    accuracy: number
    duration_minutes: number | null
  }>
}

export interface CardStats {
  card_id: string
  attempts: number
  correct: number
  accuracy: number
  flagged: boolean
  last_reviewed_at: string | null
  current_streak: number
  best_streak: number
  ease_factor: number
  interval_days: number
}

export interface UserStatistics {
  overview: {
    total_decks: number
    total_cards: number
    cards_studied: number
    cards_unstudied: number
    study_progress_percentage: number
    flagged_cards: number
    total_sessions: number
    total_study_hours: number
    last_activity: string | null
    days_active_last_30: number
  }
  performance: {
    total_attempts: number
    total_correct: number
    overall_accuracy: number
    best_streak: number
    average_current_streak: number
  }
  flagged_cards: Array<{
    card_id: string
    deck_id: string
    deck_name: string
    question: string
    attempts: number
    correct: number
    accuracy: number
    last_reviewed: string | null
  }>
  recent_sessions: Array<{
    session_id: string
    deck_id: string
    deck_name: string
    mode: string
    started_at: string
    completed_at: string | null
    cards_studied: number
    cards_correct: number
    accuracy: number
    duration_minutes: number | null
  }>
}

export interface UpdateStatsRequest {
  correct: boolean
  sessionId?: string
  responseTime?: number
  interactionType?: 'flip' | 'multiple_choice'
  selectedOptionIndex?: number
}

export interface StudySession {
  session_id: string
  deck_id: string
  deck_name: string
  mode: string
  started_at: string
}

export interface SessionComplete {
  session_id: string
  completed: boolean
  completed_at: string
  duration_seconds: number
  duration_minutes: number
  cards_studied: number
  cards_correct: number
  accuracy: number
}

/**
 * Get comprehensive statistics for a deck
 */
export async function getDeckStats(deckId: string): Promise<DeckStatistics> {
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    throw new Error('Not authenticated')
  }

  // Get deck info
  const { data: deck, error: deckError } = await supabase
    .from('decks')
    .select('id, name')
    .eq('id', deckId)
    .eq('user_id', user.id)
    .single()

  if (deckError || !deck) {
    throw new Error('Deck not found')
  }

  // Get total cards in deck
  const { count: totalCards } = await supabase
    .from('cards')
    .select('*', { count: 'exact', head: true })
    .eq('deck_id', deckId)

  // Get all card IDs in this deck
  const { data: deckCards } = await supabase
    .from('cards')
    .select('id, question')
    .eq('deck_id', deckId)

  const cardIds = (deckCards as any)?.map((c: any) => c.id) || []

  // Get card stats for these cards
  const { data: cardStats } = await supabase
    .from('user_card_stats')
    .select('*')
    .eq('user_id', user.id)
    .in('card_id', cardIds)

  const cardsStudied = (cardStats as any)?.length || 0
  const totalAttempts = (cardStats as any)?.reduce((sum: number, stat: any) => sum + (stat.attempts || 0), 0) || 0
  const totalCorrect = (cardStats as any)?.reduce((sum: number, stat: any) => sum + (stat.correct || 0), 0) || 0
  const flaggedCount = (cardStats as any)?.filter((stat: any) => stat.flagged).length || 0

  // Get sessions for this deck
  const { data: sessions, count: sessionCount } = await supabase
    .from('study_sessions')
    .select('*', { count: 'exact' })
    .eq('user_id', user.id)
    .eq('deck_id', deckId)
    .not('completed_at', 'is', null)
    .order('completed_at', { ascending: false })
    .limit(10)

  const lastStudied = (sessions as any)?.[0]?.completed_at || null

  // Map card stats with question text
  const cardStatsWithQuestions = (cardStats as any)?.map((stat: any) => {
    const card = (deckCards as any)?.find((c: any) => c.id === stat.card_id)
    return {
      ...stat,
      question: card?.question || ''
    }
  }) || []

  return {
    deck: {
      id: (deck as any).id,
      name: (deck as any).name,
      card_count: totalCards || 0
    },
    statistics: {
      total_cards: totalCards || 0,
      cards_studied: cardsStudied,
      cards_unstudied: (totalCards || 0) - cardsStudied,
      flagged_count: flaggedCount,
      total_attempts: totalAttempts,
      total_correct: totalCorrect,
      accuracy_percentage: totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0,
      session_count: sessionCount || 0,
      last_studied_at: lastStudied,
      completion_percentage: totalCards && totalCards > 0 ? Math.round((cardsStudied / totalCards) * 100) : 0
    },
    flagged_cards: cardStatsWithQuestions.filter(stat => stat.flagged).map(stat => ({
      card_id: stat.card_id,
      question: stat.question,
      attempts: stat.attempts,
      correct: stat.correct,
      accuracy: stat.attempts > 0 ? Math.round((stat.correct / stat.attempts) * 100) : 0,
      last_reviewed: stat.last_reviewed_at
    })),
    recent_sessions: (sessions as any)?.map((session: any) => ({
      id: session.id,
      mode: session.mode,
      started_at: session.started_at,
      completed_at: session.completed_at,
      cards_studied: session.cards_studied,
      cards_correct: session.cards_correct,
      accuracy: session.cards_studied > 0 ? Math.round((session.cards_correct / session.cards_studied) * 100) : 0,
      duration_minutes: session.duration_seconds ? Math.round(session.duration_seconds / 60) : null
    })) || []
  }
}

/**
 * Get comprehensive user-level statistics
 */
export async function getUserStats(): Promise<UserStatistics> {
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    throw new Error('Not authenticated')
  }

  // Get total decks
  const { count: totalDecks } = await supabase
    .from('decks')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  // Get all user's decks
  const { data: userDecks } = await supabase
    .from('decks')
    .select('id')
    .eq('user_id', user.id)

  const deckIds = (userDecks as any)?.map((d: any) => d.id) || []

  // Get total cards
  const { count: totalCards } = deckIds.length > 0
    ? await supabase
        .from('cards')
        .select('*', { count: 'exact', head: true })
        .in('deck_id', deckIds)
    : { count: 0 }

  // Get all user card stats
  const { data: allCardStats } = await supabase
    .from('user_card_stats')
    .select('*')
    .eq('user_id', user.id)

  const cardsStudied = (allCardStats as any)?.length || 0
  const totalAttempts = (allCardStats as any)?.reduce((sum: number, stat: any) => sum + (stat.attempts || 0), 0) || 0
  const totalCorrect = (allCardStats as any)?.reduce((sum: number, stat: any) => sum + (stat.correct || 0), 0) || 0
  const flaggedCount = (allCardStats as any)?.filter((stat: any) => stat.flagged).length || 0
  const bestStreak = (allCardStats as any)?.reduce((max: number, stat: any) => Math.max(max, stat.best_streak || 0), 0) || 0
  
  const currentStreaks = (allCardStats as any)?.map((stat: any) => stat.current_streak || 0) || []
  const averageCurrentStreak = currentStreaks.length > 0 
    ? Math.round(currentStreaks.reduce((sum: number, s: number) => sum + s, 0) / currentStreaks.length) 
    : 0

  // Get total study sessions
  const { count: totalSessions } = await supabase
    .from('study_sessions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .not('completed_at', 'is', null)

  // Get all sessions for study time calculation
  const { data: allSessions } = await supabase
    .from('study_sessions')
    .select('duration_seconds, completed_at')
    .eq('user_id', user.id)
    .not('duration_seconds', 'is', null)

  const totalStudySeconds = (allSessions as any)?.reduce((sum: number, s: any) => sum + (s.duration_seconds || 0), 0) || 0
  const totalStudyHours = Math.round((totalStudySeconds / 3600) * 10) / 10

  // Get last activity
  const lastReviewed = (allCardStats as any)?.reduce((latest: string | null, stat: any) => {
    const reviewedAt = stat.last_reviewed_at
    if (!reviewedAt) return latest
    if (!latest) return reviewedAt
    return reviewedAt > latest ? reviewedAt : latest
  }, null)

  // Calculate days active in last 30 days
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data: recentActivity } = await supabase
    .from('study_sessions')
    .select('completed_at')
    .eq('user_id', user.id)
    .not('completed_at', 'is', null)
    .gte('completed_at', thirtyDaysAgo.toISOString())

  const studyDays = new Set(
    (recentActivity as any)?.map((s: any) => new Date(s.completed_at!).toDateString()) || []
  )

  // Get flagged cards with details
  const flaggedCardIds = (allCardStats as any)?.filter((stat: any) => stat.flagged).map((stat: any) => stat.card_id) || []
  
  const { data: flaggedCardsDetails } = flaggedCardIds.length > 0
    ? await supabase
        .from('cards')
        .select(`
          id,
          question,
          deck_id,
          decks (
            name
          )
        `)
        .in('id', flaggedCardIds)
    : { data: [] }

  const flaggedCardsWithStats = (flaggedCardsDetails as any)?.map((card: any) => {
    const stats = (allCardStats as any)?.find((s: any) => s.card_id === card.id)
    return {
      card_id: card.id,
      deck_id: card.deck_id,
      deck_name: (card.decks as any)?.name || 'Unknown Deck',
      question: card.question,
      attempts: stats?.attempts || 0,
      correct: stats?.correct || 0,
      accuracy: stats && stats.attempts > 0 ? Math.round((stats.correct / stats.attempts) * 100) : 0,
      last_reviewed: stats?.last_reviewed_at || null
    }
  }) || []

  // Get recent sessions with deck names
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

  return {
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
    flagged_cards: flaggedCardsWithStats,
    recent_sessions: (recentSessions as any)?.map((session: any) => ({
      session_id: session.id,
      deck_id: session.deck_id,
      deck_name: (session.decks as any)?.name || 'Unknown Deck',
      mode: session.mode,
      started_at: session.started_at,
      completed_at: session.completed_at,
      cards_studied: session.cards_studied,
      cards_correct: session.cards_correct,
      accuracy: session.cards_studied > 0 
        ? Math.round((session.cards_correct / session.cards_studied) * 100)
        : 0,
      duration_minutes: session.duration_seconds 
        ? Math.round(session.duration_seconds / 60)
        : null
    })) || []
  }
}

/**
 * Get statistics for a specific card
 */
export async function getCardStats(cardId: string): Promise<CardStats> {
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    throw new Error('Not authenticated')
  }

  const { data, error } = await supabase
    .from('user_card_stats')
    .select('*')
    .eq('user_id', user.id)
    .eq('card_id', cardId)
    .maybeSingle()

  if (error) {
    throw new Error(error.message || 'Failed to fetch card statistics')
  }

  if (!data) {
    // Return default stats if no stats exist yet
    return {
      card_id: cardId,
      attempts: 0,
      correct: 0,
      accuracy: 0,
      flagged: false,
      last_reviewed_at: null,
      current_streak: 0,
      best_streak: 0,
      ease_factor: 2.5,
      interval_days: 0
    }
  }

  const cardData = data as any
  return {
    card_id: cardData.card_id,
    attempts: cardData.attempts,
    correct: cardData.correct,
    accuracy: cardData.attempts > 0 ? Math.round((cardData.correct / cardData.attempts) * 100) : 0,
    flagged: cardData.flagged,
    last_reviewed_at: cardData.last_reviewed_at,
    current_streak: cardData.current_streak,
    best_streak: cardData.best_streak,
    ease_factor: cardData.ease_factor,
    interval_days: cardData.interval_days
  }
}

/**
 * Update card statistics after user interaction
 */
export async function updateCardStats(
  cardId: string,
  data: UpdateStatsRequest
): Promise<CardStats> {
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    throw new Error('Not authenticated')
  }

  // Get existing stats
  const { data: existing } = await supabase
    .from('user_card_stats')
    .select('*')
    .eq('user_id', user.id)
    .eq('card_id', cardId)
    .maybeSingle()

  const existingData = (existing as any) || {}
  const attempts = (existingData.attempts || 0) + 1
  const correct = (existingData.correct || 0) + (data.correct ? 1 : 0)
  const currentStreak = data.correct ? (existingData.current_streak || 0) + 1 : 0
  const bestStreak = Math.max(existingData.best_streak || 0, currentStreak)

  // Calculate new ease factor (SM-2 algorithm)
  let easeFactor = existingData.ease_factor || 2.5
  if (data.correct) {
    easeFactor = Math.max(1.3, easeFactor + 0.1)
  } else {
    easeFactor = Math.max(1.3, easeFactor - 0.2)
  }

  // Calculate new interval
  let intervalDays = existingData.interval_days || 0
  if (data.correct) {
    if (currentStreak === 1) intervalDays = 1
    else if (currentStreak === 2) intervalDays = 6
    else intervalDays = Math.round((existingData.interval_days || 0) * easeFactor)
  } else {
    intervalDays = 0
  }

  const updateData = {
    user_id: user.id,
    card_id: cardId,
    attempts,
    correct,
    current_streak: currentStreak,
    best_streak: bestStreak,
    ease_factor: easeFactor,
    interval_days: intervalDays,
    last_reviewed_at: new Date().toISOString()
  }

  const { data: updated, error } = await supabase
    .from('user_card_stats')
    .upsert(updateData as any)
    .select()
    .single()

  if (error) {
    throw new Error(error.message || 'Failed to update card statistics')
  }

  const updatedData = updated as any
  return {
    card_id: updatedData.card_id,
    attempts: updatedData.attempts,
    correct: updatedData.correct,
    accuracy: updatedData.attempts > 0 ? Math.round((updatedData.correct / updatedData.attempts) * 100) : 0,
    flagged: updatedData.flagged,
    last_reviewed_at: updatedData.last_reviewed_at,
    current_streak: updatedData.current_streak,
    best_streak: updatedData.best_streak,
    ease_factor: updatedData.ease_factor,
    interval_days: updatedData.interval_days
  }
}

/**
 * Toggle flag status for a card
 */
export async function toggleCardFlag(
  cardId: string,
  flagged: boolean
): Promise<{ card_id: string; flagged: boolean; flagged_at: string | null }> {
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    throw new Error('Not authenticated')
  }

  // Get or create stats entry
  const { data: existing } = await supabase
    .from('user_card_stats')
    .select('*')
    .eq('user_id', user.id)
    .eq('card_id', cardId)
    .maybeSingle()

  const updateData = {
    user_id: user.id,
    card_id: cardId,
    flagged,
    flagged_at: flagged ? new Date().toISOString() : null,
    ...(existing || {
      attempts: 0,
      correct: 0,
      current_streak: 0,
      best_streak: 0,
      ease_factor: 2.5,
      interval_days: 0
    })
  }

  const { data: updated, error } = await supabase
    .from('user_card_stats')
    .upsert(updateData as any)
    .select()
    .single()

  if (error) {
    throw new Error(error.message || 'Failed to toggle card flag')
  }

  const updatedData = updated as any
  return {
    card_id: updatedData.card_id,
    flagged: updatedData.flagged,
    flagged_at: updatedData.flagged_at
  }
}

/**
 * Start a new study session
 */
export async function startStudySession(
  deckId: string,
  mode: 'flashcard' | 'multiple_choice' | 'flagged_only' | 'mixed' = 'flashcard'
): Promise<StudySession> {
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    throw new Error('Not authenticated')
  }

  // Get deck name
  const { data: deck } = await supabase
    .from('decks')
    .select('name')
    .eq('id', deckId)
    .single()

  const { data: session, error } = await supabase
    .from('study_sessions')
    .insert({
      user_id: user.id,
      deck_id: deckId,
      mode,
      started_at: new Date().toISOString()
    } as any)
    .select()
    .single()

  if (error) {
    throw new Error(error.message || 'Failed to start study session')
  }

  return {
    session_id: (session as any).id,
    deck_id: (session as any).deck_id,
    deck_name: (deck as any)?.name || 'Unknown Deck',
    mode: (session as any).mode,
    started_at: (session as any).started_at
  }
}

/**
 * Complete a study session
 */
export async function completeStudySession(sessionId: string): Promise<SessionComplete> {
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    throw new Error('Not authenticated')
  }

  // Get session to calculate duration
  const { data: session } = await supabase
    .from('study_sessions')
    .select('*')
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .single()

  if (!session) {
    throw new Error('Session not found')
  }

  const completedAt = new Date().toISOString()
  const sessionData = session as any
  const startedAt = new Date(sessionData.started_at)
  const durationSeconds = Math.floor((new Date(completedAt).getTime() - startedAt.getTime()) / 1000)

  const updatePayload: any = {
    completed_at: completedAt,
    duration_seconds: durationSeconds
  }
  
  const { data: updated, error } = await supabase
    .from('study_sessions')
    // @ts-expect-error Supabase type issue
    .update(updatePayload)
    .eq('id', sessionId)
    .select()
    .single()

  if (error) {
    throw new Error(error.message || 'Failed to complete study session')
  }

  const updatedData = updated as any
  return {
    session_id: updatedData.id,
    completed: true,
    completed_at: updatedData.completed_at!,
    duration_seconds: updatedData.duration_seconds || 0,
    duration_minutes: Math.round((updatedData.duration_seconds || 0) / 60),
    cards_studied: updatedData.cards_studied || 0,
    cards_correct: updatedData.cards_correct || 0,
    accuracy: updatedData.cards_studied > 0 
      ? Math.round((updatedData.cards_correct / updatedData.cards_studied) * 100)
      : 0
  }
}

/**
 * Export a deck to CSV or JSON
 * Note: This is simplified - full export would need backend processing
 */
export async function exportDeck(
  deckId: string,
  format: 'csv' | 'json' = 'json',
  includeStats: boolean = false
): Promise<Blob> {
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    throw new Error('Not authenticated')
  }

  // Get deck with cards
  const { data: deck } = await supabase
    .from('decks')
    .select(`
      *,
      cards (*)
    `)
    .eq('id', deckId)
    .eq('user_id', user.id)
    .single()

  if (!deck) {
    throw new Error('Deck not found')
  }

  let content: string
  let mimeType: string

  if (format === 'json') {
    content = JSON.stringify(deck, null, 2)
    mimeType = 'application/json'
  } else {
    // Simple CSV export
    const deckData = deck as any
    const cards = deckData.cards || []
    const rows = [
      ['Question', 'Answer', 'Type'],
      ...cards.map((card: any) => [card.question, card.answer, card.card_type])
    ]
    content = rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
    mimeType = 'text/csv'
  }

  return new Blob([content], { type: mimeType })
}

/**
 * Import a deck from file
 * Note: This is simplified - full import would need backend processing
 */
export async function importDeck(
  name: string,
  file: File,
  description?: string,
  format: 'csv' | 'json' = 'json'
): Promise<{
  success: boolean
  deck: {
    id: string
    name: string
    description: string
    card_count: number
  }
  imported: {
    total_cards: number
    inserted: number
    failed: number
  }
}> {
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    throw new Error('Not authenticated')
  }

  throw new Error('Import functionality requires backend processing. Please use the upload feature instead.')
}

/**
 * Download a blob as a file
 */
export function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.style.display = 'none'
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  window.URL.revokeObjectURL(url)
  document.body.removeChild(a)
}
