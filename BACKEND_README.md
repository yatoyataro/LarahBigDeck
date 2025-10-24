# LarahBigDeck (LBD) Backend API

Backend API for the LarahBigDeck flashcard application built with Next.js App Router and Supabase.

## 📋 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Setup Instructions](#setup-instructions)
- [API Endpoints](#api-endpoints)
- [Database Schema](#database-schema)
- [Authentication](#authentication)
- [Testing](#testing)
- [Deployment](#deployment)

## 🔍 Overview

This backend provides:
- RESTful API endpoints for deck and card management
- File upload handling with Supabase Storage
- User authentication with Supabase Auth
- Row-level security for data protection
- Type-safe database operations

## 🛠 Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **Language**: TypeScript
- **ORM**: Supabase Client

## 📁 Project Structure

```
flash-flicker-deck/
├── src/
│   ├── app/
│   │   └── api/
│   │       ├── auth/
│   │       │   ├── signup/route.ts      # User registration
│   │       │   ├── login/route.ts       # User login
│   │       │   ├── logout/route.ts      # User logout
│   │       │   └── user/route.ts        # Get current user
│   │       ├── decks/
│   │       │   ├── route.ts             # List/create decks
│   │       │   └── [deckId]/
│   │       │       ├── route.ts         # Get/update/delete deck
│   │       │       └── cards/route.ts   # List/create cards
│   │       ├── cards/
│   │       │   └── [cardId]/route.ts    # Update/delete card
│   │       └── upload/
│   │           ├── route.ts             # Upload file
│   │           └── [uploadId]/route.ts  # Get/update/delete upload
│   ├── utils/
│   │   └── supabase/
│   │       ├── client.ts                # Browser Supabase client
│   │       ├── server.ts                # Server Supabase client
│   │       └── middleware.ts            # Middleware helper
│   ├── types/
│   │   └── database.types.ts            # TypeScript database types
│   └── middleware.ts                    # Route protection middleware
├── supabase/
│   └── migrations/
│       ├── 20241022000001_initial_schema.sql
│       └── 20241022000002_storage_policies.sql
├── .env.example                         # Environment variables template
├── next.config.js                       # Next.js configuration
├── package.backend.json                 # Backend dependencies
└── tsconfig.backend.json                # TypeScript configuration
```

## 🚀 Setup Instructions

### 1. Prerequisites

- Node.js 18+ installed
- Supabase account (https://supabase.com)
- Git

### 2. Create Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Click "New Project"
3. Fill in project details:
   - Name: `larah-big-deck`
   - Database Password: (save this securely)
   - Region: (choose closest to you)
4. Wait for project to be provisioned (~2 minutes)

### 3. Configure Supabase Database

#### Run Database Migrations

1. In Supabase Dashboard, go to **SQL Editor**
2. Click **New Query**
3. Copy the contents of `supabase/migrations/20241022000001_initial_schema.sql`
4. Paste and click **Run**
5. Repeat for `supabase/migrations/20241022000002_storage_policies.sql`

#### Create Storage Bucket

1. Go to **Storage** in Supabase Dashboard
2. Click **New Bucket**
3. Name: `deck-uploads`
4. **Public bucket**: Uncheck (keep private)
5. Click **Create Bucket**
6. Go to **Policies** tab for the `deck-uploads` bucket
7. The policies from the migration should already be applied

### 4. Get Supabase API Keys

1. In Supabase Dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL**: `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key**: `SUPABASE_SERVICE_ROLE_KEY` (⚠️ Keep secret!)

### 5. Configure Authentication

1. In Supabase Dashboard, go to **Authentication** → **Providers**
2. Enable **Email** provider
3. Configure settings:
   - **Enable Email Confirmations**: Toggle based on your needs
   - **Secure Email Change**: Enable
   - **Secure Password Change**: Enable

### 6. Install Backend Dependencies

```powershell
# Navigate to project directory
cd e:\Codes\projects\IndivProjects\LarahDeck\flash-flicker-deck

# Install Next.js and Supabase dependencies
npm install next@latest react@latest react-dom@latest
npm install @supabase/ssr @supabase/supabase-js
npm install --save-dev @types/node @types/react @types/react-dom typescript eslint eslint-config-next
```

### 7. Configure Environment Variables

```powershell
# Copy the example file
Copy-Item .env.example .env.local

# Edit .env.local with your Supabase credentials
notepad .env.local
```

Add your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### 8. Update package.json

Add Next.js scripts to your existing `package.json`:

```json
{
  "scripts": {
    "dev": "vite",
    "dev:api": "next dev -p 3001",
    "build": "vite build",
    "build:api": "next build",
    "start:api": "next start -p 3001"
  }
}
```

### 9. Start Development Servers

You'll need to run both the Vite frontend and Next.js API:

```powershell
# Terminal 1 - Start Vite frontend
npm run dev

# Terminal 2 - Start Next.js API
npm run dev:api
```

- Frontend: http://localhost:8080
- Backend API: http://localhost:3001

## 📡 API Endpoints

### Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/signup` | Register new user | No |
| POST | `/api/auth/login` | Login user | No |
| POST | `/api/auth/logout` | Logout user | Yes |
| GET | `/api/auth/user` | Get current user | Yes |

#### POST /api/auth/signup

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "displayName": "John Doe" // optional
}
```

**Response (201):**
```json
{
  "user": { /* user object */ },
  "session": { /* session object */ },
  "message": "User registered successfully"
}
```

#### POST /api/auth/login

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response (200):**
```json
{
  "user": { /* user object */ },
  "session": { /* session object */ },
  "message": "Logged in successfully"
}
```

### Decks

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/decks` | List all user's decks | Yes |
| POST | `/api/decks` | Create new deck | Yes |
| GET | `/api/decks/[deckId]` | Get specific deck | Yes |
| PATCH | `/api/decks/[deckId]` | Update deck | Yes |
| DELETE | `/api/decks/[deckId]` | Delete deck | Yes |

#### GET /api/decks

**Response (200):**
```json
{
  "decks": [
    {
      "id": "uuid",
      "name": "Spanish Vocabulary",
      "description": "Basic Spanish words",
      "card_count": 25,
      "created_at": "2024-10-22T10:00:00Z",
      "updated_at": "2024-10-22T10:00:00Z",
      "last_studied_at": null
    }
  ]
}
```

#### POST /api/decks

**Request Body:**
```json
{
  "name": "Spanish Vocabulary",
  "description": "Basic Spanish words" // optional
}
```

**Response (201):**
```json
{
  "deck": {
    "id": "uuid",
    "name": "Spanish Vocabulary",
    "description": "Basic Spanish words",
    "card_count": 0,
    "created_at": "2024-10-22T10:00:00Z"
  }
}
```

#### PATCH /api/decks/[deckId]

**Request Body:**
```json
{
  "name": "Updated Deck Name", // optional
  "description": "Updated description" // optional
}
```

### Cards

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/decks/[deckId]/cards` | List all cards in deck | Yes |
| POST | `/api/decks/[deckId]/cards` | Create new card | Yes |
| PATCH | `/api/cards/[cardId]` | Update card progress | Yes |
| DELETE | `/api/cards/[cardId]` | Delete card | Yes |

#### GET /api/decks/[deckId]/cards

**Response (200):**
```json
{
  "cards": [
    {
      "id": "uuid",
      "deck_id": "uuid",
      "question": "What is 'hello' in Spanish?",
      "answer": "hola",
      "card_type": "flashcard",
      "difficulty": 0,
      "times_reviewed": 5,
      "times_correct": 4,
      "position": 0,
      "created_at": "2024-10-22T10:00:00Z"
    }
  ]
}
```

#### POST /api/decks/[deckId]/cards

**Request Body (Flashcard):**
```json
{
  "question": "What is 'hello' in Spanish?",
  "answer": "hola",
  "card_type": "flashcard", // optional, default: "flashcard"
  "tags": ["greetings", "basic"] // optional
}
```

**Request Body (Multiple Choice):**
```json
{
  "question": "What is the capital of France?",
  "answer": "Paris",
  "card_type": "multiple_choice",
  "options": ["London", "Paris", "Berlin", "Madrid"],
  "correct_option_index": 1
}
```

#### PATCH /api/cards/[cardId]

**Request Body:**
```json
{
  "difficulty": 3,
  "times_reviewed": 6,
  "times_correct": 5,
  "last_reviewed_at": "2024-10-22T12:00:00Z",
  "next_review_at": "2024-10-23T12:00:00Z"
}
```

### File Upload

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/upload` | Upload file for processing | Yes |
| GET | `/api/upload?deckId=[id]` | List uploads (optionally filtered) | Yes |
| GET | `/api/upload/[uploadId]` | Get upload status | Yes |
| PATCH | `/api/upload/[uploadId]` | Update upload status | Yes |
| DELETE | `/api/upload/[uploadId]` | Delete upload and file | Yes |

#### POST /api/upload

**Request (multipart/form-data):**
```
file: <PDF/DOCX/TXT file>
deckId: <uuid> // optional
```

**Response (201):**
```json
{
  "upload": {
    "id": "uuid",
    "file_name": "study-notes.pdf",
    "file_url": "https://...",
    "status": "pending",
    "created_at": "2024-10-22T10:00:00Z"
  },
  "message": "File uploaded successfully. Processing will begin shortly."
}
```

**Note**: After upload, you would trigger a background job to:
1. Extract text from the file
2. Use AI (OpenAI, Claude, etc.) to generate flashcards
3. Create cards in the database
4. Update upload status to 'completed'

## 🗄 Database Schema

### Tables

#### `decks`
- `id` (UUID, PK)
- `user_id` (UUID, FK → auth.users)
- `name` (VARCHAR)
- `description` (TEXT)
- `card_count` (INTEGER)
- `created_at`, `updated_at` (TIMESTAMP)
- `last_studied_at` (TIMESTAMP)

#### `cards`
- `id` (UUID, PK)
- `deck_id` (UUID, FK → decks)
- `upload_id` (UUID, FK → uploads)
- `question`, `answer` (TEXT)
- `card_type` (ENUM: flashcard, multiple_choice, true_false)
- `options` (JSONB)
- `correct_option_index` (INTEGER)
- `difficulty` (INTEGER 0-5)
- `times_reviewed`, `times_correct` (INTEGER)
- `position` (INTEGER)
- `tags` (TEXT[])
- `created_at`, `updated_at` (TIMESTAMP)

#### `uploads`
- `id` (UUID, PK)
- `user_id` (UUID, FK → auth.users)
- `deck_id` (UUID, FK → decks)
- `file_name`, `file_url` (TEXT)
- `file_size` (BIGINT)
- `mime_type` (VARCHAR)
- `status` (ENUM: pending, processing, completed, failed)
- `error_message` (TEXT)
- `metadata` (JSONB)
- `created_at`, `processed_at` (TIMESTAMP)

### Row Level Security (RLS)

All tables have RLS enabled with policies ensuring users can only access their own data.

## 🔐 Authentication

### Session Management

- Sessions are managed via HTTP-only cookies
- Session automatically refreshed on each request via middleware
- Access tokens are short-lived for security

### Protected Routes

The following routes require authentication:
- `/dashboard`
- `/upload`
- `/deck/*`
- `/study/*`

Unauthenticated users are redirected to `/login`.

### Frontend Integration

```typescript
// Example: Login from your Vite frontend
async function login(email: string, password: string) {
  const response = await fetch('http://localhost:3001/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // Important for cookies
    body: JSON.stringify({ email, password })
  });
  
  const data = await response.json();
  return data;
}

// Example: Fetch decks
async function fetchDecks() {
  const response = await fetch('http://localhost:3001/api/decks', {
    credentials: 'include' // Important for auth cookies
  });
  
  const data = await response.json();
  return data.decks;
}
```

## 🧪 Testing

### Manual Testing with Postman/Insomnia

1. **Create Collection**: Import or create requests for each endpoint
2. **Set Base URL**: `http://localhost:3001`
3. **Test Authentication Flow**:

```
1. POST /api/auth/signup
   Body: { "email": "test@example.com", "password": "test123" }
   
2. POST /api/auth/login
   Body: { "email": "test@example.com", "password": "test123" }
   Save the session cookie!
   
3. GET /api/auth/user
   Use saved cookie
   
4. POST /api/decks
   Body: { "name": "Test Deck" }
   
5. GET /api/decks
   Should return the created deck
```

### Test Cases

#### Authentication Tests
- ✅ Sign up with valid credentials
- ✅ Sign up with invalid email format
- ✅ Login with correct credentials
- ✅ Login with incorrect password
- ✅ Access protected route without auth (should fail)
- ✅ Logout successfully

#### Deck Tests
- ✅ Create deck with valid name
- ✅ Create deck without name (should fail)
- ✅ List all user decks
- ✅ Update deck name
- ✅ Delete deck (should cascade delete cards)
- ✅ Access another user's deck (should fail)

#### Card Tests
- ✅ Create flashcard in owned deck
- ✅ Create multiple choice card
- ✅ List cards for deck
- ✅ Update card study progress
- ✅ Delete card (should update deck card_count)

#### Upload Tests
- ✅ Upload PDF file
- ✅ Upload file > 10MB (should fail)
- ✅ Upload unsupported file type (should fail)
- ✅ List uploads for user
- ✅ Delete upload and file

## 🚀 Deployment

### Deploy to Vercel

1. Push code to GitHub
2. Go to [Vercel](https://vercel.com)
3. Import repository
4. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./`
   - **Build Command**: `npm run build:api`
5. Add environment variables in Vercel dashboard
6. Deploy

### Deploy to Railway/Render

Similar process - ensure environment variables are set.

### Production Checklist

- ✅ Set up proper CORS for production frontend URL
- ✅ Enable Supabase email confirmations
- ✅ Set up proper error monitoring (Sentry, etc.)
- ✅ Configure rate limiting
- ✅ Set up database backups
- ✅ Review RLS policies
- ✅ Use HTTPS only

## 🔧 Next Steps (AI Model Integration)

To complete the file processing pipeline:

1. **Create Background Job System**:
   - Use Supabase Edge Functions, or
   - Vercel Serverless Functions, or
   - Separate worker service

2. **Implement File Processing**:
   ```typescript
   // Example: supabase/functions/process-upload/index.ts
   async function processUpload(uploadId: string) {
     // 1. Fetch upload from database
     // 2. Download file from storage
     // 3. Extract text based on file type
     // 4. Send to AI model (OpenAI, Claude, etc.)
     // 5. Parse AI response into cards
     // 6. Batch insert cards
     // 7. Update upload status to 'completed'
   }
   ```

3. **AI Prompt Example**:
   ```
   Extract flashcards from this text. Return JSON array:
   [
     {
       "question": "...",
       "answer": "...",
       "card_type": "flashcard"
     }
   ]
   ```

## 📝 License

MIT

## 👥 Support

For issues or questions, please open a GitHub issue.
