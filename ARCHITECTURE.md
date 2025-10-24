# LarahBigDeck Architecture Diagram

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Vite + React)                  │
│                     http://localhost:8080                        │
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │Dashboard │  │  Upload  │  │  Study   │  │ Not Found│       │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
│                                                                  │
│  ┌────────────────────────────────────────────────────┐        │
│  │         Components (shadcn/ui)                      │        │
│  │  FlipCard | CardEditor | MultipleChoice | Header   │        │
│  └────────────────────────────────────────────────────┘        │
└───────────────────────────┬─────────────────────────────────────┘
                            │ HTTP/REST API
                            │ (CORS enabled)
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                   BACKEND API (Next.js App Router)               │
│                     http://localhost:3001                        │
│                                                                  │
│  ┌───────────────────────────────────────────────────────┐     │
│  │                    Middleware                          │     │
│  │  • Session refresh                                     │     │
│  │  • Route protection                                    │     │
│  │  • Auth verification                                   │     │
│  └───────────────────────────────────────────────────────┘     │
│                            │                                     │
│  ┌─────────────────────────┴──────────────────────────┐        │
│  │              API Routes (/app/api/)                 │        │
│  │                                                      │        │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐   │        │
│  │  │   /auth    │  │  /decks    │  │  /cards    │   │        │
│  │  │  • signup  │  │  • list    │  │  • update  │   │        │
│  │  │  • login   │  │  • create  │  │  • delete  │   │        │
│  │  │  • logout  │  │  • update  │  │            │   │        │
│  │  │  • user    │  │  • delete  │  │            │   │        │
│  │  └────────────┘  └────────────┘  └────────────┘   │        │
│  │                                                      │        │
│  │  ┌────────────┐                                     │        │
│  │  │  /upload   │  ← File processing trigger         │        │
│  │  │  • POST    │                                     │        │
│  │  │  • GET     │                                     │        │
│  │  │  • PATCH   │                                     │        │
│  │  │  • DELETE  │                                     │        │
│  │  └────────────┘                                     │        │
│  └─────────────────────────────────────────────────────┘        │
│                            │                                     │
│  ┌─────────────────────────┴──────────────────────────┐        │
│  │         Supabase Client Utilities                   │        │
│  │  • client.ts (browser)                              │        │
│  │  • server.ts (server + admin)                       │        │
│  │  • middleware.ts (session refresh)                  │        │
│  └─────────────────────────────────────────────────────┘        │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      SUPABASE BACKEND                            │
│                                                                  │
│  ┌───────────────────────────────────────────────────────┐     │
│  │              Authentication (Supabase Auth)            │     │
│  │  • Email/Password provider                             │     │
│  │  • Session management                                  │     │
│  │  • User registration                                   │     │
│  │  • Cookie-based sessions                               │     │
│  └───────────────────────────────────────────────────────┘     │
│                            │                                     │
│  ┌─────────────────────────┴──────────────────────────┐        │
│  │         PostgreSQL Database (with RLS)              │        │
│  │                                                      │        │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐         │        │
│  │  │  decks   │  │  cards   │  │ uploads  │         │        │
│  │  │          │  │          │  │          │         │        │
│  │  │ • id     │  │ • id     │  │ • id     │         │        │
│  │  │ • name   │  │ • deck_id│  │ • user_id│         │        │
│  │  │ • user_id│  │ • question│ • file_url│         │        │
│  │  │ • count  │  │ • answer │  │ • status │         │        │
│  │  └────┬─────┘  └────┬─────┘  └──────────┘         │        │
│  │       │             │                               │        │
│  │       └──────┬──────┘                               │        │
│  │              │ (Foreign Keys)                       │        │
│  │                                                      │        │
│  │  ┌──────────────────────────────────────┐          │        │
│  │  │         user_profiles                 │          │        │
│  │  │  • id (→ auth.users)                 │          │        │
│  │  │  • display_name                      │          │        │
│  │  │  • preferences                       │          │        │
│  │  └──────────────────────────────────────┘          │        │
│  │                                                      │        │
│  │  Features:                                          │        │
│  │  • Row Level Security (RLS)                        │        │
│  │  • Automatic triggers                              │        │
│  │  • Indexes for performance                         │        │
│  │  • Cascading deletes                               │        │
│  └─────────────────────────────────────────────────────┘        │
│                            │                                     │
│  ┌─────────────────────────┴──────────────────────────┐        │
│  │          Storage (Supabase Storage)                 │        │
│  │                                                      │        │
│  │  Bucket: deck-uploads (Private)                     │        │
│  │  ┌────────────────────────────────┐                │        │
│  │  │  {user_id}/                    │                │        │
│  │  │    ├── file1.pdf               │                │        │
│  │  │    ├── file2.docx              │                │        │
│  │  │    └── file3.txt               │                │        │
│  │  └────────────────────────────────┘                │        │
│  │                                                      │        │
│  │  Policies:                                          │        │
│  │  • Users can only access their own files           │        │
│  │  • Upload/Download/Delete permissions per user     │        │
│  └─────────────────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│              AI PROCESSING PIPELINE (Optional/Future)            │
│                                                                  │
│  ┌───────────────────────────────────────────────────────┐     │
│  │              Background Job Processor                  │     │
│  │  (Supabase Edge Function / Vercel Serverless)         │     │
│  │                                                         │     │
│  │  Trigger: New upload created                           │     │
│  │                                                         │     │
│  │  ┌─────────────────────────────────────────────┐      │     │
│  │  │  1. Download file from Storage              │      │     │
│  │  └─────────────┬───────────────────────────────┘      │     │
│  │                ▼                                        │     │
│  │  ┌─────────────────────────────────────────────┐      │     │
│  │  │  2. Extract text (PDF/DOCX/TXT)             │      │     │
│  │  │     • pdf-parse for PDFs                    │      │     │
│  │  │     • mammoth for DOCX                      │      │     │
│  │  │     • direct read for TXT                   │      │     │
│  │  └─────────────┬───────────────────────────────┘      │     │
│  │                ▼                                        │     │
│  │  ┌─────────────────────────────────────────────┐      │     │
│  │  │  3. AI Model Generation                     │      │     │
│  │  │     • OpenAI GPT-4                          │      │     │
│  │  │     • Anthropic Claude                      │      │     │
│  │  │     • Google Gemini                         │      │     │
│  │  │                                              │      │     │
│  │  │  Prompt: "Generate flashcards from text"   │      │     │
│  │  └─────────────┬───────────────────────────────┘      │     │
│  │                ▼                                        │     │
│  │  ┌─────────────────────────────────────────────┐      │     │
│  │  │  4. Parse AI Response                       │      │     │
│  │  │     • Extract questions/answers             │      │     │
│  │  │     • Validate format                       │      │     │
│  │  │     • Handle multiple choice options        │      │     │
│  │  └─────────────┬───────────────────────────────┘      │     │
│  │                ▼                                        │     │
│  │  ┌─────────────────────────────────────────────┐      │     │
│  │  │  5. Insert Cards into Database              │      │     │
│  │  │     • Batch insert                          │      │     │
│  │  │     • Update upload status                  │      │     │
│  │  └─────────────────────────────────────────────┘      │     │
│  └───────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. Authentication Flow
```
User → Frontend → POST /api/auth/login
                ↓
         Supabase Auth verifies
                ↓
         Session cookie set
                ↓
         User object returned
```

