-- Deck Sharing Feature Migration
-- Allows users to share decks via shareable links

-- Create deck_shares table for tracking shared decks
CREATE TABLE IF NOT EXISTS deck_shares (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deck_id UUID NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  share_token VARCHAR(255) NOT NULL UNIQUE, -- Unique token for the share link
  is_public BOOLEAN DEFAULT true, -- Whether the share link is active
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE, -- Optional expiration date
  view_count INTEGER DEFAULT 0, -- Track how many times the link was accessed
  
  CONSTRAINT deck_shares_token_check CHECK (char_length(share_token) >= 10)
);

-- Create shared_deck_access table to track who has accessed shared decks
CREATE TABLE IF NOT EXISTS shared_deck_access (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  share_id UUID NOT NULL REFERENCES deck_shares(id) ON DELETE CASCADE,
  deck_id UUID NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, -- Original deck owner
  accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_studied_at TIMESTAMP WITH TIME ZONE,
  
  -- Prevent duplicate access records for same user/deck combination
  UNIQUE(user_id, deck_id)
);

-- Indexes for performance
CREATE INDEX idx_deck_shares_deck_id ON deck_shares(deck_id);
CREATE INDEX idx_deck_shares_owner_id ON deck_shares(owner_id);
CREATE INDEX idx_deck_shares_token ON deck_shares(share_token);
CREATE INDEX idx_deck_shares_public ON deck_shares(is_public) WHERE is_public = true;
CREATE INDEX idx_shared_deck_access_user_id ON shared_deck_access(user_id);
CREATE INDEX idx_shared_deck_access_deck_id ON shared_deck_access(deck_id);
CREATE INDEX idx_shared_deck_access_share_id ON shared_deck_access(share_id);

-- Function to increment view count
CREATE OR REPLACE FUNCTION increment_share_view_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE deck_shares 
  SET view_count = view_count + 1
  WHERE id = NEW.share_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-increment view count when someone accesses a shared deck
CREATE TRIGGER increment_share_views
  AFTER INSERT ON shared_deck_access
  FOR EACH ROW
  EXECUTE FUNCTION increment_share_view_count();

-- Enable RLS on new tables
ALTER TABLE deck_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_deck_access ENABLE ROW LEVEL SECURITY;

-- RLS Policies for deck_shares

-- Owners can view their own shared deck records
CREATE POLICY "Owners can view their shared decks"
  ON deck_shares FOR SELECT
  USING (auth.uid() = owner_id);

-- Owners can create share links for their decks
CREATE POLICY "Owners can create share links"
  ON deck_shares FOR INSERT
  WITH CHECK (
    auth.uid() = owner_id
    AND EXISTS (
      SELECT 1 FROM decks
      WHERE decks.id = deck_shares.deck_id
      AND decks.user_id = auth.uid()
    )
  );

-- Owners can update their share links
CREATE POLICY "Owners can update their share links"
  ON deck_shares FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Owners can delete their share links
CREATE POLICY "Owners can delete their share links"
  ON deck_shares FOR DELETE
  USING (auth.uid() = owner_id);

-- Anyone can view public share links by token (for validation)
CREATE POLICY "Public share links are viewable by token"
  ON deck_shares FOR SELECT
  USING (is_public = true AND (expires_at IS NULL OR expires_at > NOW()));

-- RLS Policies for shared_deck_access

-- Users can view their own shared deck access records
CREATE POLICY "Users can view their shared deck access"
  ON shared_deck_access FOR SELECT
  USING (auth.uid() = user_id);

-- Owners can view who accessed their shared decks
CREATE POLICY "Owners can view access to their shared decks"
  ON shared_deck_access FOR SELECT
  USING (auth.uid() = owner_id);

-- Authenticated users can record access to shared decks
CREATE POLICY "Users can record shared deck access"
  ON shared_deck_access FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own access records (for last_studied_at)
CREATE POLICY "Users can update their shared deck access"
  ON shared_deck_access FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Update decks RLS policies to allow viewing shared decks
-- Users can view decks they own OR decks that are shared with them
DROP POLICY IF EXISTS "Users can view their own decks" ON decks;

CREATE POLICY "Users can view their own decks"
  ON decks FOR SELECT
  USING (
    auth.uid() = user_id 
    OR EXISTS (
      SELECT 1 FROM shared_deck_access
      WHERE shared_deck_access.deck_id = decks.id
      AND shared_deck_access.user_id = auth.uid()
    )
  );

-- Update cards RLS policies to allow viewing cards in shared decks
-- Users can view cards in their own decks OR in decks shared with them
DROP POLICY IF EXISTS "Users can view cards in their decks" ON cards;

CREATE POLICY "Users can view cards in their decks"
  ON cards FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM decks
      WHERE decks.id = cards.deck_id
      AND (
        decks.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM shared_deck_access
          WHERE shared_deck_access.deck_id = decks.id
          AND shared_deck_access.user_id = auth.uid()
        )
      )
    )
  );

-- Create view for easier querying of shared decks with owner info
CREATE OR REPLACE VIEW shared_decks_view AS
SELECT 
  sda.id as access_id,
  sda.user_id,
  sda.accessed_at,
  sda.last_studied_at,
  d.id as deck_id,
  d.name as deck_name,
  d.description as deck_description,
  d.card_count,
  d.created_at as deck_created_at,
  d.updated_at as deck_updated_at,
  d.user_id as owner_id,
  ds.share_token,
  ds.created_at as shared_at,
  -- Get owner's display name or fallback to 'Deck Owner'
  COALESCE(up.display_name, 'Deck Owner') as owner_name
FROM shared_deck_access sda
JOIN decks d ON d.id = sda.deck_id
JOIN deck_shares ds ON ds.id = sda.share_id
LEFT JOIN user_profiles up ON up.id = d.user_id;

-- Grant access to the view
GRANT SELECT ON shared_decks_view TO authenticated;

-- Comments for documentation
COMMENT ON TABLE deck_shares IS 'Stores shareable links for decks with unique tokens';
COMMENT ON TABLE shared_deck_access IS 'Tracks which users have accessed shared decks';
COMMENT ON COLUMN deck_shares.share_token IS 'Unique token used in the shareable URL';
COMMENT ON COLUMN deck_shares.is_public IS 'Whether the share link is currently active';
COMMENT ON COLUMN deck_shares.expires_at IS 'Optional expiration date for the share link';
COMMENT ON COLUMN deck_shares.view_count IS 'Number of times the share link was accessed';
