# LarahBigDeck Backend - Setup Checklist

Use this checklist to track your backend setup progress.

---

## ✅ Phase 1: Initial Setup

### Prerequisites
- [ ] Node.js 18+ installed
- [ ] npm or bun installed
- [ ] Code editor (VS Code recommended)
- [ ] Postman or Insomnia installed (for testing)
- [ ] Git installed

### Supabase Account
- [ ] Created account at https://supabase.com
- [ ] Email verified
- [ ] Dashboard accessible

---

## ✅ Phase 2: Supabase Project Setup

### Create Project
- [ ] Created new Supabase project
- [ ] Chosen region (closest to users)
- [ ] Saved database password securely
- [ ] Project provisioned (wait ~2 minutes)

### Get API Credentials
- [ ] Navigated to Settings → API
- [ ] Copied Project URL
- [ ] Copied anon/public key
- [ ] Copied service_role key (keep secret!)

### Database Migrations
- [ ] Opened SQL Editor in Supabase Dashboard
- [ ] Created new query
- [ ] Pasted contents of `supabase/migrations/20241022000001_initial_schema.sql`
- [ ] Executed migration successfully
- [ ] Created second query
- [ ] Pasted contents of `supabase/migrations/20241022000002_storage_policies.sql`
- [ ] Executed storage policies successfully

### Verify Database Tables
- [ ] Checked Table Editor
- [ ] Confirmed `decks` table exists
- [ ] Confirmed `cards` table exists
- [ ] Confirmed `uploads` table exists
- [ ] Confirmed `user_profiles` table exists
- [ ] Verified RLS is enabled on all tables

### Storage Setup
- [ ] Navigated to Storage in Dashboard
- [ ] Clicked "New Bucket"
- [ ] Created bucket named `deck-uploads`
- [ ] Set bucket to Private (not public)
- [ ] Verified storage policies applied

### Authentication Setup
- [ ] Navigated to Authentication → Providers
- [ ] Enabled Email provider
- [ ] Configured email confirmations (disable for dev, enable for prod)
- [ ] Saved settings

---

## ✅ Phase 3: Local Backend Setup

### Install Dependencies
- [ ] Navigated to project directory
- [ ] Ran: `npm install next@latest react@latest react-dom@latest`
- [ ] Ran: `npm install @supabase/ssr @supabase/supabase-js`
- [ ] Ran: `npm install --save-dev @types/node @types/react @types/react-dom typescript eslint eslint-config-next`
- [ ] No errors during installation

### Environment Configuration
- [ ] Copied `.env.example` to `.env.local`
- [ ] Opened `.env.local` in editor
- [ ] Pasted `NEXT_PUBLIC_SUPABASE_URL`
- [ ] Pasted `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Pasted `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Saved file
- [ ] Verified `.env.local` is in `.gitignore`

### Package.json Update
- [ ] Added `"dev:api": "next dev -p 3001"` to scripts
- [ ] Added `"build:api": "next build"` to scripts
- [ ] Added `"start:api": "next start -p 3001"` to scripts
- [ ] Saved package.json

### Start Backend Server
- [ ] Ran: `npm run dev:api`
- [ ] Server started successfully
- [ ] No error messages in console
- [ ] Confirmed running on http://localhost:3001

---

## ✅ Phase 4: API Testing

### Authentication Tests
- [ ] Opened Postman/Insomnia
- [ ] Created new request collection
- [ ] Set base URL: `http://localhost:3001`

#### Sign Up
- [ ] Created POST request to `/api/auth/signup`
- [ ] Added body: `{ "email": "test@example.com", "password": "test123" }`
- [ ] Sent request
- [ ] Received 201 status
- [ ] Got user object in response
- [ ] Session cookie set

#### Login
- [ ] Created POST request to `/api/auth/login`
- [ ] Added body: `{ "email": "test@example.com", "password": "test123" }`
- [ ] Sent request
- [ ] Received 200 status
- [ ] Got session in response

#### Get User
- [ ] Created GET request to `/api/auth/user`
- [ ] Sent request (cookies automatically included)
- [ ] Received 200 status
- [ ] Got user data

### Deck Tests
#### Create Deck
- [ ] Created POST request to `/api/decks`
- [ ] Added body: `{ "name": "Test Deck", "description": "Test" }`
- [ ] Sent request
- [ ] Received 201 status
- [ ] Saved `deck.id` from response

#### List Decks
- [ ] Created GET request to `/api/decks`
- [ ] Sent request
- [ ] Received 200 status
- [ ] Saw created deck in list

#### Update Deck
- [ ] Created PATCH request to `/api/decks/{deckId}`
- [ ] Added body: `{ "name": "Updated Deck" }`
- [ ] Sent request
- [ ] Received 200 status
- [ ] Deck name updated

### Card Tests
#### Create Card
- [ ] Created POST request to `/api/decks/{deckId}/cards`
- [ ] Added body: `{ "question": "Test?", "answer": "Test" }`
- [ ] Sent request
- [ ] Received 201 status
- [ ] Saved `card.id`

#### List Cards
- [ ] Created GET request to `/api/decks/{deckId}/cards`
- [ ] Sent request
- [ ] Received 200 status
- [ ] Saw created card

#### Update Card Progress
- [ ] Created PATCH request to `/api/cards/{cardId}`
- [ ] Added body: `{ "difficulty": 2, "times_reviewed": 1 }`
- [ ] Sent request
- [ ] Received 200 status

