/**
 * API Route: Complete Study Session
 * PATCH /api/sessions/[sessionId]/complete
 * 
 * Marks a study session as complete and calculates duration
 */

import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params
    const supabase = await createClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get the session
    const { data: session, error: sessionError } = await supabase
      .from('study_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single()

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Session not found or access denied' },
        { status: 404 }
      )
    }

    // Calculate duration in seconds
    const startedAt = new Date((session as any).started_at)
    const completedAt = new Date()
    const durationSeconds = Math.floor((completedAt.getTime() - startedAt.getTime()) / 1000)

    // Update session as completed
    const { data: updatedSession, error: updateError } = await supabase
      .from('study_sessions')
      // @ts-ignore - Supabase generated types don't properly infer update parameter types
      .update({
        completed: true,
        completed_at: completedAt.toISOString(),
        duration_seconds: durationSeconds
      })
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error completing session:', updateError)
      return NextResponse.json(
        { error: 'Failed to complete session' },
        { status: 500 }
      )
    }

    const response = NextResponse.json({
      session_id: sessionId,
      completed: true,
      completed_at: completedAt.toISOString(),
      duration_seconds: durationSeconds,
      duration_minutes: Math.round(durationSeconds / 60),
      cards_studied: (updatedSession as any).cards_studied,
      cards_correct: (updatedSession as any).cards_correct,
      accuracy: (updatedSession as any).cards_studied > 0
        ? Math.round(((updatedSession as any).cards_correct / (updatedSession as any).cards_studied) * 100)
        : 0
    }, { status: 200 })

    // Add CORS headers for sendBeacon support
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'PATCH, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type')

    return response

  } catch (error) {
    console.error('Error in PATCH /api/sessions/[sessionId]/complete:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Handle preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
