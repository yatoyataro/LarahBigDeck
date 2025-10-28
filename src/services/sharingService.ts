/**
 * Sharing Service
 * Handles deck sharing functionality - creating share links, accessing shared decks
 */

import { supabase } from '@/utils/supabase/client'

export interface DeckShare {
  id: string
  deck_id: string
  owner_id: string
  share_token: string
  is_public: boolean
  created_at: string
  expires_at: string | null
  view_count: number
}

export interface SharedDeckAccess {
  id: string
  share_id: string
  deck_id: string
  user_id: string
  owner_id: string
  accessed_at: string
  last_studied_at: string | null
}

export interface SharedDeck {
  access_id: string
  user_id: string
  accessed_at: string
  last_studied_at: string | null
  deck_id: string
  deck_name: string
  deck_description: string | null
  card_count: number
  deck_created_at: string
  deck_updated_at: string
  owner_id: string
  share_token: string
  shared_at: string
  owner_name: string
}

/**
 * Generate a unique share token
 */
function generateShareToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const length = 16
  let token = ''
  for (let i = 0; i < length; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return token
}

/**
 * Create a shareable link for a deck
 */
export async function createShareLink(
  deckId: string,
  expiresInDays?: number
): Promise<{ share_token: string; share_url: string }> {
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    throw new Error('Not authenticated')
  }

  // Verify user owns this deck
  const { data: deck, error: deckError } = await supabase
    .from('decks')
    .select('id, user_id')
    .eq('id', deckId)
    .eq('user_id', user.id)
    .single()

  if (deckError || !deck) {
    throw new Error('Deck not found or you do not own this deck')
  }

  // Check if share link already exists
  const { data: existingShare } = await supabase
    .from('deck_shares')
    .select('*')
    .eq('deck_id', deckId)
    .eq('owner_id', user.id)
    .eq('is_public', true)
    .maybeSingle()

  if (existingShare) {
    const shareData = existingShare as any
    // Return existing share link
    const shareUrl = `${window.location.origin}/shared/${shareData.share_token}`
    return {
      share_token: shareData.share_token,
      share_url: shareUrl
    }
  }

  // Generate unique token
  let shareToken = generateShareToken()
  let isUnique = false
  let attempts = 0

  while (!isUnique && attempts < 5) {
    const { data: existing } = await supabase
      .from('deck_shares')
      .select('id')
      .eq('share_token', shareToken)
      .maybeSingle()

    if (!existing) {
      isUnique = true
    } else {
      shareToken = generateShareToken()
      attempts++
    }
  }

  if (!isUnique) {
    throw new Error('Failed to generate unique share token')
  }

  // Calculate expiration date if provided
  let expiresAt = null
  if (expiresInDays && expiresInDays > 0) {
    const expDate = new Date()
    expDate.setDate(expDate.getDate() + expiresInDays)
    expiresAt = expDate.toISOString()
  }

  // Create share record
  const { data: share, error: shareError } = await supabase
    .from('deck_shares')
    .insert({
      deck_id: deckId,
      owner_id: user.id,
      share_token: shareToken,
      is_public: true,
      expires_at: expiresAt
    } as any)
    .select()
    .single()

  if (shareError) {
    throw new Error(`Failed to create share link: ${shareError.message}`)
  }

  const shareUrl = `${window.location.origin}/shared/${shareToken}`

  return {
    share_token: shareToken,
    share_url: shareUrl
  }
}

/**
 * Get share info by token (public - no auth required initially)
 */
export async function getShareByToken(token: string): Promise<{
  share: DeckShare
  deck: {
    id: string
    name: string
    description: string | null
    card_count: number
    owner_name: string
  }
} | null> {
  // This query doesn't require auth - it's checking if the share link is valid
  const { data: share, error: shareError } = await supabase
    .from('deck_shares')
    .select(`
      *,
      decks (
        id,
        name,
        description,
        card_count,
        user_id
      )
    `)
    .eq('share_token', token)
    .eq('is_public', true)
    .maybeSingle()

  if (shareError || !share) {
    return null
  }

  const shareData = share as any
  const deck = shareData.decks

  // Check if expired
  if (shareData.expires_at && new Date(shareData.expires_at) < new Date()) {
    return null
  }

  // Get owner info
  const { data: ownerProfile } = await supabase
    .from('user_profiles')
    .select('display_name')
    .eq('id', deck.user_id)
    .maybeSingle()

  // Use display name or fallback to 'Deck Owner' (can't access user email from client)
  const ownerName = (ownerProfile as any)?.display_name || 'Deck Owner'

  return {
    share: {
      id: shareData.id,
      deck_id: shareData.deck_id,
      owner_id: shareData.owner_id,
      share_token: shareData.share_token,
      is_public: shareData.is_public,
      created_at: shareData.created_at,
      expires_at: shareData.expires_at,
      view_count: shareData.view_count
    },
    deck: {
      id: deck.id,
      name: deck.name,
      description: deck.description,
      card_count: deck.card_count,
      owner_name: ownerName
    }
  }
}

