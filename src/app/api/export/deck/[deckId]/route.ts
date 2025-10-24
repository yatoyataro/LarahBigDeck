/**
 * API Route: Export Deck
 * GET /api/export/deck/[deckId]?format=csv|json&includeStats=true|false
 * 
 * Exports a deck with all its cards and optionally statistics as CSV or JSON file
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
    
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'json'
    const includeStats = searchParams.get('includeStats') === 'true'

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get deck with ownership verification
    const { data: deck, error: deckError } = await supabase
      .from('decks')
      .select('*')
      .eq('id', deckId)
      .eq('user_id', user.id)
      .single()

    if (deckError || !deck) {
      return NextResponse.json(
        { error: 'Deck not found or access denied' },
        { status: 404 }
      )
    }

    // Get all cards for this deck
    const { data: cards, error: cardsError } = await supabase
      .from('cards')
      .select('*')
      .eq('deck_id', deckId)
      .order('position', { ascending: true })

    if (cardsError) {
      console.error('Error fetching cards:', cardsError)
      return NextResponse.json(
        { error: 'Failed to fetch cards' },
        { status: 500 }
      )
    }

    // Get stats if requested
    let statsMap: Map<string, any> = new Map()
    if (includeStats) {
      const { data: stats, error: statsError } = await supabase
        .from('user_card_stats')
        .select('*')
        .eq('user_id', user.id)
        .in('card_id', cards?.map(c => (c as any).id) || [])

      if (!statsError && stats) {
        stats.forEach((stat: any) => {
          statsMap.set(stat.card_id, stat)
        })
      }
    }

    // Prepare export data
    const exportData = {
      deck: {
        name: (deck as any).name,
        description: (deck as any).description || '',
        created_at: (deck as any).created_at,
        exported_at: new Date().toISOString()
      },
      cards: cards?.map((card: any) => {
        const cardData: any = {
          question: card.question,
          answer: card.answer,
          card_type: card.card_type,
          tags: card.tags || []
        }

        // Add multiple choice options if present
        if (card.card_type === 'multiple_choice' && card.options) {
          try {
            const options = typeof card.options === 'string' 
              ? JSON.parse(card.options) 
              : card.options
            cardData.options = options
            cardData.correct_option_index = card.correct_option_index
          } catch (e) {
            console.error('Error parsing options:', e)
          }
        }

        // Add stats if requested
        if (includeStats) {
          const stat = statsMap.get(card.id)
          if (stat) {
            cardData.stats = {
              attempts: stat.attempts,
              correct: stat.correct,
              accuracy: stat.attempts > 0 
                ? Math.round((stat.correct / stat.attempts) * 100)
                : 0,
              flagged: stat.flagged,
              last_reviewed_at: stat.last_reviewed_at
            }
          }
        }

        return cardData
      }) || []
    }

    // Return JSON format
    if (format === 'json') {
      const fileName = `${(deck as any).name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${Date.now()}.json`
      
      return new NextResponse(JSON.stringify(exportData, null, 2), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${fileName}"`,
        },
      })
    }

    // Return CSV format
    if (format === 'csv') {
      const csvRows: string[] = []
      
      // CSV Header
      const headers = ['question', 'answer', 'card_type', 'tags']
      if (includeStats) {
        headers.push('attempts', 'correct', 'accuracy', 'flagged')
      }
      headers.push('option_1', 'option_2', 'option_3', 'option_4', 'correct_option_index')
      csvRows.push(headers.join(','))

      // CSV Rows
      exportData.cards.forEach((card: any) => {
        const row: string[] = [
          `"${(card.question || '').replace(/"/g, '""')}"`,
          `"${(card.answer || '').replace(/"/g, '""')}"`,
          card.card_type || 'flashcard',
          `"${(card.tags || []).join(';')}"`
        ]

        if (includeStats) {
          row.push(
            card.stats?.attempts?.toString() || '0',
            card.stats?.correct?.toString() || '0',
            card.stats?.accuracy?.toString() || '0',
            card.stats?.flagged ? 'true' : 'false'
          )
        }

        // Add options for multiple choice
        if (card.options && Array.isArray(card.options)) {
          for (let i = 0; i < 4; i++) {
            row.push(`"${(card.options[i] || '').replace(/"/g, '""')}"`)
          }
          row.push(card.correct_option_index?.toString() || '')
        } else {
          row.push('', '', '', '', '')
        }

        csvRows.push(row.join(','))
      })

      const csvContent = csvRows.join('\n')
      const fileName = `${(deck as any).name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${Date.now()}.csv`

      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${fileName}"`,
        },
      })
    }

    return NextResponse.json(
      { error: 'Invalid format. Use csv or json' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Error in GET /api/export/deck/[deckId]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
