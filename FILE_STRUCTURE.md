# Project File Structure

## Complete File Tree

```
flash-flicker-deck/
│
├── 📁 public/
│   └── robots.txt
│
├── 📁 src/
│   │
│   ├── 📁 app/                          # Next.js App Router
│   │   └── 📁 api/                      # Backend API Routes
│   │       │
│   │       ├── 📁 auth/                 # Authentication endpoints
│   │       │   ├── 📁 signup/
│   │       │   │   └── route.ts         # POST /api/auth/signup
│   │       │   ├── 📁 login/
│   │       │   │   └── route.ts         # POST /api/auth/login
│   │       │   ├── 📁 logout/
│   │       │   │   └── route.ts         # POST /api/auth/logout
│   │       │   └── 📁 user/
│   │       │       └── route.ts         # GET /api/auth/user
│   │       │
│   │       ├── 📁 decks/                # Deck management
│   │       │   ├── route.ts             # GET/POST /api/decks
│   │       │   └── 📁 [deckId]/
│   │       │       ├── route.ts         # GET/PATCH/DELETE /api/decks/:id
│   │       │       └── 📁 cards/
│   │       │           └── route.ts     # GET/POST /api/decks/:id/cards
│   │       │
│   │       ├── 📁 cards/                # Card operations
│   │       │   └── 📁 [cardId]/
│   │       │       └── route.ts         # PATCH/DELETE /api/cards/:id
│   │       │
│   │       └── 📁 upload/               # File upload
│   │           ├── route.ts             # POST/GET /api/upload
│   │           └── 📁 [uploadId]/
│   │               └── route.ts         # GET/PATCH/DELETE /api/upload/:id
│   │
│   ├── 📁 components/                   # Frontend React components
│   │   ├── CardEditor.tsx
│   │   ├── FlipCard.tsx
│   │   ├── Header.tsx
│   │   ├── MultipleChoice.tsx
│   │   └── 📁 ui/                       # shadcn/ui components
│   │       ├── accordion.tsx
│   │       ├── alert.tsx
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── dialog.tsx
│   │       ├── input.tsx
│   │       └── ... (30+ UI components)
│   │
│   ├── 📁 data/                         # Mock/test data
│   │   └── mockData.ts
│   │
│   ├── 📁 hooks/                        # React hooks
│   │   ├── use-mobile.tsx
│   │   └── use-toast.ts
│   │
│   ├── 📁 lib/                          # Shared utilities
│   │   ├── utils.ts
│   │   └── process-upload.example.ts    # AI processing template ⭐
│   │
│   ├── 📁 pages/                        # Frontend pages (Vite)
│   │   ├── Dashboard.tsx
│   │   ├── NotFound.tsx
│   │   ├── Study.tsx
│   │   └── Upload.tsx
│   │
│   ├── 📁 types/                        # TypeScript type definitions
│   │   └── database.types.ts            # Supabase database types ⭐
│   │
│   ├── 📁 utils/                        # Utility functions
│   │   └── 📁 supabase/                 # Supabase clients ⭐
│   │       ├── client.ts                # Browser client
│   │       ├── server.ts                # Server client
│   │       └── middleware.ts            # Middleware helper
│   │
│   ├── App.tsx                          # Main React app
│   ├── index.css                        # Global styles
│   ├── main.tsx                         # React entry point
│   ├── middleware.ts                    # Next.js route protection ⭐
│   └── vite-env.d.ts                    # Vite types
│
├── 📁 supabase/                         # Supabase configuration
│   └── 📁 migrations/                   # Database migrations ⭐
│       ├── 20241022000001_initial_schema.sql
│       └── 20241022000002_storage_policies.sql
│
├── 📄 .env.example                      # Environment template ⭐
├── 📄 .env.local                        # Your credentials (create this) ⚠️
├── 📄 .gitignore                        # Git ignore rules
├── 📄 .gitignore.backend                # Additional backend ignores
│
├── 📄 API_TESTING_GUIDE.md             # API testing instructions ⭐
├── 📄 ARCHITECTURE.md                   # System architecture diagrams ⭐
├── 📄 BACKEND_README.md                # Main backend documentation ⭐
├── 📄 DELIVERABLES.md                  # Complete deliverables list ⭐
├── 📄 QUICK_START.md                   # Quick start guide ⭐
├── 📄 README.md                        # Original project README
├── 📄 SETUP_CHECKLIST.md               # Setup progress tracker ⭐
├── 📄 START_HERE.md                    # Start here guide ⭐
├── 📄 SUPABASE_SETUP.md                # Supabase configuration ⭐
│
├── 📄 components.json                   # shadcn/ui config
├── 📄 eslint.config.js                 # ESLint configuration
├── 📄 index.html                        # Vite HTML template
├── 📄 next.config.js                    # Next.js configuration ⭐
├── 📄 package.backend.json              # Backend dependencies reference
├── 📄 package.json                      # Project dependencies
├── 📄 postcss.config.js                # PostCSS config
├── 📄 setup-backend.ps1                # Setup automation script ⭐
├── 📄 tailwind.config.ts               # Tailwind CSS config
├── 📄 tsconfig.app.json                # TypeScript config (app)
├── 📄 tsconfig.backend.json            # TypeScript config (backend) ⭐
├── 📄 tsconfig.json                     # TypeScript config (main)
├── 📄 tsconfig.node.json               # TypeScript config (node)
└── 📄 vite.config.ts                    # Vite configuration

```