### 2. Deck Creation Flow
```
User → Frontend → POST /api/decks
                ↓
         Middleware checks auth
                ↓
         Server Supabase client
                ↓
         Insert into decks table (RLS applied)
                ↓
         Deck object returned
```

### 3. File Upload & Processing Flow
```
User selects file → Frontend
                ↓
         POST /api/upload (multipart/form-data)
                ↓
         Upload to Storage bucket
                ↓
         Create upload record (status: pending)
                ↓
         [Optional] Trigger background job
                ↓
         Download file
                ↓
         Extract text
                ↓
         Send to AI model
                ↓
         Generate flashcards
                ↓
         Insert cards into database
                ↓
         Update upload status (completed)
```

### 4. Study Session Flow
```
User → GET /api/decks/{id}/cards
                ↓
         Fetch cards (ordered by position)
                ↓
         User reviews card
                ↓
         PATCH /api/cards/{id}
                ↓
         Update study metadata:
         • times_reviewed++
         • difficulty
         • next_review_at
```

## Security Layers

```
┌─────────────────────────────────────┐
│  1. Middleware                      │
│     • Session validation            │
│     • Route protection              │
└──────────────┬──────────────────────┘
               ▼
┌─────────────────────────────────────┐
│  2. API Route Handlers              │
│     • Input validation              │
│     • Error handling                │
└──────────────┬──────────────────────┘
               ▼
┌─────────────────────────────────────┐
│  3. Supabase RLS                    │
│     • User data isolation           │
│     • Automatic enforcement         │
└──────────────┬──────────────────────┘
               ▼
┌─────────────────────────────────────┐
│  4. Storage Policies                │
│     • File access control           │
│     • User-specific paths           │
└─────────────────────────────────────┘
```

