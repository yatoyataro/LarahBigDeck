# LarahBigDeck (LBD) - Enhanced Features Guide

## Overview

This document describes the enhanced study flow, progress tracking, and export/import features added to the LarahBigDeck application.

## Table of Contents

1. [Study Mode Enhancements](#study-mode-enhancements)
2. [User Progress Tracking](#user-progress-tracking)
3. [Export/Import Feature](#exportimport-feature)
4. [UI/UX Improvements](#uiux-improvements)
5. [Database Schema](#database-schema)
6. [API Endpoints](#api-endpoints)
7. [Usage Examples](#usage-examples)

---

## Study Mode Enhancements

### 1. Review Session Mode

When a user starts studying a deck, the application now tracks the entire study session:

- **Session Creation**: Automatically creates a `study_session` record when studying begins
- **Mode Selection**: Supports flashcard, multiple choice, flagged-only, and mixed modes
- **Session Completion**: Records duration, accuracy, and cards studied when session ends

**Features:**
- Session ID tracking for all card interactions
- Real-time accuracy calculation
- Duration tracking in seconds/minutes
- Cards studied vs cards correct metrics

### 2. Multiple Choice Immediate Feedback

In Multiple Choice mode, users now receive instant feedback:

- ✅ **Correct Answer**: Green highlight with checkmark
- ❌ **Incorrect Answer**: Red highlight with X, correct answer shown in green
- **Auto-Advance**: Automatically moves to next card after 1.5 seconds (configurable)
- **Stats Update**: Each answer updates the user's card statistics in real-time

### 3. Flag Cards for Review

Users can flag difficult cards during study:

- **Flag Button**: Star icon button on each card
- **Visual Indicator**: Flagged cards show a filled yellow star
- **Flag Filter**: Toggle to show only flagged cards
- **Shuffle Flagged**: Randomize the order of flagged cards for varied practice

**How to Use:**
1. While studying, click the "Flag for review" button on any card
2. Enable "Show flagged cards only" toggle to review flagged cards
3. Click "Shuffle" to randomize flagged card order
4. Unflag cards by clicking the star button again

---

## User Progress Tracking

### Card-Level Statistics

The system tracks detailed statistics for each card per user:

```typescript
interface CardStats {
  attempts: number              // Total times reviewed
  correct: number              // Times answered correctly
  accuracy: number             // Percentage (correct/attempts * 100)
  flagged: boolean            // Flagged for review
  last_reviewed_at: string    // Last study timestamp
  current_streak: number      // Current correct streak
  best_streak: number         // Best streak achieved
  ease_factor: number         // For spaced repetition (future)
  interval_days: number       // Days until next review (future)
}
```

### Deck-Level Statistics

Aggregated metrics for each deck:

```typescript
interface DeckStatistics {
  total_cards: number          // Cards in deck
  cards_studied: number        // Unique cards reviewed
  cards_unstudied: number      // Never reviewed
  flagged_count: number        // Flagged cards count
  total_attempts: number       // All review attempts
  total_correct: number        // All correct answers
  accuracy_percentage: number  // Overall accuracy
  session_count: number        // Study sessions completed
  last_studied_at: string     // Last study date
  completion_percentage: number // % of deck studied
}
```

### Progress Dashboard

View per-deck statistics on the dashboard:

- **Cards Progress**: Shows X/Y cards studied
- **Accuracy Badge**: Color-coded accuracy percentage
- **Flagged Count**: Number of cards flagged for review
- **Last Studied**: Timestamp of last study session
- **Study Streak**: Visual indicator of study consistency

---

## Export/Import Feature

### Export Deck

Export your decks to share with others or backup your data.

**Supported Formats:**
- **JSON**: Full structured data with nested objects
- **CSV**: Spreadsheet-compatible format

**Export Options:**
- `includeStats=true`: Include user statistics (attempts, correct, flagged)
- `includeStats=false`: Export only card content

**API Endpoint:**
```
GET /api/export/deck/[deckId]?format=csv&includeStats=true
```

**JSON Export Example:**
```json
{
  "deck": {
    "name": "JavaScript Fundamentals",
    "description": "Core JS concepts",
    "created_at": "2025-01-15T10:00:00Z",
    "exported_at": "2025-01-20T15:30:00Z"
  },
  "cards": [
    {
      "question": "What is a closure?",
      "answer": "A function with access to outer scope",
      "card_type": "flashcard",
      "tags": ["javascript", "functions"],
      "stats": {
        "attempts": 5,
        "correct": 4,
        "accuracy": 80,
        "flagged": false
      }
    }
  ]
}
```

**CSV Export Format:**
```csv
question,answer,card_type,tags,attempts,correct,accuracy,flagged,option_1,option_2,option_3,option_4,correct_option_index
"What is React?","A JavaScript library","flashcard","react;js",5,4,80,false,,,,
"JSX stands for?","JavaScript XML","multiple_choice","react",3,3,100,false,"Java Syntax","JSON XML","JS Extra",,0
```

### Import Deck

Create new decks from CSV or JSON files.

**CSV Format Requirements:**
- **Required columns**: `question`, `answer`
- **Optional columns**: 
  - `card_type` (flashcard, multiple_choice, true_false)
  - `tags` (semicolon-separated)
  - `option_1`, `option_2`, `option_3`, `option_4` (for multiple choice)
  - `correct_option_index` (0-based index)

**JSON Format Requirements:**
```json
{
  "cards": [
    {
      "question": "Question text",
      "answer": "Answer text",
      "card_type": "flashcard",
      "tags": ["tag1", "tag2"],
      "options": ["option1", "option2", "option3"],  // For MC
      "correct_option_index": 0  // For MC
    }
  ]
}
```

**Validation Rules:**
- Maximum 1000 cards per import
- Question and answer required (non-empty)
- Maximum 5000 characters per field
- Valid card types only
- Multiple choice must have ≥2 options

**Import Process:**
1. Navigate to `/import` page
2. Enter deck name and optional description
3. Select format (CSV or JSON)
4. Upload file
5. Click "Import Deck"
6. Review results (inserted/failed counts)
7. Automatically navigates to new deck

---

## UI/UX Improvements

### 1. Progress Indicators

**Study Session Progress Bar:**
- Visual bar showing card X of Y
- Percentage completion
- Color-coded: gradient for active progress

**Score Display:**
- Real-time accuracy in multiple choice mode
- Format: "12/15 (80%)"
- Positioned prominently during study

### 2. Visual Feedback

**Flag Status:**
- Unflagged: Outline star icon
- Flagged: Filled yellow star with background highlight
- Toast notifications for flag/unflag actions

**Study Mode Icons:**
- Flip mode: RotateCw icon
- Multiple choice: ListChecks icon
- Clear visual distinction

### 3. Filter Controls

**Study Options Panel:**
- Toggle switch for flagged-only mode
- Shuffle button for flagged cards
- Card count display next to toggle

### 4. Theme Persistence (Future Enhancement)

User preferences stored in `user_profiles.study_preferences`:
```json
{
  "theme": "dark",
  "autoAdvance": true,
  "showFeedback": true,
  "studyMode": "flashcard",
  "cardsPerSession": 20,
  "shuffleCards": true
}
```

---

## Database Schema

### New Tables

#### 1. user_card_stats
Tracks individual user statistics for each card.

```sql
CREATE TABLE user_card_stats (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  card_id UUID REFERENCES cards(id),
  attempts INTEGER DEFAULT 0,
  correct INTEGER DEFAULT 0,
  last_reviewed_at TIMESTAMP,
  first_reviewed_at TIMESTAMP,
  flagged BOOLEAN DEFAULT FALSE,
  flagged_at TIMESTAMP,
  current_streak INTEGER DEFAULT 0,
  best_streak INTEGER DEFAULT 0,
  ease_factor DECIMAL(3,2) DEFAULT 2.5,
  interval_days INTEGER DEFAULT 1,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  UNIQUE (user_id, card_id)
);
```

#### 2. study_sessions
Records each study session with metadata.

```sql
CREATE TABLE study_sessions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  deck_id UUID REFERENCES decks(id),
  mode VARCHAR(50) CHECK (mode IN ('flashcard', 'multiple_choice', 'flagged_only', 'mixed')),
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  cards_studied INTEGER DEFAULT 0,
  cards_correct INTEGER DEFAULT 0,
  duration_seconds INTEGER,
  average_response_time DECIMAL(10,2),
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP
);
```

#### 3. card_interactions
Detailed log of every user interaction with cards.

```sql
CREATE TABLE card_interactions (
  id UUID PRIMARY KEY,
  session_id UUID REFERENCES study_sessions(id),
  user_id UUID REFERENCES auth.users(id),
  card_id UUID REFERENCES cards(id),
  interaction_type VARCHAR(50) CHECK (interaction_type IN ('flip', 'multiple_choice', 'flag', 'unflag')),
  correct BOOLEAN,
  response_time_seconds DECIMAL(10,2),
  selected_option_index INTEGER,
  created_at TIMESTAMP
);
```

### Views

#### deck_statistics
Aggregated statistics view for efficient queries.

```sql
CREATE VIEW deck_statistics AS
SELECT 
  d.id AS deck_id,
  d.user_id,
  d.name AS deck_name,
  d.card_count,
  COUNT(DISTINCT ucs.card_id) AS cards_studied,
  COUNT(CASE WHEN ucs.flagged = TRUE THEN 1 END) AS flagged_count,
  COALESCE(SUM(ucs.attempts), 0) AS total_attempts,
  COALESCE(SUM(ucs.correct), 0) AS total_correct,
  ROUND((SUM(ucs.correct)::DECIMAL / NULLIF(SUM(ucs.attempts), 0)) * 100, 2) AS accuracy_percentage,
  MAX(ucs.last_reviewed_at) AS last_studied_at,
  COUNT(DISTINCT ss.id) AS session_count
FROM decks d
LEFT JOIN cards c ON c.deck_id = d.id
LEFT JOIN user_card_stats ucs ON ucs.card_id = c.id AND ucs.user_id = d.user_id
LEFT JOIN study_sessions ss ON ss.deck_id = d.id AND ss.user_id = d.user_id
GROUP BY d.id, d.user_id, d.name, d.card_count;
```

### Functions

#### update_card_stats
Atomic function to update card statistics after interaction.

```sql
CREATE FUNCTION update_card_stats(
  p_user_id UUID,
  p_card_id UUID,
  p_correct BOOLEAN,
  p_flagged BOOLEAN DEFAULT NULL
) RETURNS user_card_stats;
```

---

## API Endpoints

### Statistics Endpoints

#### 1. Get Deck Statistics
```http
GET /api/stats/deck/[deckId]
Authorization: Required (cookie-based)

Response: {
  deck: { id, name, card_count },
  statistics: { ... },
  flagged_cards: [...],
  recent_sessions: [...]
}
```

#### 2. Get Card Statistics
```http
GET /api/cards/[cardId]/stats
Authorization: Required

Response: {
  card_id: string,
  attempts: number,
  correct: number,
  accuracy: number,
  flagged: boolean,
  ...
}
```

#### 3. Update Card Statistics
```http
POST /api/cards/[cardId]/stats
Authorization: Required

Body: {
  correct: boolean,
  sessionId?: string,
  responseTime?: number,
  interactionType?: 'flip' | 'multiple_choice',
  selectedOptionIndex?: number
}

Response: {
  card_id: string,
  attempts: number,
  correct: number,
  accuracy: number,
  current_streak: number,
  best_streak: number
}
```

#### 4. Toggle Card Flag
```http
PATCH /api/cards/[cardId]/stats
Authorization: Required

Body: {
  flagged: boolean
}

Response: {
  card_id: string,
  flagged: boolean,
  flagged_at: string | null
}
```

### Session Endpoints

#### 5. Start Study Session
```http
POST /api/sessions/start
Authorization: Required

Body: {
  deckId: string,
  mode: 'flashcard' | 'multiple_choice' | 'flagged_only' | 'mixed'
}

Response: {
  session_id: string,
  deck_id: string,
  deck_name: string,
  mode: string,
  started_at: string
}
```

#### 6. Complete Study Session
```http
PATCH /api/sessions/[sessionId]/complete
Authorization: Required

Response: {
  session_id: string,
  completed: true,
  completed_at: string,
  duration_seconds: number,
  duration_minutes: number,
  cards_studied: number,
  cards_correct: number,
  accuracy: number
}
```

### Export/Import Endpoints

#### 7. Export Deck
```http
GET /api/export/deck/[deckId]?format=csv|json&includeStats=true|false
Authorization: Required

Response: File download (CSV or JSON)
Content-Disposition: attachment; filename="deck_name_timestamp.csv"
```

#### 8. Import Deck
```http
POST /api/import/deck
Authorization: Required
Content-Type: multipart/form-data

Body: FormData {
  name: string,
  description?: string,
  file: File,
  format: 'csv' | 'json'
}

Response: {
  success: boolean,
  deck: { id, name, description, card_count },
  imported: { total_cards, inserted, failed }
}
```

---

## Usage Examples

### Frontend: Track Card Interaction

```typescript
import * as statsService from '@/services/statsService'

// After user answers a card
const handleAnswer = async (correct: boolean) => {
  try {
    const stats = await statsService.updateCardStats(cardId, {
      correct,
      sessionId: currentSessionId,
      responseTime: elapsedSeconds,
      interactionType: 'multiple_choice',
      selectedOptionIndex: 2
    })
    
    console.log(`Accuracy: ${stats.accuracy}%`)
    console.log(`Streak: ${stats.current_streak}`)
  } catch (error) {
    console.error('Failed to update stats:', error)
  }
}
```

### Frontend: Export Deck

```typescript
import * as statsService from '@/services/statsService'

const handleExport = async () => {
  try {
    const blob = await statsService.exportDeck(
      deckId,
      'csv',
      true // include stats
    )
    
    statsService.downloadBlob(blob, `${deckName}.csv`)
    toast.success('Deck exported successfully')
  } catch (error) {
    toast.error('Export failed')
  }
}
```

### Frontend: Import Deck

```typescript
import * as statsService from '@/services/statsService'

const handleImport = async (file: File) => {
  try {
    const result = await statsService.importDeck(
      'My Imported Deck',
      file,
      'Deck imported from CSV',
      'csv'
    )
    
    toast.success(`Imported ${result.imported.inserted} cards!`)
    navigate(`/study/${result.deck.id}`)
  } catch (error) {
    toast.error(error.message)
  }
}
```

### Backend: Get Deck Stats

```typescript
// In API route or component
const deckStats = await fetch(`/api/stats/deck/${deckId}`, {
  credentials: 'include'
})
const data = await deckStats.json()

console.log(`Accuracy: ${data.statistics.accuracy_percentage}%`)
console.log(`Flagged: ${data.statistics.flagged_count} cards`)
console.log(`Sessions: ${data.statistics.session_count}`)
```

---

## Security Considerations

### Authentication & Authorization

- ✅ All API endpoints require authentication (Supabase Auth)
- ✅ Row-Level Security (RLS) ensures users only access their data
- ✅ Deck ownership verified before export/import
- ✅ Card access verified through deck ownership

### Data Validation

- ✅ Input sanitization on import (CSV/JSON parsing)
- ✅ Maximum file size limits
- ✅ Maximum card count per import (1000)
- ✅ Field length validation (5000 chars)
- ✅ Card type enum validation

### Privacy

- ✅ Exported files contain only user's own data
- ✅ Stats not included in export by default
- ✅ No cross-user data leakage
- ✅ Session data isolated per user

---

## Future Enhancements

### Spaced Repetition Algorithm

The database schema includes fields for implementing spaced repetition (SM-2 or similar):

- `ease_factor`: Multiplier for interval calculation
- `interval_days`: Days until next review
- `next_review_at`: Scheduled review timestamp

**Algorithm Placeholder:**
```typescript
// Future implementation
function calculateNextReview(
  previousInterval: number,
  easeFactor: number,
  correct: boolean
): { newInterval: number, newEaseFactor: number } {
  if (correct) {
    return {
      newInterval: previousInterval * easeFactor,
      newEaseFactor: Math.max(1.3, easeFactor + 0.1)
    }
  } else {
    return {
      newInterval: 1,
      newEaseFactor: Math.max(1.3, easeFactor - 0.2)
    }
  }
}
```

### Analytics Dashboard

- Study time trends (daily/weekly/monthly)
- Most difficult cards identification
- Accuracy by card type
- Session duration patterns
- Heatmap of study activity

### Collaborative Features

- Share decks with other users
- Public deck marketplace
- Deck forking and remixing
- Collaborative editing

### Advanced Study Modes

- Timed challenges
- Confidence-based repetition
- Audio pronunciation mode
- Image occlusion mode

---

## Testing

### Manual Testing Checklist

#### Study Flow
- [ ] Start study session
- [ ] Answer cards in flip mode
- [ ] Answer cards in multiple choice mode
- [ ] Flag/unflag cards
- [ ] Filter to flagged cards only
- [ ] Shuffle flagged cards
- [ ] Complete study session
- [ ] Verify stats updated

#### Export
- [ ] Export deck as JSON
- [ ] Export deck as CSV
- [ ] Export with stats
- [ ] Export without stats
- [ ] Verify file downloads
- [ ] Verify file format correctness

#### Import
- [ ] Import CSV file
- [ ] Import JSON file
- [ ] Import with validation errors
- [ ] Verify card creation
- [ ] Verify deck navigation

#### Statistics
- [ ] View deck statistics
- [ ] View card statistics
- [ ] Verify accuracy calculations
- [ ] Verify streak tracking
- [ ] Check recent sessions display

---

## Troubleshooting

### Common Issues

**Issue: Stats not updating**
- Check authentication cookies
- Verify API endpoint URLs
- Check browser console for errors
- Ensure backend is running on port 3001

**Issue: Import failing**
- Verify CSV/JSON format matches examples
- Check file size (should be < 10MB)
- Validate required columns present
- Check for special characters in data

**Issue: Export downloads empty file**
- Verify deck has cards
- Check user owns the deck
- Try different format (CSV vs JSON)

**Issue: Session not completing**
- Ensure session was started
- Check session ID is valid
- Verify all cards have been attempted

---

## Support

For issues, feature requests, or questions:

1. Check this documentation first
2. Review API_TESTING_GUIDE.md for endpoint details
3. Check BACKEND_README.md for backend setup
4. Review database schema in supabase/migrations/

---

**Last Updated**: October 24, 2025
**Version**: 2.0.0
**Author**: LarahBigDeck Development Team
