/**
 * API Route: Complete Study Session via Beacon
 * POST /api/sessions/[sessionId]/beacon
 * 
 * Special endpoint for navigator.sendBeacon() requests on page unload
 * Uses sessionId for authentication instead of cookies
 */

import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params
    const supabase = await createClient()

    // Get the session to verify it exists
    const { data: session, error: sessionError } = await supabase
      .from('study_sessions')
      .select('*, users(id)')
      .eq('id', sessionId)
      .single()

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    // Session exists, complete it
    const startedAt = new Date((session as any).started_at)
    const completedAt = new Date()
    const durationSeconds = Math.floor((completedAt.getTime() - startedAt.getTime()) / 1000)

    // Update session as completed
    const { error: updateError } = await supabase
      .from('study_sessions')
      // @ts-ignore - Supabase generated types don't properly infer update parameter types
      .update({
        completed: true,
        completed_at: completedAt.toISOString(),
        duration_seconds: durationSeconds
      })
      .eq('id', sessionId)

    if (updateError) {
      console.error('Error completing session via beacon:', updateError)
      return NextResponse.json(
        { error: 'Failed to complete session' },
        { status: 500 }
      )
    }

    const response = NextResponse.json({
      success: true,
      session_id: sessionId,
      duration_seconds: durationSeconds
    }, { status: 200 })

    // Add CORS headers for sendBeacon support
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type')

    return response

  } catch (error) {
    console.error('Error in POST /api/sessions/[sessionId]/beacon:', error)
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
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