## Technology Stack

### Frontend (Existing)
- **Framework**: Vite + React
- **UI**: shadcn/ui (Radix UI components)
- **Styling**: Tailwind CSS
- **State**: React Query
- **Routing**: React Router

### Backend (New)
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Runtime**: Node.js 18+

### Database & Services
- **Database**: PostgreSQL (Supabase)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **ORM**: Supabase Client

### Future/Optional
- **AI Models**: OpenAI GPT-4, Claude, Gemini
- **Text Extraction**: pdf-parse, mammoth
- **Background Jobs**: Supabase Edge Functions

## Deployment Architecture

### Development
```
Vite Dev Server (port 8080)
         +
Next.js Dev Server (port 3001)
         +
Supabase Cloud (or local)
```

### Production
```
Vercel (Frontend + API)
         +
Supabase Cloud (Database + Auth + Storage)
         +
[Optional] Edge Functions for AI processing
```

## File Organization

```
flash-flicker-deck/
├── src/
│   ├── app/api/              ← Backend API routes
│   ├── components/           ← Frontend components
│   ├── pages/                ← Frontend pages
│   ├── utils/supabase/       ← Supabase clients
│   ├── types/                ← TypeScript types
│   └── lib/                  ← Shared utilities
├── supabase/
│   └── migrations/           ← SQL schema
├── public/                   ← Static assets
├── *.md                      ← Documentation
├── .env.local                ← Environment vars (gitignored)
├── next.config.js            ← Next.js config
└── vite.config.ts            ← Vite config
```

## Environment Configuration

### Development (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=local-anon-key
SUPABASE_SERVICE_ROLE_KEY=local-service-key
```

### Production
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=prod-anon-key
SUPABASE_SERVICE_ROLE_KEY=prod-service-key (secret)
```

## Performance Considerations

1. **Database Indexing**: All foreign keys and frequently queried columns indexed
2. **Batch Operations**: Cards can be inserted in batches
3. **Automatic Counting**: Deck card_count updated via triggers
4. **RLS Optimization**: Policies use indexed columns
5. **Storage**: CDN-backed file delivery
6. **Caching**: Session caching in cookies
7. **API Rate Limiting**: Can be added via middleware

## Scalability Notes

- **Horizontal**: Stateless API allows multiple instances
- **Database**: Supabase PostgreSQL can scale
- **Storage**: Supabase Storage is CDN-backed
- **Processing**: Background jobs can scale independently
- **Authentication**: Managed by Supabase (scales automatically)
