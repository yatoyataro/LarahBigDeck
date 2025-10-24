# Supabase Project Configuration
# This file contains the configuration for your Supabase project

## Project Details
- **Project Name**: LarahBigDeck (LBD)
- **Database**: PostgreSQL 15+
- **Region**: Choose closest to your users

## Required Configuration

### 1. Authentication Settings

Navigate to: **Authentication → Providers → Email**

**Settings:**
- ✅ Enable Email provider
- Email Confirmations: Choose based on your needs
  - Development: Disable for easier testing
  - Production: Enable for security
- Secure Email Change: ✅ Enable
- Secure Password Change: ✅ Enable

**Email Templates** (Optional - customize these):
- Confirmation Email
- Password Reset Email
- Magic Link Email

### 2. Storage Setup

Navigate to: **Storage → Buckets**

**Create Bucket:**
- Name: `deck-uploads`
- Public: ❌ Private (unchecked)
- File size limit: 10MB
- Allowed MIME types: 
  - `application/pdf`
  - `text/plain`
  - `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
  - `application/msword`
  - `text/markdown`
  - `application/vnd.openxmlformats-officedocument.presentationml.presentation`

**Storage Policies:**
Run the SQL from `supabase/migrations/20241022000002_storage_policies.sql`

### 3. Database Configuration

Navigate to: **SQL Editor**

**Run Migrations:**
1. Copy contents of `supabase/migrations/20241022000001_initial_schema.sql`
2. Paste in SQL Editor
3. Click "Run"
4. Repeat for `20241022000002_storage_policies.sql`

**Verify Tables Created:**
- decks
- cards
- uploads
- user_profiles

**Verify RLS Enabled:**
All tables should have Row Level Security enabled with appropriate policies.

### 4. API Keys

Navigate to: **Settings → API**

**Copy These Keys:**
```
Project URL: https://xxxxx.supabase.co
anon/public key: eyJhbG...
service_role key: eyJhbG... (⚠️ KEEP SECRET!)
```

Add these to your `.env.local` file.

### 5. Database Backups (Production)

Navigate to: **Database → Backups**

- Enable automatic daily backups
- Configure retention period (7 days minimum)

### 6. Webhooks (Optional - for AI processing)

Navigate to: **Database → Webhooks**

**Create webhook for new uploads:**
- Table: `uploads`
- Events: INSERT
- Type: HTTP Request
- URL: Your AI processing endpoint
- HTTP Headers: Authorization token

This can trigger automatic flashcard generation when files are uploaded.

### 7. Edge Functions (Optional - for AI processing)

If using Supabase Edge Functions for AI processing:

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Deploy function
supabase functions deploy process-upload
```

## Security Checklist

### Development
- ✅ Email confirmations: Disabled (for testing)
- ✅ Row Level Security: Enabled
- ✅ Storage policies: Applied
- ⚠️ Service role key: Keep secret, never commit to git

### Production
- ✅ Email confirmations: Enabled
- ✅ HTTPS only
- ✅ Rate limiting configured
- ✅ Database backups enabled
- ✅ Monitor logs regularly
- ✅ Review RLS policies
- ✅ Update CORS settings for production domain
- ✅ Set strong password policies

## Monitoring

Navigate to: **Reports**

Monitor:
- API requests
- Database size
- Storage usage
- Auth users count
- Errors and logs

## Environment Variables Reference

```env
# From Supabase Dashboard → Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG... # Server-side only!
```

## Troubleshooting

### Issue: RLS blocking queries
**Solution:** Ensure user is authenticated and RLS policies are correct.

### Issue: Storage upload fails
**Solution:** Check bucket policies and user authentication.

### Issue: Can't access another user's data
**Solution:** This is correct! RLS is working as intended.

### Issue: Session expires quickly
**Solution:** Configure session duration in Auth settings.

## Support Resources

- Supabase Docs: https://supabase.com/docs
- Supabase Discord: https://discord.supabase.com
- GitHub Issues: https://github.com/supabase/supabase/issues
