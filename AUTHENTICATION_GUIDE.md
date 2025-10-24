# Authentication Guide - LarahBigDeck

## Overview
LarahBigDeck now has fully functional authentication powered by Supabase Auth. Users can sign up, log in, and log out seamlessly.

## What's Been Implemented

### 1. **Auth Service** (`src/services/authService.ts`)
- Singleton service that manages authentication state
- Handles sign in, sign up, sign out, and magic link authentication
- Listens to Supabase auth state changes
- Notifies subscribed components of auth state updates

### 2. **useAuth Hook** (`src/hooks/useAuth.ts`)
- React hook for easy access to authentication state
- Provides user, session, loading state, and authentication methods
- Automatically syncs with Supabase auth state changes

### 3. **Auth Dialog** (`src/components/AuthDialog.tsx`)
- Beautiful tabbed dialog for login and signup
- Email/password authentication
- Client-side validation
- Loading states and error handling
- Toast notifications for success/error feedback

### 4. **Updated Header** (`src/components/Header.tsx`)
- Shows "Login" button when user is not authenticated
- Shows "Logout" button with user info when authenticated
- Opens auth dialog on login button click
- Handles logout with confirmation toast

### 5. **Updated Dashboard** (`src/views/Dashboard.tsx`)
- Displays personalized welcome message when user is logged in
- Shows username extracted from email

## How to Use

### For Users

#### Sign Up
1. Click the **Login** button in the header
2. Switch to the **Sign Up** tab
3. Enter your email, password (min 6 chars), and optional display name
4. Click **Sign Up**
5. Check your email for verification link

#### Login
1. Click the **Login** button in the header
2. Enter your email and password
3. Click **Login**
4. You'll be automatically logged in

#### Logout
1. Click the **Logout** button in the header (visible when logged in)
2. You'll be signed out and redirected

### For Developers

#### Check if User is Authenticated
```tsx
import { useAuth } from '@/hooks/useAuth';

function MyComponent() {
  const { user, isAuthenticated, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  
  if (!isAuthenticated) {
    return <div>Please log in</div>;
  }
  
  return <div>Welcome {user.email}</div>;
}
```

#### Sign In Programmatically
```tsx
import { useAuth } from '@/hooks/useAuth';

function MyComponent() {
  const { signIn } = useAuth();
  
  const handleLogin = async () => {
    const { user, error } = await signIn('user@example.com', 'password123');
    if (error) {
      console.error('Login failed:', error);
    } else {
      console.log('Logged in:', user);
    }
  };
  
  return <button onClick={handleLogin}>Login</button>;
}
```

#### Sign Out Programmatically
```tsx
import { useAuth } from '@/hooks/useAuth';

function MyComponent() {
  const { signOut } = useAuth();
  
  const handleLogout = async () => {
    const { error } = await signOut();
    if (error) {
      console.error('Logout failed:', error);
    }
  };
  
  return <button onClick={handleLogout}>Logout</button>;
}
```

#### Direct Service Usage (Advanced)
```tsx
import { authService } from '@/services/authService';

// Get current user
const user = await authService.getCurrentUser();

// Sign in
const { user, error } = await authService.signIn(email, password);

// Sign out
const { error } = await authService.signOut();

// Subscribe to auth changes
const unsubscribe = authService.subscribe((state) => {
  console.log('Auth state changed:', state);
});
// Later: unsubscribe()
```

## Backend API Endpoints

The following API routes are available for authentication:

### POST `/api/auth/login`
Login with email and password
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

### POST `/api/auth/signup`
Create a new user account
```json
{
  "email": "user@example.com",
  "password": "password123",
  "displayName": "John Doe"
}
```

### POST `/api/auth/logout`
Log out the current user (no body required)

### GET `/api/auth/user`
Get current authenticated user info

## Environment Setup

Make sure you have these environment variables in `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Supabase Configuration

### Email Auth Settings
1. Go to Supabase Dashboard → Authentication → Settings
2. Enable Email provider
3. Configure email templates (optional)
4. Set redirect URLs for your domains

### User Table
The app uses the default `auth.users` table provided by Supabase. User profiles can be stored in the `user_profiles` table (already created in migrations).

## Security Features

✅ **Secure Password Handling** - Passwords are hashed by Supabase  
✅ **Session Management** - Automatic session refresh  
✅ **HTTP-Only Cookies** - Session tokens stored securely  
✅ **CORS Protection** - API routes protected with CORS headers  
✅ **Email Verification** - Optional email verification on signup  

## Testing

### Running the App
1. Start backend API: `npm run dev:api` (port 3001)
2. Start frontend: `npm run dev` (port 8080)
3. Open browser to `http://localhost:8080`

### Test Accounts
Create test accounts through the signup flow or directly in Supabase Dashboard.

## Troubleshooting

### Login/Logout not working
- Check browser console for errors
- Verify Supabase environment variables are set
- Check that backend API is running on port 3001
- Verify CORS headers in `next.config.js`

### Session not persisting
- Clear browser cookies and local storage
- Check that Supabase URL and anon key are correct
- Verify that `@supabase/ssr` is installed

### Email not sending
- Check Supabase email settings in dashboard
- Verify email provider is configured
- Check spam folder for verification emails

## Next Steps

Consider implementing:
- [ ] Password reset flow
- [ ] Email verification requirement
- [ ] Social auth (Google, GitHub, etc.)
- [ ] User profile management
- [ ] Avatar upload
- [ ] Two-factor authentication
- [ ] Remember me functionality
- [ ] Session timeout handling

## Resources

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Supabase SSR Guide](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [@supabase/ssr](https://github.com/supabase/supabase-js)
