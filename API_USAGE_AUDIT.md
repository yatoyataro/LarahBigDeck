# API Routes Usage Audit

## Available API Routes

### Auth Routes ✅ (All Used)
1. **POST /api/auth/login** - Used in `authService.ts`
2. **POST /api/auth/signup** - Used in `authService.ts`
3. **POST /api/auth/logout** - Used in `authService.ts`
4. **GET /api/auth/user** - Used in `authService.ts`

### Decks Routes ✅ (All Used)
5. **GET /api/decks** - Used in `deckService.ts::getUserDecks()`
6. **POST /api/decks** - Used in `deckService.ts::createDeck()`
7. **GET /api/decks/[deckId]** - Used in `deckService.ts::getDeck()`
8. **PATCH /api/decks/[deckId]** - Used in `deckService.ts::updateDeck()`
9. **DELETE /api/decks/[deckId]** - Used in `deckService.ts::deleteDeck()`

### Cards Routes ✅ (All Used)
10. **GET /api/decks/[deckId]/cards** - Used in `deckService.ts::getDeckCards()`
11. **POST /api/decks/[deckId]/cards** - Used in `uploadService.ts::createDeckWithCards()`
12. **GET /api/cards/[cardId]** - ⚠️ NOT CURRENTLY USED (but available)
13. **PATCH /api/cards/[cardId]** - ⚠️ NOT CURRENTLY USED (but available)
14. **DELETE /api/cards/[cardId]** - ⚠️ NOT CURRENTLY USED (but available)

### Stats Routes ✅ (All Used)
15. **GET /api/stats/deck/[deckId]** - Used in `statsService.ts::getDeckStats()`
16. **GET /api/cards/[cardId]/stats** - Used in `statsService.ts::getCardStats()`
17. **POST /api/cards/[cardId]/stats** - Used in `statsService.ts::updateCardStats()`
18. **PATCH /api/cards/[cardId]/stats** - Used in `statsService.ts::toggleCardFlag()`

### Sessions Routes ✅ (All Used)
19. **POST /api/sessions/start** - Used in `statsService.ts::startStudySession()`
20. **PATCH /api/sessions/[sessionId]/complete** - Used in `statsService.ts::completeStudySession()`

### Upload Routes ✅ (All Used)
21. **POST /api/upload** - Used in `uploadService.ts::uploadFile()`
22. **GET /api/upload/[uploadId]** - Used in `uploadService.ts::getUploadStatus()`

### Export/Import Routes ✅ (All Used)
23. **GET /api/export/deck/[deckId]** - Used in `statsService.ts::exportDeck()`
24. **POST /api/import/deck** - Used in `statsService.ts::importDeck()`

---

## Views/Components Usage Analysis

### ✅ Dashboard.tsx - FULLY INTEGRATED
**Services Used:**
- `deckService::getUserDecks()` - Fetches user decks with card counts

**API Routes Used:**
- GET /api/decks

**Status:** ✅ Complete

---

### ⚠️ Study.tsx - PARTIALLY INTEGRATED
**Services Used:**
- `deckService::getDeck()` - Fetches deck details
- `deckService::getDeckCards()` - Fetches cards

**API Routes Used:**
- GET /api/decks/[deckId]
- GET /api/decks/[deckId]/cards

**Missing Integration:**
- ❌ Study session tracking (sessions API)
- ❌ Card statistics updates after answering
- ❌ Card flagging persistence
- ❌ Deck statistics display

**Recommended Additions:**
```typescript
// Should add:
import * as statsService from '@/services/statsService'

// On study start:
const session = await statsService.startStudySession(deckId, studyMode)

// On card answer:
await statsService.updateCardStats(cardId, { correct, sessionId })

// On session end:
await statsService.completeStudySession(sessionId)

// For flagging:
await statsService.toggleCardFlag(cardId, flagged)
```

**Status:** ⚠️ Needs Enhancement

---

### ✅ Upload.tsx - FULLY INTEGRATED
**Services Used:**
- `uploadService::createDeckWithCards()` - Manual deck creation
- `uploadService::uploadFile()` - File upload

**API Routes Used:**
- POST /api/decks
- POST /api/decks/[deckId]/cards
- POST /api/upload

**Status:** ✅ Complete

---

### ⚠️ Import.tsx - PARTIALLY INTEGRATED
**Services Used:**
- `statsService::importDeck()` - Import from file
- `statsService::downloadBlob()` - Download sample files

