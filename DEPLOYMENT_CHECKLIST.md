# 🚀 AI Processing Deployment Checklist

## Prerequisites
- [ ] Google Gemini API Key obtained from https://aistudio.google.com/app/apikey
- [ ] Supabase project configured with all necessary tables
- [ ] Vercel account set up and connected to your GitHub repo

## Deployment Steps

### 1. Configure Vercel Environment Variables ⚙️

Go to Vercel Dashboard → Your Project → **Settings** → **Environment Variables**

Add the following for **Production**, **Preview**, and **Development**:

#### Required Variables

| Variable | Value | Where to Get It |
|----------|-------|-----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxxx.supabase.co` | Supabase Dashboard → Settings → API |
| `VITE_SUPABASE_URL` | `https://xxxxx.supabase.co` | Same as above |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbG...` | Supabase Dashboard → Settings → API → `anon` key |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbG...` | Same as above |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbG...` | Supabase Dashboard → Settings → API → `service_role` key ⚠️ |
| `GOOGLE_GEMINI_API_KEY` | `AIzaSy...` | https://aistudio.google.com/app/apikey |
| `VITE_API_BASE_URL` | _(leave empty)_ | Leave blank for production |

⚠️ **Important**: 
- `SUPABASE_SERVICE_ROLE_KEY` bypasses Row Level Security - keep it secret!
- `GOOGLE_GEMINI_API_KEY` is used server-side only (safe)

### 2. Deploy to Vercel 🚀

```powershell
# Option A: Push to GitHub (auto-deploy if connected)
git push

# Option B: Manual deploy with Vercel CLI
npm install -g vercel
vercel --prod
```

### 3. Verify Deployment ✅

After deployment completes:

1. **Check Build Logs**
   - Go to Vercel Dashboard → Deployments → Latest Deployment
   - Verify no build errors
   - Confirm "Serverless Functions" section shows `/api/upload/process`

2. **Test the App**
   - Visit your deployed URL: `https://your-app.vercel.app`
   - Log in / Sign up
   - Try uploading a PDF file
   - Wait for AI processing to complete
   - Verify flashcards are created

3. **Check Function Logs**
   - Go to Vercel Dashboard → Deployments → Latest → Functions
   - Click on `/api/upload/process`
   - Monitor real-time logs during upload

### 4. Test AI Processing 🧪

**Sample Test:**

1. Upload a simple PDF (1-2 pages)
2. Expected behavior:
   - File uploads immediately
   - Progress bar shows "Processing with AI..."
   - After 5-30 seconds, see "Success! Created X flashcards"
   - Navigate to study page with generated cards

**Example PDF to test:**
Create a simple PDF with text like:
```
Title: Introduction to Machine Learning

Machine Learning is a subset of artificial intelligence that enables 
systems to learn and improve from experience without being explicitly 
programmed. The main types are supervised learning, unsupervised learning, 
and reinforcement learning.

Supervised learning uses labeled data to train models. Common algorithms 
include linear regression, decision trees, and neural networks.
```

Expected output: ~3-5 multiple choice questions about ML concepts

## Troubleshooting 🔧

### Issue: "AI processing is not available"

**Cause**: Missing `GOOGLE_GEMINI_API_KEY`

**Fix**:
1. Add the API key to Vercel environment variables
2. Redeploy (or click "Redeploy" button)

### Issue: Function times out (10 seconds)

**Cause**: Vercel Hobby plan has 10-second timeout

**Fix**:
1. Upgrade to Vercel Pro (60-second timeout)
2. Or reduce PDF size (< 5 pages for Hobby plan)
3. Or implement background processing

### Issue: "Deck not found" error

**Cause**: Deck creation failed before AI processing

**Fix**:
1. Check Supabase logs
2. Verify RLS policies allow user to create decks
3. Check `SUPABASE_SERVICE_ROLE_KEY` is correct

### Issue: No cards created

**Cause**: Gemini response parsing failed

**Fix**:
1. Check Vercel function logs for parse errors
2. Verify the PDF has readable text (not scanned images)
3. Try a different PDF with clear, structured content

### Issue: "Rate limit exceeded" from Gemini

**Cause**: Too many requests to Gemini API

**Fix**:
1. Check your Gemini quota: https://aistudio.google.com
2. Wait 1 minute and try again
3. Upgrade to paid Gemini plan if needed

## Monitoring 📊

### Check Function Execution Count

Vercel Dashboard → Usage → Serverless Function Executions

- **Free tier**: 100 GB-hours/month
- Each AI processing call uses ~0.01-0.05 GB-hours

### Check Gemini API Usage

Google AI Studio → API Keys → Your Key → Usage

- **Free tier**: 1,500 requests/day
- Monitor token usage to estimate costs

### Supabase Storage Usage

Supabase Dashboard → Storage → Buckets → `deck-uploads`

- Monitor file count and total size
- Set up retention policies if needed

## Success Criteria ✨

Your AI processing is working when:

- ✅ You can upload a PDF
- ✅ Progress bar shows "Processing with AI..."
- ✅ After 5-30 seconds, flashcards are created
- ✅ You can study the generated cards
- ✅ Multiple choice questions have 4 options
- ✅ Questions are relevant to the PDF content

## Next Steps 🎯

Once AI processing is working:

1. **Optimize prompts** - Adjust the Gemini prompt in `api/upload/process.ts`
2. **Add support for more file types** - DOCX, PPTX conversion
3. **Implement background processing** - For large files
4. **Add rate limiting** - Prevent abuse
5. **Monitor costs** - Track Gemini API usage

## Quick Reference

**Useful Commands:**

```powershell
# Check deployment status
vercel ls

# View function logs in real-time
vercel logs --follow

# Redeploy current commit
vercel --prod --force

# Check environment variables
vercel env ls
```

**Important URLs:**

- Vercel Dashboard: https://vercel.com/dashboard
- Gemini API Keys: https://aistudio.google.com/app/apikey
- Supabase Dashboard: https://app.supabase.com
- AI Setup Guide: See `AI_PROCESSING_SETUP.md`

---

**Need Help?** Check `AI_PROCESSING_SETUP.md` for detailed technical documentation.
