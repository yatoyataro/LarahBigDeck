# Deck Sharing Feature

## Overview
The deck sharing feature allows users to share their flashcard decks with others via unique shareable links. Recipients can add shared decks to their dashboard and study them without being able to edit the original content.

## Features Implemented

### 1. Database Schema (`20241028000001_deck_sharing.sql`)
- **deck_shares table**: Tracks all shareable links
  - Unique share tokens (16 characters)
  - Optional expiration dates
  - View count tracking
  - Public/private toggle

- **shared_deck_access table**: Records who has accessed shared decks
  - Prevents duplicate access records
  - Tracks last studied date
  - Links to original deck owner

- **RLS Policies Updated**:
  - Users can view decks they own OR decks shared with them
  - Users can view cards in their own decks OR in shared decks
  - Share links are publicly viewable by token (for validation)
  - Access records are private to users and deck owners

### 2. Sharing Service (`src/services/sharingService.ts`)
Functions:
- `createShareLink(deckId, expiresInDays?)` - Create/retrieve share link
- `getShareByToken(token)` - Public lookup of share info
- `addSharedDeck(shareToken)` - Add shared deck to user's dashboard
- `getSharedDecks()` - Get all decks shared with current user
- `removeSharedDeck(deckId)` - Remove shared deck from dashboard
- `deactivateShareLink(deckId)` - Disable share link (owner only)
- `getShareLink(deckId)` - Get existing share URL
- `isOwnDeck(deckId)` - Check deck ownership

### 3. UI Components

#### SharedDeck Page (`src/views/SharedDeck.tsx`)
- Displays deck info from share link
- Shows owner name and card count
- "Add to Dashboard" button
- Redirects to login if not authenticated
- Stores pending share token in localStorage for post-login redirect

#### ShareButton Component (`src/components/ShareButton.tsx`)
- Dialog-based UI for managing share links
- Copy to clipboard functionality
- Create/deactivate share links
- Shows what recipients can/cannot do

#### Dashboard Updates (`src/views/Dashboard.tsx`)
- Added tabs: "My Decks" and "Shared"
- Share button on each owned deck
- Separate view for shared decks with owner info
- Auto-redirects to pending share link after login

### 4. Routing (`src/App.tsx`)
- New route: `/shared/:shareToken`

## User Flows

### Sharing a Deck (Owner)
1. Owner clicks "Share" button on their deck
2. System generates unique token (or reuses existing)
3. Owner copies share link
4. Owner can deactivate link later to prevent new access

### Accessing a Shared Deck (Recipient)
1. Recipient clicks share link
2. If not logged in:
   - Sees deck preview
   - Prompted to sign in/sign up
   - Link stored in localStorage
   - Redirected to login
   - After login, redirected back to share link
3. If logged in:
   - Sees deck preview
   - Clicks "Add to Dashboard"
   - Deck appears in "Shared" tab

### Studying a Shared Deck
1. Recipient accesses deck from "Shared" tab
2. Can study cards (flip or multiple choice)
3. Progress tracked separately from owner
4. Cannot edit cards (view-only access)
5. Can flag cards for personal review

## Security Considerations

### RLS Policies
- ✅ Users can only create share links for their own decks
- ✅ Share tokens are validated before allowing access
- ✅ Expired links are automatically rejected
- ✅ Users cannot edit shared decks (only study them)
- ✅ Statistics remain private (tracked separately per user)

### Data Privacy
- Owner's email not exposed (uses display name or "Unknown User")
- Recipient's access is tracked but private
- Share links can be deactivated by owner at any time
- View counts track popularity without exposing user identities

## Database Migration Safety

### Pre-Migration Checks
The migration is designed to be safe for production:

1. **Non-Destructive Operations**:
   - Creates new tables without modifying existing ones
   - Uses `CREATE TABLE IF NOT EXISTS`
   - Uses `DROP POLICY IF EXISTS` before recreating policies

2. **Backward Compatible**:
   - Existing deck and card access still works
   - New policies expand access (don't restrict existing access)
   - View combines data safely with LEFT JOINs

3. **RLS Policy Updates**:
   - Old policies are dropped and recreated with additional conditions
   - Uses OR logic to expand access, not restrict it
   - `auth.uid()` checks ensure authentication is still required

### Migration Execution
```sql
-- Run in Supabase SQL Editor or via migration system
-- Check for errors after each section
-- Verify RLS policies with test users
```

## Testing Checklist

### Owner Tests
- [ ] Create share link for owned deck
- [ ] Copy link to clipboard works
- [ ] Share link persists (same token on reload)
- [ ] Deactivate link works
- [ ] Cannot share decks you don't own

### Recipient Tests
- [ ] Anonymous user sees deck preview
- [ ] Login prompt appears for anonymous users
- [ ] After login, redirected to share link
- [ ] Add to dashboard works
- [ ] Deck appears in "Shared" tab
- [ ] Can study shared deck
- [ ] Cannot edit cards in shared deck
- [ ] Progress tracked separately

### Security Tests
- [ ] Invalid share token shows error
- [ ] Expired share link shows error
- [ ] Deactivated link cannot be used by new users
- [ ] Existing access persists after deactivation
- [ ] Cannot access other users' stats

## Future Enhancements
- [ ] Share link analytics dashboard for owners
- [ ] Batch share link management
- [ ] Email invitations
- [ ] Share link customization (custom tokens)
- [ ] Share with edit permissions (collaborate mode)
- [ ] Export shared deck stats for owners

## API Routes (Future)
If needed, these routes can be added:
- `GET /api/share/:token` - Get share info
- `POST /api/share/:token/access` - Record access
- `GET /api/decks/:id/share` - Get/create share link
- `DELETE /api/decks/:id/share` - Deactivate share link

## Notes
- Share tokens are 16 characters (alphanumeric)
- Tokens are checked for uniqueness before creation
- Maximum 5 retry attempts for token generation
- View count increments via database trigger
- Shared decks use same Study view as owned decks
- RLS policies handle access control automatically