**API Routes Used:**
- POST /api/import/deck

**Issues:**
- ❌ Using `toast` from `sonner` instead of `useToast` hook (inconsistent)
- ✅ Correctly using import API

**Recommended Fix:**
```typescript
// Change from:
import { toast } from "sonner";

// To:
import { useToast } from "@/hooks/use-toast";
const { toast } = useToast();

// Update toast calls from:
toast.error("message")
toast.success("message")

// To:
toast({ title: "Error", description: "message", variant: "destructive" })
toast({ title: "Success", description: "message" })
```

**Status:** ⚠️ Needs Consistency Fix

---

### ✅ AuthDialog.tsx - FULLY INTEGRATED
**Services Used:**
- `authService` via `useAuth()` hook

**API Routes Used:**
- POST /api/auth/login
- POST /api/auth/signup

**Status:** ✅ Complete

---

### ✅ Header.tsx - FULLY INTEGRATED
**Services Used:**
- `authService` via `useAuth()` hook

**API Routes Used:**
- POST /api/auth/logout
- GET /api/auth/user (via session check)

**Status:** ✅ Complete

---

### ⚠️ CardEditor.tsx - NOT INTEGRATED
**Services Used:**
- None (client-side only)

**API Routes Available But Not Used:**
- PATCH /api/cards/[cardId] - Update card
- DELETE /api/cards/[cardId] - Delete card
- POST /api/decks/[deckId]/cards - Add card

**Current State:**
- Cards are managed in local state only
- Changes don't persist to database
- Only displays existing cards

**Recommended Addition:**
Create `cardService.ts` with:
```typescript
export async function updateCard(cardId: string, updates: Partial<Card>)
export async function deleteCard(cardId: string)
export async function createCard(deckId: string, card: CardInput)
```

**Status:** ❌ Needs Implementation

---

### FlipCard.tsx, MultipleChoice.tsx - Display Only
**Services Used:** None (pure UI components)
**Status:** ✅ Appropriate (display components)

---

## Missing Service Files

### ⚠️ cardService.ts - DOES NOT EXIST
**Should Include:**
```typescript
// CRUD operations for individual cards
export async function getCard(cardId: string): Promise<Card>
export async function updateCard(cardId: string, updates: Partial<Card>): Promise<Card>
export async function deleteCard(cardId: string): Promise<void>
export async function createCard(deckId: string, card: CardInput): Promise<Card>
```

**API Routes That Need This Service:**
- GET /api/cards/[cardId]
- PATCH /api/cards/[cardId]
- DELETE /api/cards/[cardId]

---

## Summary

### ✅ Fully Integrated (5/6 views)
1. Dashboard.tsx
2. Upload.tsx
3. Header.tsx
4. AuthDialog.tsx
5. NotFound.tsx (no API needed)

### ⚠️ Needs Enhancement (2/6 views)
1. **Study.tsx** - Missing session tracking and stats updates
2. **Import.tsx** - Toast inconsistency

### ❌ Needs Major Work (1/6 components)
1. **CardEditor.tsx** - No backend integration for editing/deleting cards

### Unused API Routes (3 routes)
These routes exist but aren't being used anywhere:
1. GET /api/cards/[cardId]
2. PATCH /api/cards/[cardId]
3. DELETE /api/cards/[cardId]

**Recommendation:** Create `cardService.ts` and integrate with `CardEditor.tsx`

---

## Priority Fixes

### 🔴 High Priority
1. **Create `cardService.ts`** - Enable card editing/deletion
2. **Integrate Study.tsx with sessions API** - Track study progress
3. **Fix Import.tsx toast** - Use consistent toast system

### 🟡 Medium Priority
4. **Add statistics display to Study.tsx** - Show user progress
5. **Add export functionality to Dashboard** - Let users export decks
6. **Persist card flags in Study.tsx** - Save flagged cards to database

### 🟢 Low Priority
7. **Add deck editing to Dashboard** - Edit deck name/description
8. **Add deck deletion to Dashboard** - Delete unwanted decks

---

## Next Steps

1. Create `src/services/cardService.ts`
2. Update `CardEditor.tsx` to use cardService
3. Update `Study.tsx` to track sessions and stats
4. Fix `Import.tsx` toast inconsistency
5. Add statistics dashboard view (optional)
