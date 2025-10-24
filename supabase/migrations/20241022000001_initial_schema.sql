-- LarahBigDeck (LBD) Database Schema
-- Migration: Initial schema for decks, uploads, and cards

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create decks table
CREATE TABLE IF NOT EXISTS decks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  card_count INTEGER DEFAULT 0,
  last_studied_at TIMESTAMP WITH TIME ZONE,
  
  -- Indexes for performance
  CONSTRAINT decks_name_check CHECK (char_length(name) >= 1)
);

-- Create uploads table
CREATE TABLE IF NOT EXISTS uploads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  deck_id UUID REFERENCES decks(id) ON DELETE CASCADE,
  file_name VARCHAR(500) NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT,
  mime_type VARCHAR(100) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata about the processing
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create cards table
CREATE TABLE IF NOT EXISTS cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deck_id UUID NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
  upload_id UUID REFERENCES uploads(id) ON DELETE SET NULL,
  
  -- Card content
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  card_type VARCHAR(50) DEFAULT 'flashcard' CHECK (card_type IN ('flashcard', 'multiple_choice', 'true_false')),
  
  -- For multiple choice cards
  options JSONB, -- Array of options for multiple choice
  correct_option_index INTEGER, -- Index of correct option for multiple choice
  
  -- Study metadata
  difficulty INTEGER DEFAULT 0 CHECK (difficulty >= 0 AND difficulty <= 5),
  next_review_at TIMESTAMP WITH TIME ZONE,
  times_reviewed INTEGER DEFAULT 0,
  times_correct INTEGER DEFAULT 0,
  last_reviewed_at TIMESTAMP WITH TIME ZONE,
  
  -- Ordering and organization
  position INTEGER DEFAULT 0,
  tags TEXT[], -- Array of tags for categorization
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT cards_question_check CHECK (char_length(question) >= 1),
  CONSTRAINT cards_answer_check CHECK (char_length(answer) >= 1)
);

-- Create user_profiles table (optional, for extended user data)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name VARCHAR(255),
  avatar_url TEXT,
  preferences JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_decks_user_id ON decks(user_id);
CREATE INDEX idx_decks_created_at ON decks(created_at DESC);
CREATE INDEX idx_uploads_user_id ON uploads(user_id);
CREATE INDEX idx_uploads_deck_id ON uploads(deck_id);
CREATE INDEX idx_uploads_status ON uploads(status);
CREATE INDEX idx_cards_deck_id ON cards(deck_id);
CREATE INDEX idx_cards_upload_id ON cards(upload_id);
CREATE INDEX idx_cards_next_review ON cards(next_review_at);
CREATE INDEX idx_cards_position ON cards(deck_id, position);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_decks_updated_at 
  BEFORE UPDATE ON decks 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cards_updated_at 
  BEFORE UPDATE ON cards 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at 
  BEFORE UPDATE ON user_profiles 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to update deck card count
CREATE OR REPLACE FUNCTION update_deck_card_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    UPDATE decks 
    SET card_count = card_count - 1,
        updated_at = NOW()
    WHERE id = OLD.deck_id;
    RETURN OLD;
  ELSIF TG_OP = 'INSERT' THEN
    UPDATE decks 
    SET card_count = card_count + 1,
        updated_at = NOW()
    WHERE id = NEW.deck_id;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update card count
CREATE TRIGGER update_deck_card_count_trigger
  AFTER INSERT OR DELETE ON cards
  FOR EACH ROW
  EXECUTE FUNCTION update_deck_card_count();

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Decks policies: users can only access their own decks
CREATE POLICY "Users can view their own decks"
  ON decks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own decks"
  ON decks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own decks"
  ON decks FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own decks"
  ON decks FOR DELETE
  USING (auth.uid() = user_id);

-- Uploads policies: users can only access their own uploads
CREATE POLICY "Users can view their own uploads"
  ON uploads FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own uploads"
  ON uploads FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own uploads"
  ON uploads FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own uploads"
  ON uploads FOR DELETE
  USING (auth.uid() = user_id);

-- Cards policies: users can access cards in their decks
CREATE POLICY "Users can view cards in their decks"
  ON cards FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM decks
      WHERE decks.id = cards.deck_id
      AND decks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert cards in their decks"
  ON cards FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM decks
      WHERE decks.id = cards.deck_id
      AND decks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update cards in their decks"
  ON cards FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM decks
      WHERE decks.id = cards.deck_id
      AND decks.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM decks
      WHERE decks.id = cards.deck_id
      AND decks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete cards in their decks"
  ON cards FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM decks
      WHERE decks.id = cards.deck_id
      AND decks.user_id = auth.uid()
    )
  );

-- User profiles policies
CREATE POLICY "Users can view their own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create storage bucket for uploaded files (run this in Supabase dashboard or via API)
-- This is commented out as storage buckets are typically created via dashboard
-- INSERT INTO storage.buckets (id, name, public) 
-- VALUES ('deck-uploads', 'deck-uploads', false);

-- Storage policies for deck-uploads bucket
-- Note: These need to be created in Supabase dashboard under Storage > Policies
-- Policy 1: Users can upload to their own folder
-- Policy 2: Users can read from their own folder
-- Policy 3: Users can delete from their own folder
