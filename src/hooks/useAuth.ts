import { useState, useEffect } from 'react'
import { authService, type AuthState } from '@/services/authService'
import type { User } from '@supabase/supabase-js'

/**
 * Hook to access authentication state
 * Returns current user, loading state, and auth methods
 */
export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
  })

  useEffect(() => {
    // Get initial session
    authService.getSession().then(session => {
      setAuthState({
        user: session?.user ?? null,
        session: session ?? null,
        loading: false,
      })
    })

    // Subscribe to auth changes
    const unsubscribe = authService.subscribe(setAuthState)

    return () => {
      unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    const { user, error } = await authService.signIn(email, password)
    return { user, error }
  }

  const signUp = async (email: string, password: string, displayName?: string) => {
    const { user, error } = await authService.signUp(email, password, displayName)
    return { user, error }
  }

  const signOut = async () => {
    const { error } = await authService.signOut()
    return { error }
  }

  const signInWithMagicLink = async (email: string) => {
    const { error } = await authService.signInWithMagicLink(email)
    return { error }
  }

  return {
    user: authState.user,
    session: authState.session,
    loading: authState.loading,
    isAuthenticated: !!authState.user,
    signIn,
    signUp,
    signOut,
    signInWithMagicLink,
  }
}
