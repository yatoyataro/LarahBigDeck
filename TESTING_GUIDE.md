# Testing Guide: Study Session Tracking

## Quick Test Steps

### Test 1: Normal Completion ✅
1. Open http://localhost:8080/study/[deckId]
2. Click "Start Studying"
3. Answer all cards in the deck
4. Click "Next" on the last card
5. Should see: "Study session complete! 🎉" toast
6. Check Dashboard → User stats should show updated study time

### Test 2: Navigate Away (Component Unmount) ✅
1. Start studying a deck
2. Answer 2-3 cards (not all)
3. Click browser back button OR click "Dashboard" in header
4. Open browser console (F12)
5. Should see: "Session completed: [sessionId]" in console
6. Return to Dashboard
7. Check stats - study time should include this partial session

### Test 3: Browser/Tab Close (Beacon) ✅
1. Start studying a deck
2. Answer a few cards
3. Close the browser tab
4. Should see: "Session completion sent via beacon: true" in console (before close)
5. Reopen app and check Dashboard stats
6. The session should be saved with correct duration

### Test 4: Page Refresh ✅
1. Start studying
2. Answer some cards
3. Press F5 to refresh page
4. Beacon should fire before refresh
5. After reload, start a new session
6. Previous partial session should be in database

### Test 5: Tab Hidden >5 Minutes ✅
1. Start studying
2. Switch to another tab (YouTube, etc.)
3. Wait 6+ minutes
4. Return to study tab
5. Session should auto-complete
6. Stats updated with the study time

## Verification Methods

### Method A: Browser Console
```javascript
// Check if event listeners are working
console.log('Session ID:', sessionId); // Should show UUID
console.log('Is Studying:', isStudying); // Should be true

// Before closing tab, you should see:
// "Session completion sent via beacon: true"
```

### Method B: Network Tab (F12)
1. Open DevTools → Network tab
2. Start studying
3. Navigate away or close tab
4. Look for request to: `POST /api/sessions/[sessionId]/beacon`
5. Should show status: 200 OK

### Method C: Database Query (Supabase)
```sql
-- Check recent sessions
SELECT 
  id,
  started_at,
  completed_at,
  duration_seconds,
  cards_studied,
  cards_correct,
  completed
FROM study_sessions
WHERE user_id = '[your-user-id]'
ORDER BY started_at DESC
LIMIT 10;

-- Verify sessions are completing
SELECT 
  COUNT(*) as total_sessions,
  COUNT(CASE WHEN completed = true THEN 1 END) as completed_sessions,
  SUM(duration_seconds) as total_duration_seconds,
  ROUND(SUM(duration_seconds) / 3600.0, 1) as total_hours
FROM study_sessions
WHERE user_id = '[your-user-id]';
```

### Method D: API Response
```bash
# Get user stats
curl http://localhost:3001/api/stats/user \
  -H "Cookie: [your-session-cookie]"

# Response should include:
{
  "overview": {
    "total_study_hours": 1.2,  // Should increase after each session
    "last_activity": "2024-...", // Should update after studying
    "days_active_last_30": 3      // Should increment on different days
  }
}
```

## Expected Results

### Before Fix
- ❌ Study time: Always 0.0h
- ❌ Last activity: "No activity yet"
- ❌ Active days: 0
- ❌ Sessions only saved if 100% deck completed

### After Fix
- ✅ Study time: Accumulates from all sessions
- ✅ Last activity: Updates on every card interaction
- ✅ Active days: Counts unique study days
- ✅ Sessions saved in all scenarios:
  - Complete deck
  - Navigate away
  - Close browser
  - Tab hidden >5 min
  - Page refresh

## Common Issues & Solutions

### Issue 1: "Session completion sent via beacon: false"
**Cause**: Browser doesn't support sendBeacon or CORS issue
**Solution**: 
- Check browser console for errors
- Verify beacon endpoint is running: http://localhost:3001/api/sessions/test-id/beacon
- Check CORS headers in response

### Issue 2: Stats not updating after session
**Cause**: Session completed but stats API not recalculating
**Solution**:
- Refresh Dashboard page
- Check if session has `completed: true` in database
- Verify `duration_seconds` is not null

### Issue 3: Multiple sessions created
**Cause**: Event listeners firing multiple times
**Solution**:
- Check useEffect dependencies: [sessionId, isStudying]
- Ensure cleanup is removing listeners
- Verify sessionId is stable (not recreating)

### Issue 4: Session duration is 0 or negative
**Cause**: Server time calculation issue
**Solution**:
- Check server timezone settings
- Verify `started_at` timestamp is correct
- Ensure `completed_at` is after `started_at`

## Performance Monitoring

### Console Logs to Watch
```
✅ "Session completed: [uuid]"           - Cleanup working
✅ "Session completion sent via beacon: true" - Beacon working
✅ No duplicate session IDs in logs       - No memory leaks
✅ Event listeners added/removed properly - Clean lifecycle
```

### Network Requests
```
POST /api/sessions/start              - Session created
POST /api/cards/[id]/stats            - Card interactions tracked
POST /api/sessions/[id]/beacon        - Session completed (on close)
PATCH /api/sessions/[id]/complete     - Session completed (navigate)
GET /api/stats/user                   - Stats refreshed
```

## Success Criteria

All tests passing when:
1. ✅ Sessions complete in all 5 scenarios
2. ✅ Study time accumulates correctly
3. ✅ Last activity updates on every study
4. ✅ Active days increment properly
5. ✅ No console errors during session lifecycle
6. ✅ Network requests complete successfully
7. ✅ Database records show completed: true
8. ✅ User stats UI displays correct values

## Next Steps After Testing

If all tests pass:
1. Remove console.log statements (production cleanup)
2. Add user-facing session recovery
3. Implement session analytics dashboard
4. Add study reminders based on activity
5. Create study streak achievements

If tests fail:
1. Check browser console for errors
2. Verify API endpoints are running
3. Check database table structure
4. Review event listener lifecycle
5. Test in different browsers (Chrome, Firefox, Safari)
