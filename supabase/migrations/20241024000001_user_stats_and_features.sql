-- LarahBigDeck (LBD) Enhanced Features Migration
-- Migration: User card statistics, flagging, and progress tracking

-- Create user_card_stats table
CREATE TABLE IF NOT EXISTS user_card_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  
  -- Study statistics
  attempts INTEGER DEFAULT 0 CHECK (attempts >= 0),
  correct INTEGER DEFAULT 0 CHECK (correct >= 0 AND correct <= attempts),
  
  -- Timestamps
  last_reviewed_at TIMESTAMP WITH TIME ZONE,
  first_reviewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Flagging for review
  flagged BOOLEAN DEFAULT FALSE,
  flagged_at TIMESTAMP WITH TIME ZONE,
  
  -- Session tracking
  current_streak INTEGER DEFAULT 0,
  best_streak INTEGER DEFAULT 0,
  
  -- Spaced repetition data (for future enhancement)
  ease_factor DECIMAL(3,2) DEFAULT 2.5 CHECK (ease_factor >= 1.3),
  interval_days INTEGER DEFAULT 1 CHECK (interval_days >= 0),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one stat record per user-card combination
  CONSTRAINT unique_user_card_stats UNIQUE (user_id, card_id)
);

-- Create study_sessions table for tracking individual study sessions
CREATE TABLE IF NOT EXISTS study_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  deck_id UUID NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
  
  -- Session metadata
  mode VARCHAR(50) DEFAULT 'flashcard' CHECK (mode IN ('flashcard', 'multiple_choice', 'flagged_only', 'mixed')),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Session statistics
  cards_studied INTEGER DEFAULT 0,
  cards_correct INTEGER DEFAULT 0,
  duration_seconds INTEGER, -- Calculated when session completes
  
  -- Additional metrics
  average_response_time DECIMAL(10,2), -- In seconds
  completed BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create card_interactions table for detailed tracking of each interaction
CREATE TABLE IF NOT EXISTS card_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES study_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  
  -- Interaction details
  interaction_type VARCHAR(50) CHECK (interaction_type IN ('flip', 'multiple_choice', 'flag', 'unflag')),
  correct BOOLEAN, -- NULL if just flagging/unflagging
  response_time_seconds DECIMAL(10,2),
  selected_option_index INTEGER, -- For multiple choice
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Update user_profiles to include study preferences
ALTER TABLE user_profiles 
  ADD COLUMN IF NOT EXISTS study_preferences JSONB DEFAULT '{
    "theme": "system",
    "autoAdvance": true,
    "showFeedback": true,
    "studyMode": "flashcard",
    "cardsPerSession": 20,
    "shuffleCards": true
  }'::jsonb;

-- Create indexes for better query performance
CREATE INDEX idx_user_card_stats_user_id ON user_card_stats(user_id);
CREATE INDEX idx_user_card_stats_card_id ON user_card_stats(card_id);
CREATE INDEX idx_user_card_stats_flagged ON user_card_stats(user_id, flagged) WHERE flagged = TRUE;
CREATE INDEX idx_user_card_stats_last_reviewed ON user_card_stats(last_reviewed_at DESC);

CREATE INDEX idx_study_sessions_user_id ON study_sessions(user_id);
CREATE INDEX idx_study_sessions_deck_id ON study_sessions(deck_id);
CREATE INDEX idx_study_sessions_started_at ON study_sessions(started_at DESC);

CREATE INDEX idx_card_interactions_session_id ON card_interactions(session_id);
CREATE INDEX idx_card_interactions_user_card ON card_interactions(user_id, card_id);
CREATE INDEX idx_card_interactions_created_at ON card_interactions(created_at DESC);

-- Create trigger for user_card_stats updated_at
CREATE TRIGGER update_user_card_stats_updated_at 
  BEFORE UPDATE ON user_card_stats 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to update deck last_studied_at
CREATE OR REPLACE FUNCTION update_deck_last_studied()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE decks 
  SET last_studied_at = NEW.started_at,
      updated_at = NOW()
  WHERE id = NEW.deck_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update deck last_studied_at when session starts
CREATE TRIGGER update_deck_last_studied_trigger
  AFTER INSERT ON study_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_deck_last_studied();

-- Row Level Security (RLS) Policies

-- Enable RLS on new tables
ALTER TABLE user_card_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_interactions ENABLE ROW LEVEL SECURITY;

-- user_card_stats policies: users can only access their own stats
CREATE POLICY "Users can view their own card stats"
  ON user_card_stats FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own card stats"
  ON user_card_stats FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own card stats"
  ON user_card_stats FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own card stats"
  ON user_card_stats FOR DELETE
  USING (auth.uid() = user_id);

