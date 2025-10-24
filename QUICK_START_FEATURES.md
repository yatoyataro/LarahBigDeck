# Quick Start: Stats Tracking & Export/Import

This guide will help you quickly get started with the new enhanced features in LarahBigDeck.

## 🚀 Setup (5 minutes)

### 1. Run the Database Migration

In your Supabase dashboard SQL Editor, run the new migration:

```bash
# File: supabase/migrations/20241024000001_user_stats_and_features.sql
```

This creates:
- `user_card_stats` table
- `study_sessions` table  
- `card_interactions` table
- `deck_statistics` view
- Helper functions and triggers

### 2. Verify Backend API

Ensure your backend is running:

```powershell
cd e:\Codes\projects\IndivProjects\LarahDeck\flash-flicker-deck
npm run dev:api
```

Backend should be available at `http://localhost:3001`

### 3. Start Frontend

```powershell
npm run dev
```

Frontend should be available at `http://localhost:8080`

---

## 📚 Using the New Features

### Study Mode with Stats Tracking

1. **Navigate to a deck** from the dashboard
2. **Click "Start Studying"** to begin a session
3. **Study cards** - your stats are automatically tracked:
   - Each answer updates your accuracy
   - Streaks are calculated in real-time
   - Session duration is recorded

4. **Flag difficult cards**:
   - Click the **flag icon** (star) on any card
   - Flagged cards are marked with a yellow star
   
5. **Review flagged cards**:
   - Toggle **"Show flagged cards only"**
   - Click **"Shuffle"** to randomize the order

6. **Complete the session**:
   - Reach the last card
   - View your session summary with accuracy and duration

### Multiple Choice Mode with Immediate Feedback

1. **Click "Multiple Choice" button** while studying
2. **Select an answer**:
   - ✅ Correct answers turn **green**
   - ❌ Incorrect answers turn **red**, correct answer shows **green**
3. **Auto-advance** to next card after 1.5 seconds
4. **Track your score** in real-time at the top

### Export Your Deck

1. **Open a deck** you want to export
2. **Click "Export Deck"** button
3. **Choose format**:
   - **JSON**: Full structured data
   - **CSV**: Spreadsheet-compatible
4. **Choose options**:
   - ✅ Include stats (attempts, accuracy, flagged status)
   - ⬜ Cards only
5. **File downloads automatically**

### Import a New Deck

1. **Navigate to** `/import` or click "Import Deck" button
2. **Enter deck details**:
   - Deck name (required)
   - Description (optional)
3. **Select format** (CSV or JSON)
4. **Upload your file**:
   - Click "Choose File"
   - Select your `.csv` or `.json` file
5. **Click "Import Deck"**
6. **Review results**:
   - Shows cards inserted/failed
   - Auto-navigates to new deck

---

## 📊 Sample Files

### Download Samples

Use the Import page to download sample CSV/JSON files:

1. Go to `/import` page
2. Scroll to "Download Sample Files"
3. Click **"Sample CSV"** or **"Sample JSON"**

### CSV Format Example

```csv
question,answer,card_type,tags,option_1,option_2,option_3,option_4,correct_option_index
"What is React?","A JavaScript library for building user interfaces","flashcard","react;javascript","","","","",""
"What does JSX stand for?","JavaScript XML","multiple_choice","react","Java Syntax Extension","JSON XML","JavaScript Extra","",0
"What is a hook in React?","Functions that let you use state and lifecycle features","flashcard","react;hooks","","","","",""
```

### JSON Format Example

```json
{
  "cards": [
    {
      "question": "What is React?",
      "answer": "A JavaScript library for building user interfaces",
      "card_type": "flashcard",
      "tags": ["react", "javascript"]
    },
    {
      "question": "What does JSX stand for?",
      "answer": "JavaScript XML",
      "card_type": "multiple_choice",
      "options": [
        "JavaScript XML",
        "Java Syntax Extension",
        "JSON XML",
        "JavaScript Extra"
      ],
      "correct_option_index": 0,
      "tags": ["react"]
    }
  ]
}
```

---

## 🎯 Testing the API Directly

### Using cURL (PowerShell)

#### 1. Get Deck Statistics

```powershell
$response = Invoke-WebRequest -Uri "http://localhost:3001/api/stats/deck/YOUR_DECK_ID" `
  -Method GET `
  -UseDefaultCredentials `
  -ContentType "application/json"

