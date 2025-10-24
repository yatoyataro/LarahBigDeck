# LarahBigDeck Backend - Quick Start Guide

## 🚀 Quick Setup (5 Minutes)

### 1. Install Dependencies
```powershell
npm install next@latest react@latest react-dom@latest @supabase/ssr @supabase/supabase-js
npm install --save-dev @types/node @types/react @types/react-dom typescript eslint eslint-config-next
```

### 2. Create Supabase Project
1. Go to https://supabase.com
2. Create new project
3. Wait for provisioning (~2 min)

### 3. Run Database Migrations
In Supabase Dashboard → SQL Editor:
- Run `supabase/migrations/20241022000001_initial_schema.sql`
- Run `supabase/migrations/20241022000002_storage_policies.sql`

### 4. Create Storage Bucket
In Supabase Dashboard → Storage:
- Click "New Bucket"
- Name: `deck-uploads`
- Public: ❌ (keep private)

### 5. Configure Environment
```powershell
Copy-Item .env.example .env.local
notepad .env.local
```

Add your Supabase credentials from Dashboard → Settings → API

### 6. Start Backend
```powershell
npm run dev:api
```

Backend running at: http://localhost:3001

### 7. Test API
Use Postman/Insomnia or:
```powershell
# Test health check (create a simple test endpoint first)
curl http://localhost:3001/api/auth/user
```

---

## 📁 File Structure Overview

```
Key Backend Files:
├── src/app/api/                    # API Routes
│   ├── auth/                       # Authentication endpoints
│   ├── decks/                      # Deck management
│   ├── cards/                      # Card operations
│   └── upload/                     # File uploads
├── src/utils/supabase/             # Supabase clients
├── src/types/database.types.ts     # TypeScript types
├── src/middleware.ts               # Route protection
├── supabase/migrations/            # Database schema
└── .env.local                      # Your credentials (gitignored)
```

---

## 🔑 API Endpoints Quick Reference

### Auth
- `POST /api/auth/signup` - Register
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/user` - Get user

### Decks
- `GET /api/decks` - List decks
- `POST /api/decks` - Create deck
- `GET /api/decks/[id]` - Get deck
- `PATCH /api/decks/[id]` - Update deck
- `DELETE /api/decks/[id]` - Delete deck

### Cards
- `GET /api/decks/[id]/cards` - List cards
- `POST /api/decks/[id]/cards` - Create card
- `PATCH /api/cards/[id]` - Update card
- `DELETE /api/cards/[id]` - Delete card

### Upload
- `POST /api/upload` - Upload file
- `GET /api/upload` - List uploads
- `GET /api/upload/[id]` - Get upload
- `PATCH /api/upload/[id]` - Update status
- `DELETE /api/upload/[id]` - Delete upload

---

## 🧪 Quick Test Sequence

```javascript
// 1. Sign Up
POST http://localhost:3001/api/auth/signup
{
  "email": "test@example.com",
  "password": "test123"
}

// 2. Create Deck
POST http://localhost:3001/api/decks
{
  "name": "Test Deck"
}
// Save deck.id

// 3. Create Card
POST http://localhost:3001/api/decks/{deckId}/cards
{
  "question": "Test question?",
  "answer": "Test answer"
}

// 4. List Cards
GET http://localhost:3001/api/decks/{deckId}/cards
```

---

## 🔧 Common Commands

```powershell
# Start backend dev server
npm run dev:api

# Start both frontend and backend
# Terminal 1:
npm run dev

# Terminal 2:
npm run dev:api

# Build for production
npm run build:api

# Start production server
npm run start:api

# Type check
npm run type-check
```

---

## 📚 Documentation Files

- `BACKEND_README.md` - Complete setup guide
- `API_TESTING_GUIDE.md` - Detailed API testing
- `SUPABASE_SETUP.md` - Supabase configuration
- `src/lib/process-upload.example.ts` - AI integration template

---

## 🐛 Troubleshooting

### Issue: Module not found errors
**Fix:** Install dependencies:
```powershell
npm install
```

### Issue: Can't connect to Supabase
**Fix:** Check `.env.local` has correct credentials

### Issue: 401 Unauthorized
**Fix:** Login first, ensure cookies are enabled

### Issue: RLS blocking queries
**Fix:** This is correct! Verify you're authenticated

### Issue: File upload fails
**Fix:** Check storage bucket exists and policies are applied

---

## 🚢 Production Deployment

### Vercel (Recommended)
1. Push to GitHub
2. Import to Vercel
3. Set environment variables
4. Deploy

### Environment Variables for Production
```env
NEXT_PUBLIC_SUPABASE_URL=your-production-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key
SUPABASE_SERVICE_ROLE_KEY=your-secret-key
```

---

## 🔐 Security Checklist

- ✅ Row Level Security enabled
- ✅ Service role key kept secret
- ✅ CORS configured for production domain
- ✅ File upload limits enforced
- ✅ Input validation on all endpoints
- ✅ HTTPS only in production

---

## 📞 Getting Help

- Read `BACKEND_README.md` for detailed docs
- Check `API_TESTING_GUIDE.md` for testing examples
- Review Supabase docs: https://supabase.com/docs
- Check console logs for errors

---

## ✅ Next Steps

1. ✅ Backend is running
2. 🔄 Integrate with your Vite frontend
3. 🤖 Implement AI flashcard generation (see `process-upload.example.ts`)
4. 🎨 Build UI components
5. 🚀 Deploy to production

---

**Happy Building! 🎉**