-- study_sessions policies: users can only access their own sessions
CREATE POLICY "Users can view their own study sessions"
  ON study_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own study sessions"
  ON study_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own study sessions"
  ON study_sessions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own study sessions"
  ON study_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- card_interactions policies: users can only access their own interactions
CREATE POLICY "Users can view their own card interactions"
  ON card_interactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own card interactions"
  ON card_interactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own card interactions"
  ON card_interactions FOR DELETE
  USING (auth.uid() = user_id);

-- Create view for deck statistics (aggregated data)
CREATE OR REPLACE VIEW deck_statistics AS
SELECT 
  d.id AS deck_id,
  d.user_id,
  d.name AS deck_name,
  d.card_count,
  COUNT(DISTINCT ucs.card_id) AS cards_studied,
  COUNT(CASE WHEN ucs.flagged = TRUE THEN 1 END) AS flagged_count,
  COALESCE(SUM(ucs.attempts), 0) AS total_attempts,
  COALESCE(SUM(ucs.correct), 0) AS total_correct,
  CASE 
    WHEN SUM(ucs.attempts) > 0 
    THEN ROUND((SUM(ucs.correct)::DECIMAL / SUM(ucs.attempts)::DECIMAL) * 100, 2)
    ELSE 0 
  END AS accuracy_percentage,
  MAX(ucs.last_reviewed_at) AS last_studied_at,
  COUNT(DISTINCT ss.id) AS session_count
FROM decks d
LEFT JOIN cards c ON c.deck_id = d.id
LEFT JOIN user_card_stats ucs ON ucs.card_id = c.id AND ucs.user_id = d.user_id
LEFT JOIN study_sessions ss ON ss.deck_id = d.id AND ss.user_id = d.user_id
GROUP BY d.id, d.user_id, d.name, d.card_count;

-- Grant access to the view
GRANT SELECT ON deck_statistics TO authenticated;

-- Create function to get or create user card stats
CREATE OR REPLACE FUNCTION get_or_create_user_card_stats(
  p_user_id UUID,
  p_card_id UUID
)
RETURNS user_card_stats AS $$
DECLARE
  v_stats user_card_stats;
BEGIN
  -- Try to get existing stats
  SELECT * INTO v_stats
  FROM user_card_stats
  WHERE user_id = p_user_id AND card_id = p_card_id;
  
  -- If not found, create new stats record
  IF NOT FOUND THEN
    INSERT INTO user_card_stats (user_id, card_id)
    VALUES (p_user_id, p_card_id)
    RETURNING * INTO v_stats;
  END IF;
  
  RETURN v_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update card stats after interaction
CREATE OR REPLACE FUNCTION update_card_stats(
  p_user_id UUID,
  p_card_id UUID,
  p_correct BOOLEAN,
  p_flagged BOOLEAN DEFAULT NULL
)
RETURNS user_card_stats AS $$
DECLARE
  v_stats user_card_stats;
  v_new_streak INTEGER;
BEGIN
  -- Get or create stats record
  SELECT * INTO v_stats
  FROM user_card_stats
  WHERE user_id = p_user_id AND card_id = p_card_id;
  
  IF NOT FOUND THEN
    INSERT INTO user_card_stats (user_id, card_id, attempts, correct, last_reviewed_at)
    VALUES (p_user_id, p_card_id, 0, 0, NOW())
    RETURNING * INTO v_stats;
  END IF;
  
  -- Calculate new streak
  IF p_correct THEN
    v_new_streak := v_stats.current_streak + 1;
  ELSE
    v_new_streak := 0;
  END IF;
  
  -- Update stats
  UPDATE user_card_stats
  SET 
    attempts = attempts + 1,
    correct = correct + CASE WHEN p_correct THEN 1 ELSE 0 END,
    last_reviewed_at = NOW(),
    current_streak = v_new_streak,
    best_streak = GREATEST(best_streak, v_new_streak),
    flagged = COALESCE(p_flagged, flagged),
    flagged_at = CASE WHEN p_flagged = TRUE THEN NOW() ELSE flagged_at END,
    updated_at = NOW()
  WHERE user_id = p_user_id AND card_id = p_card_id
  RETURNING * INTO v_stats;
  
  RETURN v_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments for documentation
COMMENT ON TABLE user_card_stats IS 'Tracks individual user statistics for each card including attempts, correct answers, and flagged status';
COMMENT ON TABLE study_sessions IS 'Records study sessions with metadata about mode, duration, and performance';
COMMENT ON TABLE card_interactions IS 'Detailed log of every user interaction with cards during study sessions';
COMMENT ON COLUMN user_card_stats.ease_factor IS 'For future spaced repetition algorithm (SM-2 or similar)';
COMMENT ON COLUMN user_card_stats.interval_days IS 'Days until next review (for spaced repetition)';
COMMENT ON VIEW deck_statistics IS 'Aggregated statistics per deck including accuracy, flagged cards, and study count';

