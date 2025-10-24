# AI Processing Setup Guide

## Overview

The app uses **Google Gemini 2.5 Flash** to automatically extract flashcards from uploaded PDF documents. This guide explains how to set up and deploy the AI processing feature.

## Architecture

```
User uploads PDF → Supabase Storage → Vercel Serverless Function → Gemini API → Cards created in Supabase
```

1. **Frontend (Vite + React)**: User uploads PDF file
2. **Supabase Storage**: File is stored securely
3. **Vercel Serverless Function**: `/api/upload/process` processes the file
4. **Gemini AI**: Extracts content and generates multiple-choice questions
5. **Supabase Database**: Cards are saved to the deck

## Prerequisites

### 1. Get Google Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click **"Create API Key"**
4. Copy the API key (starts with `AIza...`)

### 2. Configure Environment Variables

#### For Local Development

Create `.env` file in the project root:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Google Gemini API Key (REQUIRED for AI processing)
GOOGLE_GEMINI_API_KEY=AIzaSy...your-api-key

# API Base URL (leave empty for production, or use localhost for dev)
VITE_API_BASE_URL=
```

#### For Vercel Production

1. Go to your Vercel project dashboard
2. Navigate to **Settings → Environment Variables**
3. Add the following variables for **Production**, **Preview**, and **Development**:

| Variable Name | Value | Notes |
|---------------|-------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://your-project.supabase.co` | Your Supabase project URL |
| `VITE_SUPABASE_URL` | `https://your-project.supabase.co` | Same as above |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbG...` | Your Supabase anon key |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbG...` | Same as above |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbG...` | Your Supabase service role key (SECRET!) |
| `GOOGLE_GEMINI_API_KEY` | `AIzaSy...` | Your Gemini API key |
| `VITE_API_BASE_URL` | _(leave empty)_ | Leave blank for production |

4. Click **Save**
5. **Redeploy** your application

## How AI Processing Works

### 1. File Upload Flow

```typescript
// User uploads a PDF file
await uploadFile(file, deckName, deckDescription)
// Creates:
// - Deck in Supabase
// - File in Supabase Storage
// - Upload record with status: 'pending'
```

### 2. AI Processing Flow

```typescript
// Trigger AI processing
await processUploadWithAI(uploadId)
// This calls: POST /api/upload/process?uploadId=xxx
// Which:
// 1. Downloads the PDF from Supabase Storage
// 2. Converts to base64
// 3. Sends to Gemini API with prompt
// 4. Parses the JSON response
// 5. Creates cards in Supabase
// 6. Updates upload status to 'completed'
```

### 3. Gemini Prompt Strategy

The AI is instructed to:
- Create **ONLY multiple-choice questions** (4 options each)
- Place the **correct answer in the first position**
- Generate 15-60 questions based on content length
- Cover key concepts, definitions, facts, processes
- Include relevant tags for categorization

Example output format:
```json
{
  "flashcards": [
    {
      "question": "Which of the following best describes...?",
      "answer": "The correct answer",
      "type": "multiple_choice",
      "options": [
        "Correct answer",
        "Plausible distractor 1",
        "Plausible distractor 2",
        "Plausible distractor 3"
      ],
      "tags": ["topic1", "topic2"]
    }
  ]
}
```

## Supported File Types

Currently supported:
- ✅ **PDF** (`.pdf`) - Fully supported by Gemini
- ⚠️ **DOCX** (`.docx`) - Requires conversion to PDF first
- ⚠️ **PowerPoint** (`.pptx`) - Requires conversion to PDF first

### Adding Support for DOCX/PPTX

To support DOCX/PPTX files, you would need to:

1. Install a conversion library (e.g., `libreoffice` or `cloudconvert`)
2. Convert the file to PDF before sending to Gemini
3. Update the serverless function to handle conversion

Example (not implemented):
```typescript
// In api/upload/process.ts
if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
  // Convert DOCX to PDF
  const pdfBuffer = await convertDocxToPdf(fileData)
  base64Data = pdfBuffer.toString('base64')
}
```

## Deployment Structure

```
mybigdeck_app/
├── api/                          # Vercel Serverless Functions
│   └── upload/
│       └── process.ts           # AI processing endpoint
├── dist/                        # Built Vite frontend (static)
├── src/                         # Vite React app source
│   ├── services/
│   │   └── uploadService.ts    # Calls /api/upload/process
│   └── views/
│       └── Upload.tsx          # Upload UI
└── vercel.json                 # Deployment config
```

### vercel.json Configuration

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": null,
  "rewrites": [
    {
      "source": "/api/upload/:uploadId/process",
      "destination": "/api/upload/process?uploadId=:uploadId"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

- **Frontend**: Static Vite build served from `/dist`
- **API Routes**: Serverless functions in `/api` directory
- **Rewrites**: Route API calls to serverless functions

## Testing Locally

### 1. Start Vite Dev Server

```powershell
npm run dev
```

Runs on `http://localhost:8080`

