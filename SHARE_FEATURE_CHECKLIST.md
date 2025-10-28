# 🔧 Deck Sharing Feature - Fix Checklist

## ❌ CRITICAL ISSUE IDENTIFIED

**The database migration has NOT been run yet!**

The error `"Cannot read properties of null (reading 'user_id')"` was happening because:
1. ✅ **Fixed**: Supabase join queries weren't working - switched to separate queries
2. ❌ **Not Done**: Database tables don't exist yet (migration not run)

---

## ✅ What Was Just Fixed (Deployed)

**Commit**: `f10b736` - "fix: resolve share link loading error with separate queries"

**Changes**:
- Fixed `getShareByToken()` - now uses separate queries instead of joins
- Fixed `addSharedDeck()` - better error handling and separate queries
- Added console.error() for debugging
- Added check to prevent owner from adding their own deck

---

## 🚨 YOU MUST DO THIS NOW

### Step 1: Run the Database Migration

**This is why the feature isn't working!** The tables don't exist yet.

1. **Open Supabase Dashboard**: https://supabase.com/dashboard
2. **Select your project**
3. **Go to SQL Editor** (left sidebar)
4. **Click "New Query"**
5. **Copy the ENTIRE contents** of this file:
   ```
   supabase/migrations/20241028000001_deck_sharing.sql
   ```
6. **Paste into the SQL editor**
7. **Click "Run"** or press `Ctrl+Enter`

You should see success messages for:
- ✅ Tables created: `deck_shares`, `shared_deck_access`
- ✅ Indexes created
- ✅ Functions and triggers created
- ✅ RLS policies created
- ✅ View created: `shared_decks_view`

### Step 2: Verify Migration Worked

**Option A: Check in Supabase Dashboard**
1. Go to **Table Editor** in Supabase
2. Look for these new tables:
   - `deck_shares`
   - `shared_deck_access`

**Option B: Use Test File (Easier)**
1. Open `test-db-tables.html` in this folder
2. Edit lines 8-9 with your Supabase credentials:
   ```javascript
   const SUPABASE_URL = 'YOUR_SUPABASE_URL'  // from .env
   const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY' // from .env
   ```
3. Open the file in a web browser
4. Check console (F12) and page for results

### Step 3: Wait for Vercel Deployment

Vercel is auto-deploying the fix right now:
1. Go to https://vercel.com/dashboard
2. Wait for "Ready" status (~2-3 minutes)

---

## 🧪 Testing After Migration

Once you run the migration and Vercel deploys:

### Test 1: Create Share Link
1. ✅ Go to your dashboard
2. ✅ Click "Share Deck" on any deck
3. ✅ Copy the link (should work now!)

### Test 2: Open Share Link (Same User)
1. ✅ Open the share link in same browser
2. ✅ Should see deck info with your name
3. ✅ Should get error: "You already own this deck" (correct behavior)

### Test 3: Open Share Link (Different User)
1. ✅ Open link in incognito/private window
2. ✅ Should see deck preview (no more errors!)
3. ✅ Should show "Deck Owner" or owner's display name
4. ✅ Click "Add to Dashboard"
5. ✅ Sign in (gets redirected to auth)
6. ✅ After login, redirects back to share link
7. ✅ Click "Add to Dashboard" again
8. ✅ Success! Deck appears in "Shared" tab

---

## 🐛 If Still Getting Errors

### Error: "relation deck_shares does not exist"
- **Cause**: Migration not run
- **Fix**: Go back to Step 1 and run the migration

### Error: "Cannot read properties of null"
- **Cause**: Old code still deployed, or migration not run
- **Fix**: Wait for Vercel deployment to complete, then hard refresh (Ctrl+Shift+R)

### Error: "Share link not found"
- **Cause**: No share record in database
- **Fix**: Create a new share link from dashboard after migration

### Share button doesn't create link
- **Cause**: Database tables don't exist
- **Fix**: Run the migration!

---

## 📊 What the Migration Creates

**Tables**:
```sql
deck_shares
├── id (UUID)
├── deck_id → decks.id
├── owner_id → auth.users.id
├── share_token (UNIQUE, 16 chars)
├── is_public (boolean)
├── expires_at (timestamp, nullable)
├── view_count (integer)
└── created_at (timestamp)

shared_deck_access
├── id (UUID)
├── share_id → deck_shares.id
├── deck_id → decks.id
├── user_id → auth.users.id (recipient)
├── owner_id → auth.users.id (original owner)
├── accessed_at (timestamp)
└── last_studied_at (timestamp, nullable)
```

**View**:
```sql
shared_decks_view
- Joins shared_deck_access + decks + deck_shares + user_profiles
- Returns all shared decks for a user with owner info
```

**RLS Policies**:
- ✅ Owners can manage their share links
- ✅ Anyone can view public share links by token
- ✅ Users can record and view their shared deck access
- ✅ Updated decks/cards policies to allow viewing shared content

---

## ✅ Summary

**What's Fixed**: 
- Code issues resolved ✅
- Deployed to production ✅

**What You Must Do**:
- Run database migration ⚠️ **THIS IS CRITICAL!**
- Wait for Vercel deployment (~2 min)
- Test share links

**Files Updated**:
- `src/services/sharingService.ts` - Fixed query issues
- `test-db-tables.html` - New test file

**Migration File**:
- `supabase/migrations/20241028000001_deck_sharing.sql`

---

## 🎯 Next Steps

1. **NOW**: Run the migration in Supabase Dashboard
2. **Wait**: 2-3 minutes for Vercel deployment
3. **Test**: Create and open a share link
4. **Celebrate**: Feature should work! 🎉

---

## 💡 Pro Tips

- The error was happening because Supabase's nested joins don't work well with RLS
- Separate queries are more reliable and easier to debug
- Always check if migration was run before testing new features
- Use `test-db-tables.html` to quickly verify database state

---

**Need Help?**
- Check Supabase logs for SQL errors
- Check browser console (F12) for JavaScript errors
- Check Vercel deployment logs for build errors
