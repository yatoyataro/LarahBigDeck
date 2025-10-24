/**
 * UserStatsOverview Component
 * Displays comprehensive user statistics on the Dashboard
 */

import { useEffect, useState } from 'react'
import { getUserStats, type UserStatistics } from '@/services/statsService'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { 
  BookOpen, 
  Target, 
  TrendingUp, 
  Clock, 
  Flame, 
  Flag,
  Calendar,
  BarChart
} from 'lucide-react'

export function UserStatsOverview() {
  const [stats, setStats] = useState<UserStatistics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getUserStats()
      setStats(data)
    } catch (err) {
      console.error('Error loading user stats:', err)
      setError(err instanceof Error ? err.message : 'Failed to load statistics')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-3 sm:h-4 w-20 sm:w-24 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-6 sm:h-8 w-12 sm:w-16 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive text-sm sm:text-base">Error Loading Statistics</CardTitle>
          <CardDescription className="text-xs sm:text-sm">{error}</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (!stats) return null

  const { overview, performance } = stats

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Main Stats Grid */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Decks */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Decks</CardTitle>
            <BookOpen className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{overview.total_decks}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              {overview.total_cards} total cards
            </p>
          </CardContent>
        </Card>

        {/* Study Progress */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Study Progress</CardTitle>
            <Target className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">
              {overview.study_progress_percentage.toFixed(1)}%
            </div>
            <Progress value={overview.study_progress_percentage} className="mt-2" />
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-2">
              {overview.cards_studied} of {overview.total_cards} cards studied
            </p>
          </CardContent>
        </Card>

        {/* Accuracy */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Overall Accuracy</CardTitle>
            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">
              {performance.overall_accuracy.toFixed(1)}%
            </div>
            <Progress 
              value={performance.overall_accuracy} 
              className="mt-2"
            />
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-2">
              {performance.total_correct} of {performance.total_attempts} correct
            </p>
          </CardContent>
        </Card>

        {/* Best Streak */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Best Streak</CardTitle>
            <Flame className="h-3 w-3 sm:h-4 sm:w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{performance.best_streak}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              Avg streak: {performance.average_current_streak.toFixed(1)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        {/* Study Time */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Study Time</CardTitle>
            <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">
              {overview.total_study_hours.toFixed(1)}h
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              {overview.total_sessions} sessions
            </p>
          </CardContent>
        </Card>

        {/* Flagged Cards */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Flagged Cards</CardTitle>
            <Flag className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{overview.flagged_cards}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              Cards needing review
            </p>
          </CardContent>
        </Card>

        {/* Active Days */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Active Days</CardTitle>
            <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{overview.days_active_last_30}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              Last 30 days
            </p>
          </CardContent>
        </Card>

        {/* Last Activity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Last Activity</CardTitle>
            <BarChart className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xs sm:text-sm font-medium">
              {overview.last_activity 
                ? new Date(overview.last_activity).toLocaleDateString()
                : 'No activity yet'}
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              {overview.last_activity 
                ? new Date(overview.last_activity).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })
                : 'Start studying!'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Flagged Cards & Recent Sessions */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 lg:grid-cols-2">
        {/* Flagged Cards List */}
        {stats.flagged_cards.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Flag className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />
                Flagged Cards ({stats.flagged_cards.length})
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">Cards that need extra attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {stats.flagged_cards.slice(0, 10).map((card) => (
                  <div 
                    key={card.card_id}
                    className="flex items-center justify-between p-2 sm:p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0 pr-2">
                      <p className="text-xs sm:text-sm font-medium truncate">{card.question}</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{card.deck_name}</p>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                      <Badge variant={card.accuracy < 50 ? 'destructive' : 'secondary'} className="text-[10px] sm:text-xs px-1.5 sm:px-2">
                        {card.accuracy.toFixed(0)}%
                      </Badge>
                      <span className="text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap hidden xs:inline">
                        {card.attempts} tries
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
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
                Recent Sessions
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">Your latest study sessions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {stats.recent_sessions.slice(0, 5).map((session) => (
                  <div 
                    key={session.session_id}
                    className="flex items-center justify-between p-2 sm:p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0 pr-2">
                      <p className="text-xs sm:text-sm font-medium truncate">{session.deck_name}</p>
                      <div className="flex items-center gap-1 sm:gap-2 mt-1 flex-wrap">
                        <Badge variant="outline" className="text-[10px] sm:text-xs">
                          {session.mode}
                        </Badge>
                        <span className="text-[10px] sm:text-xs text-muted-foreground">
                          {new Date(session.started_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs sm:text-sm font-medium">
                        {session.cards_correct}/{session.cards_studied}
                      </p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap">
                        {session.accuracy.toFixed(0)}% • {session.duration_minutes}m
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
