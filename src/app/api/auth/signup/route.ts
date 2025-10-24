import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

/**
 * POST /api/auth/signup
 * Register a new user with email and password
 * 
 * Body: { email: string, password: string, displayName?: string }
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Parse request body
    const body = await request.json()
    const { email, password, displayName } = body

    // Validate input
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Validation error', message: 'Valid email is required' },
        { status: 400 }
      )
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return NextResponse.json(
        { error: 'Validation error', message: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    // Sign up user
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
      console.error('Error signing up user:', error)
      return NextResponse.json(
        { error: 'Authentication error', message: error.message },
        { status: 400 }
      )
    }

    // Create user profile if user was created
    if (data.user) {
      await supabase.from('user_profiles').insert({
        id: data.user.id,
        display_name: displayName || null,
      } as any)
    }

    return NextResponse.json(
      {
        user: data.user,
        session: data.session,
        message: 'User registered successfully. Please check your email for verification.',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Unexpected error in POST /api/auth/signup:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
