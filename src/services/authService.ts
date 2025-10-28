import { supabase } from '@/utils/supabase/client'
import type { User, Session } from '@supabase/supabase-js'

export interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
}

/**
 * Auth Service
 * Handles all authentication operations for the frontend
 */
export class AuthService {
  private static instance: AuthService
  private listeners: Set<(state: AuthState) => void> = new Set()

  private constructor() {
    // Listen to auth state changes
    supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session?.user?.email)
      this.notifyListeners({
        user: session?.user ?? null,
        session: session ?? null,
        loading: false,
      })
    })
  }

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService()
    }
    return AuthService.instance
  }

  /**
   * Subscribe to auth state changes
   */
  subscribe(listener: (state: AuthState) => void): () => void {
    this.listeners.add(listener)
    // Return unsubscribe function
    return () => this.listeners.delete(listener)
  }

  private notifyListeners(state: AuthState) {
    this.listeners.forEach(listener => listener(state))
  }

  /**
   * Get current user from Supabase session
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      return user
    } catch (error) {
      console.error('Error getting current user:', error)
      return null
    }
  }

  /**
   * Get current session
   */
  async getSession(): Promise<Session | null> {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      return session
    } catch (error) {
      console.error('Error getting session:', error)
      return null
    }
  }

  /**
   * Sign in with email and password
   */
  async signIn(email: string, password: string): Promise<{ user: User | null; error: Error | null }> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        return { user: null, error }
      }

      return { user: data.user, error: null }
    } catch (error) {
      console.error('Error signing in:', error)
      return { user: null, error: error as Error }
    }
  }

  /**
   * Sign up with email and password
   */
  async signUp(email: string, password: string, displayName?: string): Promise<{ user: User | null; error: Error | null }> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName || null,
          },
        },
      })

      if (error) {
        return { user: null, error }
      }

      return { user: data.user, error: null }
    } catch (error) {
      console.error('Error signing up:', error)
      return { user: null, error: error as Error }
    }
  }

  /**
   * Sign out current user
   */
  async signOut(): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        return { error }
      }

      return { error: null }
    } catch (error) {
      console.error('Error signing out:', error)
      return { error: error as Error }
    }
  }

  /**
   * Sign in with magic link (passwordless)
   */
  async signInWithMagicLink(email: string): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}`,
        },
      })

      if (error) {
        return { error }
      }

      return { error: null }
    } catch (error) {
      console.error('Error sending magic link:', error)
      return { error: error as Error }
    }
  }

  /**
   * Sign in with Google OAuth
   */
  async signInWithGoogle(): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })

      if (error) {
        return { error }
      }

      return { error: null }
    } catch (error) {
      console.error('Error signing in with Google:', error)
      return { error: error as Error }
    }
  }

  /**
   * Sign in with Google ID Token (for Google One-Tap)
   */
  async signInWithGoogleIdToken(token: string, nonce?: string): Promise<{ user: User | null; error: Error | null }> {
    try {
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token,
        nonce,
      })

      if (error) {
        return { user: null, error }
      }

      return { user: data.user, error: null }
    } catch (error) {
      console.error('Error signing in with Google ID token:', error)
      return { user: null, error: error as Error }
    }
  }
}

// Export singleton instance
export const authService = AuthService.getInstance()