### Upload Tests
#### Upload File
- [ ] Created POST request to `/api/upload`
- [ ] Set body type to `multipart/form-data`
- [ ] Added file field with a PDF/TXT file
- [ ] Added `deckId` field (optional)
- [ ] Sent request
- [ ] Received 201 status
- [ ] File uploaded to storage
- [ ] Upload record created

#### List Uploads
- [ ] Created GET request to `/api/upload`
- [ ] Sent request
- [ ] Received 200 status
- [ ] Saw uploaded file

### Error Tests
#### Unauthorized Access
- [ ] Logged out (POST `/api/auth/logout`)
- [ ] Tried to GET `/api/decks`
- [ ] Received 401 Unauthorized ✓

#### Invalid Input
- [ ] Tried to create deck without name
- [ ] Received 400 Validation error ✓

#### File Size Limit
- [ ] Tried to upload file > 10MB
- [ ] Received 400 error ✓

---

## ✅ Phase 5: Frontend Integration

### API Client Setup
- [ ] Created `src/lib/api.ts` file
- [ ] Implemented auth functions
- [ ] Implemented deck functions
- [ ] Implemented card functions
- [ ] Added `credentials: 'include'` to all fetch calls

### Authentication UI
- [ ] Created login page
- [ ] Created signup page
- [ ] Added login form
- [ ] Added signup form
- [ ] Tested login flow
- [ ] Tested signup flow
- [ ] Session persists on refresh

### Dashboard Integration
- [ ] Connected dashboard to `/api/decks`
- [ ] Displays user's decks
- [ ] Can create new deck
- [ ] Can delete deck
- [ ] Can rename deck

### Study Page Integration
- [ ] Connected to `/api/decks/{id}/cards`
- [ ] Displays cards
- [ ] Updates card progress on study
- [ ] Tracks times_reviewed
- [ ] Updates difficulty

### Upload Integration
- [ ] Created upload form
- [ ] Connects to `/api/upload`
- [ ] Shows upload progress
- [ ] Displays upload status
- [ ] Shows error messages

---

## ✅ Phase 6: AI Processing (Optional)

### AI Provider Setup
- [ ] Chosen AI provider (OpenAI/Claude/Gemini)
- [ ] Created API account
- [ ] Got API key
- [ ] Added to environment variables

### Processing Implementation
- [ ] Reviewed `src/lib/process-upload.example.ts`
- [ ] Installed text extraction libraries
  - [ ] `npm install pdf-parse` (for PDFs)
  - [ ] `npm install mammoth` (for DOCX)
- [ ] Installed AI SDK
  - [ ] `npm install openai` (if using OpenAI)
- [ ] Implemented text extraction
- [ ] Implemented AI prompt
- [ ] Tested flashcard generation
- [ ] Integrated with upload flow

### Background Job Setup
- [ ] Chosen job system (Edge Functions/Serverless/Queue)
- [ ] Deployed processing function
- [ ] Configured webhook/trigger
- [ ] Tested end-to-end flow
- [ ] Upload → Process → Cards created

---

## ✅ Phase 7: Production Deployment

### Pre-Deployment
- [ ] All environment variables documented
- [ ] Secrets not in git
- [ ] Code tested locally
- [ ] No console errors
- [ ] Database migrations backed up

### Vercel Deployment
- [ ] Code pushed to GitHub
- [ ] Repository connected to Vercel
- [ ] Environment variables set in Vercel
- [ ] Build successful
- [ ] Deployment successful
- [ ] Production URL works

### Post-Deployment
- [ ] Updated CORS in `next.config.js` for production
- [ ] Tested signup/login on production
- [ ] Tested deck creation
- [ ] Tested file upload
- [ ] Verified storage working
- [ ] Enabled email confirmations in Supabase
- [ ] Configured custom domain (if applicable)

### Security Review
- [ ] RLS policies verified
- [ ] Service role key is secret
- [ ] HTTPS enforced
- [ ] Rate limiting configured (if needed)
- [ ] Error messages don't leak sensitive data
- [ ] File upload limits enforced
- [ ] Input validation on all endpoints

---

## ✅ Phase 8: Monitoring & Maintenance

### Supabase Monitoring
- [ ] Checked API usage in Dashboard
- [ ] Reviewed database size
- [ ] Checked storage usage
- [ ] Reviewed auth user count
- [ ] Set up billing alerts (if applicable)

### Error Monitoring
- [ ] Reviewed Supabase logs
- [ ] Checked for 500 errors
- [ ] Monitored failed uploads
- [ ] Reviewed slow queries

### Backups
- [ ] Enabled automatic backups
- [ ] Tested backup restoration
- [ ] Documented backup process

---

## 📊 Progress Tracker

**Backend Setup**: ___% complete
**API Testing**: ___% complete
**Frontend Integration**: ___% complete
**AI Processing**: ___% complete
**Production Deployment**: ___% complete

---

## 🎯 Current Status

**Today's Date**: _______________

**Current Phase**: _______________

**Blockers**: 
- 
- 

**Next Steps**:
1. 
2. 
3. 

---

## 📝 Notes

Use this space for notes, issues encountered, or things to remember:

```
[Your notes here]
```

---

## ✅ Completion Certificate

When all items are checked:

```
🎉 CONGRATULATIONS! 🎉

You have successfully set up the LarahBigDeck backend!

✅ Database configured
✅ API endpoints working
✅ Authentication implemented
✅ Frontend integrated
✅ [Optional] AI processing active
✅ Deployed to production

Date Completed: _______________
Deployed URL: _______________

Next: Build amazing features! 🚀
```