### 2. Test AI Processing

Since you're running the frontend only, the serverless function won't work locally. To test:

**Option A: Deploy to Vercel Preview**
```powershell
# Install Vercel CLI
npm install -g vercel

# Deploy to preview
vercel

# Test with the preview URL
```

**Option B: Use Vercel Dev (requires Next.js)**
```powershell
vercel dev
```

This simulates the Vercel environment locally.

## Troubleshooting

### 1. "AI processing is not available"

**Cause**: `GOOGLE_GEMINI_API_KEY` not set in Vercel environment variables

**Solution**:
1. Go to Vercel → Settings → Environment Variables
2. Add `GOOGLE_GEMINI_API_KEY` with your API key
3. Redeploy

### 2. "Failed to process upload"

**Cause**: API key invalid or rate limited

**Solution**:
1. Verify API key at [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Check API usage/quota
3. Try regenerating the API key

### 3. "Upload not found"

**Cause**: Upload record not created properly

**Solution**:
1. Check Supabase logs
2. Verify `SUPABASE_SERVICE_ROLE_KEY` is set
3. Check database permissions (RLS policies)

### 4. Serverless function timeout

**Cause**: Large PDF files take too long to process

**Solution**:
1. Vercel has a 10-second timeout for Hobby plans (60s for Pro)
2. Consider using Vercel Pro for longer timeouts
3. Or split processing into chunks

### 5. "Parse error" from Gemini

**Cause**: Gemini returned non-JSON response

**Solution**:
1. Check the console logs in Vercel function logs
2. Gemini sometimes wraps JSON in markdown code blocks
3. The function already handles this, but edge cases may occur
4. Try uploading a different document

## API Usage & Costs

### Google Gemini Pricing (as of 2024)

| Model | Free Tier | Paid Pricing |
|-------|-----------|--------------|
| Gemini 1.5 Flash | 1,500 requests/day | $0.075 per 1M input tokens |
| | 1M tokens/minute | $0.30 per 1M output tokens |

**Typical usage per upload:**
- **Input tokens**: ~5,000-50,000 (depending on PDF size)
- **Output tokens**: ~1,000-5,000 (for 15-60 questions)
- **Cost per upload**: ~$0.01-$0.05

**Monthly cost estimate:**
- 100 uploads/month: ~$1-5
- 1,000 uploads/month: ~$10-50

### Vercel Serverless Functions

| Plan | Included Executions | Timeout | Extra Cost |
|------|---------------------|---------|------------|
| Hobby | 100 GB-hrs | 10s | Free |
| Pro | 1,000 GB-hrs | 60s | $20/month |

## Security Considerations

### 1. API Keys

- ✅ `GOOGLE_GEMINI_API_KEY` - Server-side only (safe)
- ✅ `SUPABASE_SERVICE_ROLE_KEY` - Server-side only (safe)
- ⚠️ Never expose these in client-side code

### 2. File Access

- Files are uploaded to Supabase Storage
- RLS policies ensure users can only access their own files
- Serverless function uses service role key to bypass RLS

### 3. Rate Limiting

Currently no rate limiting on AI processing endpoint. Consider adding:

```typescript
// In api/upload/process.ts
const MAX_REQUESTS_PER_HOUR = 10

// Check user's recent requests
const recentRequests = await supabase
  .from('uploads')
  .select('created_at')
  .eq('user_id', userId)
  .gte('created_at', new Date(Date.now() - 3600000).toISOString())

if (recentRequests.data.length >= MAX_REQUESTS_PER_HOUR) {
  return res.status(429).json({ error: 'Rate limit exceeded' })
}
```

## Future Enhancements

### 1. Background Processing

Instead of processing synchronously (user waits), use a queue:

```typescript
// Option A: Supabase Edge Functions + pg_cron
// Option B: Vercel Background Functions
// Option C: External queue (Bull, AWS SQS)
```

### 2. Progress Tracking

Add real-time progress updates:

```typescript
// Update upload.metadata with progress
await supabase
  .from('uploads')
  .update({
    metadata: {
      ...metadata,
      progress: 50,
      status_message: 'Analyzing document...'
    }
  })
  .eq('id', uploadId)
```

### 3. Multiple AI Providers

Support fallback providers:

```typescript
const providers = [
  { name: 'gemini', fn: processWithGemini },
  { name: 'openai', fn: processWithOpenAI },
  { name: 'claude', fn: processWithClaude },
]

for (const provider of providers) {
  try {
    return await provider.fn(document)
  } catch (error) {
    console.log(`${provider.name} failed, trying next...`)
  }
}
```

## Summary

✅ **Setup Complete When:**
1. `GOOGLE_GEMINI_API_KEY` added to Vercel
2. All Supabase environment variables configured
3. App redeployed to Vercel
4. Test upload a PDF → see cards generated automatically

🎉 **You now have AI-powered flashcard generation!**
