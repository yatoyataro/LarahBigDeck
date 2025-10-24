/**
 * API Route: Import Deck
 * POST /api/import/deck
 * 
 * Imports a deck from CSV or JSON file
 * Body: { name: string, description?: string, file: File (CSV or JSON), format: 'csv' | 'json' }
 */

import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

interface ImportCardData {
  question: string
  answer: string
  card_type?: 'flashcard' | 'multiple_choice' | 'true_false'
  tags?: string[]
  options?: string[]
  correct_option_index?: number
  // CSV format with separate distractor columns
  option_1?: string
  option_2?: string
  option_3?: string
  option_4?: string
}

/**
 * Parse CSV content into card data
 */
function parseCSV(csvContent: string): ImportCardData[] {
  const lines = csvContent.split('\n').filter(line => line.trim())
  if (lines.length < 2) {
    throw new Error('CSV file must contain a header row and at least one data row')
  }

  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
  const cards: ImportCardData[] = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    if (!line.trim()) continue

    // Parse CSV line handling quoted values
    const values: string[] = []
    let currentValue = ''
    let insideQuotes = false

    for (let j = 0; j < line.length; j++) {
      const char = line[j]
      
      if (char === '"') {
        if (insideQuotes && line[j + 1] === '"') {
          currentValue += '"'
          j++ // Skip next quote
        } else {
          insideQuotes = !insideQuotes
        }
      } else if (char === ',' && !insideQuotes) {
        values.push(currentValue.trim())
        currentValue = ''
      } else {
        currentValue += char
      }
    }
    values.push(currentValue.trim())

    // Map values to card data
    const card: ImportCardData = {
      question: '',
      answer: '',
      card_type: 'flashcard'
    }

    headers.forEach((header, index) => {
      const value = values[index]?.replace(/^"|"$/g, '') || ''
      
      switch (header.toLowerCase()) {
        case 'question':
          card.question = value
          break
        case 'answer':
        case 'correct_answer':
          card.answer = value
          break
        case 'card_type':
        case 'type':
          card.card_type = value as any || 'flashcard'
          break
        case 'tags':
          card.tags = value ? value.split(';').map(t => t.trim()).filter(Boolean) : []
          break
        case 'option_1':
        case 'distractor1':
          card.option_1 = value
          break
        case 'option_2':
        case 'distractor2':
          card.option_2 = value
          break
        case 'option_3':
        case 'distractor3':
          card.option_3 = value
          break
        case 'option_4':
          card.option_4 = value
          break
        case 'correct_option_index':
          card.correct_option_index = value ? parseInt(value) : undefined
          break
      }
    })

    // Build options array for multiple choice
    if (card.option_1 || card.option_2 || card.option_3) {
      card.options = [card.answer, card.option_1, card.option_2, card.option_3, card.option_4]
        .filter(Boolean)
        .filter(o => o && o.trim())
      card.correct_option_index = 0 // Correct answer is always first in our format
    }

    if (card.question && card.answer) {
      cards.push(card)
    }
  }

  return cards
}

/**
 * Validate imported card data
 */
function validateCards(cards: ImportCardData[]): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (cards.length === 0) {
    errors.push('No valid cards found in import file')
    return { valid: false, errors }
  }

  if (cards.length > 1000) {
    errors.push('Import file contains too many cards (maximum 1000)')
    return { valid: false, errors }
  }

  cards.forEach((card, index) => {
    if (!card.question || card.question.trim().length === 0) {
      errors.push(`Card ${index + 1}: Question is required`)
    }
    if (!card.answer || card.answer.trim().length === 0) {
      errors.push(`Card ${index + 1}: Answer is required`)
    }
    if (card.question && card.question.length > 5000) {
      errors.push(`Card ${index + 1}: Question is too long (max 5000 characters)`)
    }
    if (card.answer && card.answer.length > 5000) {
      errors.push(`Card ${index + 1}: Answer is too long (max 5000 characters)`)
    }
    if (card.card_type && !['flashcard', 'multiple_choice', 'true_false'].includes(card.card_type)) {
      errors.push(`Card ${index + 1}: Invalid card type '${card.card_type}'`)
    }
    if (card.card_type === 'multiple_choice' && (!card.options || card.options.length < 2)) {
      errors.push(`Card ${index + 1}: Multiple choice cards must have at least 2 options`)
    }
  })

  return {
    valid: errors.length === 0,
    errors: errors.slice(0, 10) // Limit to first 10 errors
  }
}

