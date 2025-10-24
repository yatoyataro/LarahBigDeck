# Study Page - Backend Integration Fix

## Problem
- Created decks were showing on the Dashboard
- Clicking "Start studying →" showed "Deck not found"
- Cards were not loading from the database
- Study page was using mock data (`mockDecks`) instead of real backend data

## Root Cause
The Study page (`src/views/Study.tsx`) was using hardcoded mock data from `@/data/mockData` instead of fetching real deck and card data from the Supabase database.

## Solution Implemented

### 1. Added `getDeckCards()` Function to `deckService.ts`

**New Function:**
```typescript
export async function getDeckCards(deckId: string): Promise<Card[]>
```

**Features:**
- Fetches all cards for a specific deck
- Validates deck ownership (checks user_id)
- Orders cards by position
- Returns empty array if deck has no cards
- Throws error if deck not found or access denied

**Card Interface:**
```typescript
export interface Card {
  id: string
  deck_id: string
  question: string
  answer: string
  card_type: 'flashcard' | 'multiple_choice' | 'true_false'
  options: string[] | null
  correct_option_index: number | null
  tags: string[] | null
  position: number
  difficulty: number
  times_reviewed: number
  times_correct: number
  created_at: string
}
```

### 2. Updated `Study.tsx` to Use Real Backend Data

**Changes Made:**

**Imports:**
- Removed: `import { mockDecks } from "@/data/mockData"`
- Removed: `import { Card as CardType } from "@/data/mockData"`
- Removed: `import { toast } from "sonner"`
- Removed: `import * as statsService from "@/services/statsService"`
- Added: `import * as deckService from "@/services/deckService"`
- Added: `import { useToast } from "@/hooks/use-toast"`
- Added: `import { useAuth } from "@/hooks/useAuth"`

**State Management:**
- Added `deck` state for storing deck details
- Added `loading` state for loading indicator
- Added `error` state for error messages
- Changed card type from mockData Card to deckService.Card

**Data Fetching:**
- Added `useEffect` to fetch deck and cards on component mount
- Fetches deck details using `deckService.getDeck(deckId)`
- Fetches cards using `deckService.getDeckCards(deckId)`
- Validates user authentication before fetching
- Shows loading state while fetching
- Shows error state if deck not found

**UI Updates:**
- Changed `deck.title` to `deck.name` (matches database schema)
- Changed `deck.description` handling (nullable in database)
- Added loading screen: "Loading deck..."
- Added error screen with "Back to Dashboard" button
- Changed toast from sonner to shadcn/ui toast

**Removed Features (Temporarily):**
- Stats service integration (will be added later)
- Session tracking (will be added later)
- Card flagging persistence (currently client-side only)

### 3. Updated Component Type Definitions

**FlipCard.tsx:**
- Changed: `import { Card as CardType } from "@/data/mockData"`
- To: `import { Card as CardType } from "@/services/deckService"`

**MultipleChoice.tsx:**
- Changed: `import { Card as CardType } from "@/data/mockData"`
- To: `import { Card as CardType } from "@/services/deckService"`

**CardEditor.tsx:**
- Changed: `import { Card as CardType } from "@/data/mockData"`
- To: `import { Card as CardType } from "@/services/deckService"`
- Updated `handleAddCard()` to create cards with all required fields:
  - `deck_id`, `card_type`, `position`, `difficulty`, etc.
  - Defaults: `card_type: 'flashcard'`, `difficulty: 2.5`

## User Flow Now

### Successful Flow:
```
1. User logs in
2. User clicks "Upload New Deck"
3. User creates deck with cards (manual or upload)
4. Deck appears on Dashboard
5. User clicks "Start studying →"
6. Study page loads:
   ✅ Fetches deck from database
   ✅ Fetches cards from database
   ✅ Displays deck name and description
   ✅ Shows all cards in CardEditor
7. User clicks "Start Studying"
8. Cards are displayed one by one
9. User can flip cards or answer multiple choice
```

### Error Handling:
```
- No deckId in URL → Error: "No deck ID provided"
- User not logged in → Error: "Please log in to view this deck"
- Deck not found → Error: "Deck not found"
- Access denied → Error: "Deck not found or access denied"
- Network error → Error: "Failed to load deck"
```

## Database Schema Used

### `decks` table:
- `id` - UUID
- `user_id` - UUID (foreign key to auth.users)
- `name` - Text (deck title)
- `description` - Text, nullable
- `created_at` - Timestamp
- `updated_at` - Timestamp

### `cards` table:
- `id` - UUID
- `deck_id` - UUID (foreign key to decks)
- `question` - Text
- `answer` - Text
- `card_type` - Enum: flashcard, multiple_choice, true_false
- `options` - JSONB (array of strings), nullable
- `correct_option_index` - Integer, nullable
- `tags` - JSONB (array of strings), nullable
- `position` - Integer (order in deck)
- `difficulty` - Numeric (default 2.5)
- `times_reviewed` - Integer (default 0)
- `times_correct` - Integer (default 0)
- `created_at` - Timestamp

## Security

**Row Level Security (RLS):**
- Users can only fetch their own decks
- `getDeck()` checks both `id` AND `user_id`
- `getDeckCards()` first validates deck ownership
- No user can access another user's cards

## Testing Checklist

✅ **Test 1: View Existing Deck**
- Create a deck with cards
- Click "Start studying →" from dashboard
- Deck should load successfully
- Cards should be displayed

✅ **Test 2: Empty Deck**
- Create a deck with 0 cards
- Click "Start studying →"
- Should show deck name
- Should show empty card list
- Should show "Add card" button

✅ **Test 3: Authentication**
- Log out
- Try to access `/study/:deckId` directly
- Should show "Please log in" error

✅ **Test 4: Invalid Deck ID**
- Try to access `/study/invalid-uuid`
- Should show "Deck not found" error

✅ **Test 5: Another User's Deck**
- Get deck ID from another user
- Try to access it
- Should show "Deck not found" (due to RLS)

## Next Steps

**Future Enhancements:**
1. Add stats service integration
   - Track study sessions
   - Track card review history
   - Calculate accuracy and time spent

2. Add card flagging persistence
   - Save flagged cards to database
   - Load flagged status on page load

3. Add spaced repetition algorithm
   - Calculate next review date
   - Adjust card difficulty based on performance

4. Add study session summary
   - Show session stats at end
   - Display accuracy, time, cards reviewed

5. Add offline support
   - Cache decks locally
   - Sync when online

## Files Modified

1. `src/services/deckService.ts`
   - Added `Card` interface
   - Added `getDeckCards()` function

2. `src/views/Study.tsx`
   - Complete rewrite to use backend data
   - Added loading and error states
   - Changed from sonner to shadcn toast
   - Added authentication check

3. `src/components/FlipCard.tsx`
   - Updated Card type import

4. `src/components/MultipleChoice.tsx`
   - Updated Card type import

5. `src/components/CardEditor.tsx`
   - Updated Card type import
   - Updated `handleAddCard()` with all required fields

## Conclusion

The Study page now fully integrates with the backend:
- ✅ Fetches real decks from Supabase
- ✅ Fetches real cards from Supabase
- ✅ Validates user authentication
- ✅ Enforces row-level security
- ✅ Shows proper loading and error states
- ✅ Works with user-created decks from Upload page

**The "Deck not found" issue is now fixed!** 🎉
