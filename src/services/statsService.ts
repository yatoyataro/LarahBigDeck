/**
 * Stats Service
 * Handles all API calls related to user statistics, sessions, and card interactions
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001' // Backend API URL

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
  const response = await fetch(`${API_BASE}/api/stats/deck/${deckId}`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch deck statistics')
  }

  return response.json()
}

/**
 * Get comprehensive user-level statistics
 */
export async function getUserStats(): Promise<UserStatistics> {
  const response = await fetch(`${API_BASE}/api/stats/user`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch user statistics')
  }

  return response.json()
}

/**
 * Get statistics for a specific card
 */
export async function getCardStats(cardId: string): Promise<CardStats> {
  const response = await fetch(`${API_BASE}/api/cards/${cardId}/stats`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch card statistics')
  }

  return response.json()
}

/**
 * Update card statistics after user interaction
 */
export async function updateCardStats(
  cardId: string,
  data: UpdateStatsRequest
): Promise<CardStats> {
  const response = await fetch(`${API_BASE}/api/cards/${cardId}/stats`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to update card statistics')
  }

  return response.json()
}

/**
 * Toggle flag status for a card
 */
export async function toggleCardFlag(
  cardId: string,
  flagged: boolean
): Promise<{ card_id: string; flagged: boolean; flagged_at: string | null }> {
  const response = await fetch(`${API_BASE}/api/cards/${cardId}/stats`, {
    method: 'PATCH',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ flagged }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to toggle card flag')
  }

  return response.json()
}

/**
 * Start a new study session
 */
export async function startStudySession(
  deckId: string,
  mode: 'flashcard' | 'multiple_choice' | 'flagged_only' | 'mixed' = 'flashcard'
): Promise<StudySession> {
  const response = await fetch(`${API_BASE}/api/sessions/start`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ deckId, mode }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to start study session')
  }

  return response.json()
}

/**
 * Complete a study session
 */
export async function completeStudySession(sessionId: string): Promise<SessionComplete> {
  const response = await fetch(`${API_BASE}/api/sessions/${sessionId}/complete`, {
    method: 'PATCH',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to complete study session')
  }

  return response.json()
}

/**
 * Export a deck to CSV or JSON
 */
export async function exportDeck(
  deckId: string,
  format: 'csv' | 'json' = 'json',
  includeStats: boolean = false
): Promise<Blob> {
  const url = `${API_BASE}/api/export/deck/${deckId}?format=${format}&includeStats=${includeStats}`
  
  const response = await fetch(url, {
    method: 'GET',
    credentials: 'include',
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to export deck')
  }

  return response.blob()
}

/**
 * Import a deck from file
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
  const formData = new FormData()
  formData.append('name', name)
  formData.append('file', file)
  formData.append('format', format)
  if (description) {
    formData.append('description', description)
  }

  const response = await fetch(`${API_BASE}/api/import/deck`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to import deck')
  }

  return response.json()
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