$response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
```

#### 2. Update Card Stats

```powershell
$body = @{
  correct = $true
  interactionType = "multiple_choice"
  responseTime = 5.2
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri "http://localhost:3001/api/cards/CARD_ID/stats" `
  -Method POST `
  -Body $body `
  -ContentType "application/json" `
  -UseDefaultCredentials

$response.Content | ConvertFrom-Json
```

#### 3. Flag a Card

```powershell
$body = @{
  flagged = $true
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri "http://localhost:3001/api/cards/CARD_ID/stats" `
  -Method PATCH `
  -Body $body `
  -ContentType "application/json" `
  -UseDefaultCredentials

$response.Content | ConvertFrom-Json
```

#### 4. Start Study Session

```powershell
$body = @{
  deckId = "YOUR_DECK_ID"
  mode = "flashcard"
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri "http://localhost:3001/api/sessions/start" `
  -Method POST `
  -Body $body `
  -ContentType "application/json" `
  -UseDefaultCredentials

$response.Content | ConvertFrom-Json
```

#### 5. Export Deck

```powershell
# Export as CSV with stats
Invoke-WebRequest -Uri "http://localhost:3001/api/export/deck/DECK_ID?format=csv&includeStats=true" `
  -Method GET `
  -UseDefaultCredentials `
  -OutFile "my_deck.csv"

# Export as JSON without stats
Invoke-WebRequest -Uri "http://localhost:3001/api/export/deck/DECK_ID?format=json&includeStats=false" `
  -Method GET `
  -UseDefaultCredentials `
  -OutFile "my_deck.json"
```

---

## 🔍 Viewing Your Statistics

### In the Dashboard

After using the app, you'll see stats on each deck card:

- **Accuracy percentage**: Color-coded badge
- **Cards studied**: X/Y format
- **Flagged cards**: Count with star icon
- **Last studied**: Relative timestamp

### In the Study View

While studying, you see:

- **Progress bar**: Visual completion indicator
- **Card counter**: "Card X of Y"
- **Score display**: Real-time accuracy in MC mode
- **Flagged indicator**: Yellow star on flagged cards
- **Session stats**: Duration and accuracy at end

### Via API

Get detailed statistics:

```typescript
import * as statsService from '@/services/statsService'

// Get deck stats
const deckStats = await statsService.getDeckStats(deckId)
console.log('Accuracy:', deckStats.statistics.accuracy_percentage + '%')
console.log('Flagged:', deckStats.statistics.flagged_count, 'cards')
console.log('Sessions:', deckStats.statistics.session_count)

// Get card stats
const cardStats = await statsService.getCardStats(cardId)
console.log('Attempts:', cardStats.attempts)
console.log('Correct:', cardStats.correct)
console.log('Streak:', cardStats.current_streak)
```

---

## 🐛 Troubleshooting

### Stats Not Updating

**Problem**: Cards answered but stats don't change

**Solutions**:
1. Check backend console for errors
2. Verify you're logged in (check cookies)
3. Check browser Network tab for failed requests
4. Ensure migration ran successfully in Supabase

### Import Fails

**Problem**: Import returns error or validation fails

**Solutions**:
1. Download and compare with sample files
2. Check CSV has header row
3. Verify required columns: `question`, `answer`
4. Ensure file size < 10MB
5. Check for special characters (wrap in quotes)

### Export Downloads Empty File

**Problem**: Export succeeds but file is empty/invalid

**Solutions**:
1. Verify deck has cards
2. Check you own the deck
3. Try different format (CSV vs JSON)
4. Check backend logs for errors

### Session Not Completing

**Problem**: Can't finish study session

**Solutions**:
1. Ensure you started session properly
2. Complete all cards in the deck
3. Check session ID is valid
4. Look for JavaScript errors in console

---

## 🎓 Best Practices

### Study Habits

1. **Regular Sessions**: Study a little each day
2. **Flag Liberally**: Mark any card you struggle with
3. **Review Flagged**: Use "Show flagged only" weekly
4. **Track Progress**: Check deck stats periodically
5. **Vary Modes**: Alternate between flip and MC modes

### Data Management

1. **Export Regularly**: Backup your decks weekly
2. **Include Stats**: Export with stats for full backup
3. **Organize Tags**: Use consistent tagging system
4. **Validate Imports**: Review sample files before importing
5. **Test Small First**: Import small test deck before bulk import

### Performance Tips

1. **Batch Imports**: Import up to 1000 cards at once
2. **Clean Data**: Remove duplicate cards before import
3. **Use JSON**: For complex card structures
4. **Use CSV**: For simple flashcards and spreadsheet editing
5. **Close Sessions**: Always complete or close study sessions

---

## 📖 Next Steps

1. ✅ Run the database migration
2. ✅ Test study mode with flagging
3. ✅ Try multiple choice with feedback
4. ✅ Export a deck (both formats)
5. ✅ Import sample CSV/JSON
6. ✅ View your statistics
7. 📚 Read [FEATURES.md](./FEATURES.md) for deep dive
8. 🔧 Check [API_TESTING_GUIDE.md](./API_TESTING_GUIDE.md) for API details
9. 💾 Review [database migration](./supabase/migrations/20241024000001_user_stats_and_features.sql)

---

## 🆘 Need Help?

- **Documentation**: See `FEATURES.md` for comprehensive guide
- **API Reference**: See `API_TESTING_GUIDE.md` for all endpoints
- **Backend Setup**: See `BACKEND_README.md` for server configuration
- **Database Schema**: See migration files in `supabase/migrations/`

---

**Happy Studying! 🎉**