export async function POST(request: NextRequest) {
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

    // Parse form data
    const formData = await request.formData()
    const name = formData.get('name') as string
    const description = formData.get('description') as string || ''
    const file = formData.get('file') as File
    const format = (formData.get('format') as string) || 'json'

    if (!name || !file) {
      return NextResponse.json(
        { error: 'Deck name and file are required' },
        { status: 400 }
      )
    }

    // Read file content
    const fileContent = await file.text()
    let cards: ImportCardData[] = []

    try {
      if (format === 'json') {
        const jsonData = JSON.parse(fileContent)
        
        // Handle both full export format and simple card array
        if (jsonData.cards && Array.isArray(jsonData.cards)) {
          cards = jsonData.cards
        } else if (Array.isArray(jsonData)) {
          cards = jsonData
        } else {
          throw new Error('Invalid JSON format')
        }
      } else if (format === 'csv') {
        cards = parseCSV(fileContent)
      } else {
        return NextResponse.json(
          { error: 'Invalid format. Use csv or json' },
          { status: 400 }
        )
      }
    } catch (parseError: any) {
      console.error('Error parsing import file:', parseError)
      return NextResponse.json(
        { error: `Failed to parse file: ${parseError.message}` },
        { status: 400 }
      )
    }

    // Validate cards
    const validation = validateCards(cards)
    if (!validation.valid) {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: validation.errors 
        },
        { status: 400 }
      )
    }

    // Create new deck
    const { data: deck, error: deckError } = await supabase
      .from('decks')
      .insert({
        user_id: user.id,
        name: name,
        description: description,
        card_count: 0 // Will be updated by trigger
      } as any)
      .select()
      .single()

    if (deckError) {
      console.error('Error creating deck:', deckError)
      return NextResponse.json(
        { error: 'Failed to create deck' },
        { status: 500 }
      )
    }

    // Insert cards in batches
    const batchSize = 50
    let insertedCount = 0
    let failedCount = 0

    for (let i = 0; i < cards.length; i += batchSize) {
      const batch = cards.slice(i, i + batchSize)
      
      const cardsToInsert = batch.map((card, index) => ({
        deck_id: (deck as any).id,
        question: card.question.trim(),
        answer: card.answer.trim(),
        card_type: card.card_type || 'flashcard',
        options: card.options ? JSON.stringify(card.options) : null,
        correct_option_index: card.correct_option_index ?? null,
        tags: card.tags || null,
        position: i + index
      }))

      const { data: insertedCards, error: cardsError } = await supabase
        .from('cards')
        .insert(cardsToInsert as any)
        .select()

      if (cardsError) {
        console.error(`Error inserting card batch ${i / batchSize + 1}:`, cardsError)
        failedCount += batch.length
      } else {
        insertedCount += insertedCards?.length || 0
      }
    }

    // Get final deck with updated card count
    const { data: finalDeck } = await supabase
      .from('decks')
      .select('*')
      .eq('id', (deck as any).id)
      .single()

    return NextResponse.json({
      success: true,
      deck: {
        id: (deck as any).id,
        name: (deck as any).name,
        description: (deck as any).description,
        card_count: (finalDeck as any)?.card_count || insertedCount
      },
      imported: {
        total_cards: cards.length,
        inserted: insertedCount,
        failed: failedCount
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Error in POST /api/import/deck:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