/**
 * Add shared deck to user's dashboard (requires auth)
 */
export async function addSharedDeck(shareToken: string): Promise<SharedDeckAccess> {
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    throw new Error('Please sign in to access shared decks')
  }

  // Get share info
  const { data: share, error: shareError } = await supabase
    .from('deck_shares')
    .select('*, decks(*)')
    .eq('share_token', shareToken)
    .eq('is_public', true)
    .single()

  if (shareError || !share) {
    throw new Error('Share link not found or has expired')
  }

  const shareData = share as any
  const deck = shareData.decks

  // Check if expired
  if (shareData.expires_at && new Date(shareData.expires_at) < new Date()) {
    throw new Error('This share link has expired')
  }

  // Check if user already has access
  const { data: existingAccess } = await supabase
    .from('shared_deck_access')
    .select('*')
    .eq('user_id', user.id)
    .eq('deck_id', deck.id)
    .maybeSingle()

  if (existingAccess) {
    // Already has access
    return existingAccess as any
  }

  // Create access record
  const { data: access, error: accessError } = await supabase
    .from('shared_deck_access')
    .insert({
      share_id: shareData.id,
      deck_id: deck.id,
      user_id: user.id,
      owner_id: deck.user_id
    } as any)
    .select()
    .single()

  if (accessError) {
    throw new Error(`Failed to add shared deck: ${accessError.message}`)
  }

  return access as any
}

/**
 * Get all shared decks for current user
 */
export async function getSharedDecks(): Promise<SharedDeck[]> {
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    throw new Error('Not authenticated')
  }

  const { data, error } = await supabase
    .from('shared_decks_view')
    .select('*')
    .eq('user_id', user.id)
    .order('accessed_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch shared decks: ${error.message}`)
  }

  return (data || []) as SharedDeck[]
}

/**
 * Remove a shared deck from user's dashboard
 */
export async function removeSharedDeck(deckId: string): Promise<void> {
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    throw new Error('Not authenticated')
  }

  const { error } = await supabase
    .from('shared_deck_access')
    .delete()
    .eq('user_id', user.id)
    .eq('deck_id', deckId)

  if (error) {
    throw new Error(`Failed to remove shared deck: ${error.message}`)
  }
}

/**
 * Deactivate a share link (owner only)
 */
export async function deactivateShareLink(deckId: string): Promise<void> {
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    throw new Error('Not authenticated')
  }

  const updateData = { is_public: false }
  
  const { error } = await (supabase
    .from('deck_shares')
    .update as any)(updateData)
    .eq('deck_id', deckId)
    .eq('owner_id', user.id)

  if (error) {
    throw new Error(`Failed to deactivate share link: ${error.message}`)
  }
}

/**
 * Get share link for a deck (if exists)
 */
export async function getShareLink(deckId: string): Promise<string | null> {
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    throw new Error('Not authenticated')
  }

  const { data: share } = await supabase
    .from('deck_shares')
    .select('share_token')
    .eq('deck_id', deckId)
    .eq('owner_id', user.id)
    .eq('is_public', true)
    .maybeSingle()

  if (!share) {
    return null
  }

  return `${window.location.origin}/shared/${(share as any).share_token}`
}

/**
 * Check if current user owns a deck
 */
export async function isOwnDeck(deckId: string): Promise<boolean> {
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return false
  }

  const { data: deck } = await supabase
    .from('decks')
    .select('user_id')
    .eq('id', deckId)
    .eq('user_id', user.id)
    .maybeSingle()

  return !!deck
}
