/**
 * DeckStatsCard Component
 * Displays deck-specific statistics during study
 */

import { useEffect, useState } from 'react'
import { getDeckStats, type DeckStatistics } from '@/services/statsService'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { 
  Target, 
  TrendingUp, 
  Flag, 
  BookOpen,
  BarChart3,
  Clock
} from 'lucide-react'

interface DeckStatsCardProps {
  deckId: string
  compact?: boolean
}

export function DeckStatsCard({ deckId, compact = false }: DeckStatsCardProps) {
  const [stats, setStats] = useState<DeckStatistics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadStats()
  }, [deckId])

  const loadStats = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getDeckStats(deckId)
      setStats(data)
    } catch (err) {
      console.error('Error loading deck stats:', err)
      setError(err instanceof Error ? err.message : 'Failed to load deck statistics')
    } finally {
      setLoading(false)
    }
  }

  // Refresh stats (can be called from parent)
  const refresh = () => {
    loadStats()
  }

  // Expose refresh method
  useEffect(() => {
    // @ts-ignore - Adding refresh to window for external access if needed
    window.refreshDeckStats = refresh
    return () => {
      // @ts-ignore
      delete window.refreshDeckStats
    }
  }, [])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="h-6 w-32 bg-muted animate-pulse rounded" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-4 w-full bg-muted animate-pulse rounded" />
            <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive text-sm">Error Loading Stats</CardTitle>
          <CardDescription className="text-xs">{error}</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (!stats) return null

  const { deck, statistics } = stats

  // Compact view for smaller displays
  if (compact) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            {deck.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Progress Bar */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Progress</span>
              <span className="text-sm text-muted-foreground">
                {statistics.completion_percentage.toFixed(0)}%
              </span>
            </div>
            <Progress value={statistics.completion_percentage} />
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-xs text-muted-foreground">Studied</p>
              <p className="text-lg font-bold">{statistics.cards_studied}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Accuracy</p>
              <p className="text-lg font-bold">{statistics.accuracy_percentage.toFixed(0)}%</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Flagged</p>
              <p className="text-lg font-bold text-yellow-600">{statistics.flagged_count}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Full view
  return (
    <div className="space-y-4">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            {deck.name}
          </CardTitle>
          <CardDescription>{deck.card_count} total cards</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Completion Progress */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Completion
                </span>
                <span className="text-sm font-medium">
                  {statistics.completion_percentage.toFixed(1)}%
                </span>
              </div>
              <Progress value={statistics.completion_percentage} className="h-3" />
              <p className="text-xs text-muted-foreground mt-1">
                {statistics.cards_studied} of {statistics.total_cards} cards studied
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              {/* Accuracy */}
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <TrendingUp className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {statistics.accuracy_percentage.toFixed(1)}%
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {statistics.total_correct}/{statistics.total_attempts} correct
                  </p>
                </div>
              </div>

              {/* Flagged Cards */}
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-yellow-500/10">
                  <Flag className="h-4 w-4 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{statistics.flagged_count}</p>
                  <p className="text-xs text-muted-foreground">Cards flagged</p>
                </div>
              </div>

              {/* Sessions */}
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Clock className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{statistics.session_count}</p>
                  <p className="text-xs text-muted-foreground">Study sessions</p>
                </div>
              </div>

              {/* Last Studied */}
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <BarChart3 className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {statistics.last_studied_at
                      ? new Date(statistics.last_studied_at).toLocaleDateString()
                      : 'Not studied'}
                  </p>
                  <p className="text-xs text-muted-foreground">Last studied</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Flagged Cards */}
      {stats.flagged_cards.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Flag className="h-5 w-5 text-yellow-600" />
              Flagged Cards ({stats.flagged_cards.length})
            </CardTitle>
            <CardDescription>Cards that need extra attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {stats.flagged_cards.map((card) => (
                <div
                  key={card.card_id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{card.question}</p>
                    <p className="text-xs text-muted-foreground">
                      Last reviewed: {card.last_reviewed 
                        ? new Date(card.last_reviewed).toLocaleDateString()
                        : 'Never'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    <Badge variant={card.accuracy < 50 ? 'destructive' : 'secondary'}>
                      {card.accuracy.toFixed(0)}%
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {card.attempts} attempts
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Sessions */}
      {stats.recent_sessions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Sessions
            </CardTitle>
            <CardDescription>Latest study sessions for this deck</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.recent_sessions.slice(0, 5).map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {session.mode}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(session.started_at).toLocaleDateString()} at{' '}
                        {new Date(session.started_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                  <div className="text-right ml-2">
                    <p className="text-sm font-medium">
                      {session.cards_correct}/{session.cards_studied}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {session.accuracy.toFixed(0)}% • {session.duration_minutes}min
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