## Legend

- 📁 Directory
- 📄 File
- ⭐ New backend file
- ⚠️ File to create (don't commit to git)

---

## Key Directories Explained

### `src/app/api/` - Backend API Routes
All Next.js API endpoints. Each folder represents a route segment.

**Example**: `src/app/api/decks/[deckId]/route.ts` → `/api/decks/:deckId`

### `src/utils/supabase/` - Supabase Clients
Utilities for connecting to Supabase from browser and server.

### `src/types/` - TypeScript Types
Type definitions for type-safe development.

### `supabase/migrations/` - Database Schema
SQL files to create database structure in Supabase.

---

## Important Files

### Backend Core (⭐ New)

| File | Purpose |
|------|---------|
| `src/middleware.ts` | Protects routes requiring authentication |
| `src/utils/supabase/client.ts` | Browser Supabase client |
| `src/utils/supabase/server.ts` | Server Supabase client |
| `src/types/database.types.ts` | Database TypeScript types |
| `next.config.js` | Next.js configuration |
| `.env.local` | Environment variables (you create this) |

### Database

| File | Purpose |
|------|---------|
| `supabase/migrations/20241022000001_initial_schema.sql` | Creates tables, RLS, triggers |
| `supabase/migrations/20241022000002_storage_policies.sql` | Storage bucket policies |

### Documentation (⭐ New)

| File | Purpose |
|------|---------|
| `START_HERE.md` | **Start reading here** |
| `BACKEND_README.md` | Complete backend documentation |
| `API_TESTING_GUIDE.md` | How to test endpoints |
| `QUICK_START.md` | 5-minute quick start |
| `SETUP_CHECKLIST.md` | Track your progress |
| `SUPABASE_SETUP.md` | Supabase configuration guide |
| `ARCHITECTURE.md` | System diagrams |
| `DELIVERABLES.md` | What was delivered |

---

## File Categories

### Frontend (Existing)
```
src/
├── components/     # React components
├── pages/          # Page components
├── data/           # Mock data
└── hooks/          # React hooks
```

### Backend (⭐ New)
```
src/
├── app/api/        # API routes
├── utils/supabase/ # Supabase clients
├── types/          # TypeScript types
├── middleware.ts   # Route protection
└── lib/            # Utilities (inc. AI template)
```

### Configuration
```
Root:
├── .env.local          # Your credentials
├── next.config.js      # Next.js config
├── vite.config.ts      # Vite config
├── tsconfig.*.json     # TypeScript configs
└── package.json        # Dependencies
```

### Database
```
supabase/
└── migrations/         # SQL schema files
```

---

## Files You Need to Create

### Required
1. **`.env.local`** - Copy from `.env.example` and fill in credentials
   ```env
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...
   ```

### Optional (for AI processing)
2. **Processing function** - Based on `src/lib/process-upload.example.ts`
3. **Additional API routes** - As your app grows

---

## Files to NEVER Commit

Add these to `.gitignore`:
```
.env.local
.env
.env.*.local
*.log
.next/
node_modules/
```

---

## Quick Navigation

**Need to...**

- **Set up backend?** → Read `START_HERE.md`
- **Test API?** → Read `API_TESTING_GUIDE.md`
- **Configure Supabase?** → Read `SUPABASE_SETUP.md`
- **Understand architecture?** → Read `ARCHITECTURE.md`
- **Track progress?** → Use `SETUP_CHECKLIST.md`
- **Quick reference?** → Check `QUICK_START.md`

---

## File Count Summary

- **Backend API Routes**: 11 files
- **Supabase Utilities**: 3 files
- **Database Migrations**: 2 files
- **Type Definitions**: 1 file
- **Documentation**: 8 files
- **Configuration**: 6 files
- **Frontend Components**: 40+ files (existing)

**Total New Files**: ~30+ files created for backend

---

## Development Workflow

1. **Edit API routes** in `src/app/api/`
2. **Update types** in `src/types/database.types.ts`
3. **Test with** Postman/Insomnia
4. **Check logs** in terminal running `npm run dev:api`
5. **Frontend integration** - call API from React components

---

## Build Outputs (Gitignored)

These are generated and should NOT be committed:

```
.next/              # Next.js build
dist/               # Vite build
out/                # Next.js export
node_modules/       # Dependencies
.vercel/            # Vercel deployment
```

---

## Production Deployment Files

When deploying to Vercel:
- `next.config.js` - Next.js config
- `package.json` - Dependencies
- `.env.local` → Set in Vercel dashboard
- All `src/` files deployed

---

This structure keeps your frontend (Vite) and backend (Next.js) coexisting in the same project!
