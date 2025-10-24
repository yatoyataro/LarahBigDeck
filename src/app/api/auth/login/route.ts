import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

/**
 * POST /api/auth/login
 * Authenticate user with email and password
 * 
 * Body: { email: string, password: string }
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Parse request body
    const body = await request.json()
    const { email, password } = body

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Validation error', message: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Sign in user
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error('Error signing in user:', error)
      return NextResponse.json(
        { error: 'Authentication error', message: 'Invalid email or password' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      {
        user: data.user,
        session: data.session,
        message: 'Logged in successfully',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Unexpected error in POST /api/auth/login:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
