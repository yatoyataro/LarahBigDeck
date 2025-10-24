// TypeScript types for database tables
// Generated based on the Supabase schema

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      decks: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          created_at: string
          updated_at: string
          card_count: number
          last_studied_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          created_at?: string
          updated_at?: string
          card_count?: number
          last_studied_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          created_at?: string
          updated_at?: string
          card_count?: number
          last_studied_at?: string | null
        }
      }
      uploads: {
        Row: {
          id: string
          user_id: string
          deck_id: string | null
          file_name: string
          file_url: string
          file_size: number | null
          mime_type: string
          status: 'pending' | 'processing' | 'completed' | 'failed'
          error_message: string | null
          created_at: string
          processed_at: string | null
          metadata: Json
        }
        Insert: {
          id?: string
          user_id: string
          deck_id?: string | null
          file_name: string
          file_url: string
          file_size?: number | null
          mime_type: string
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          error_message?: string | null
          created_at?: string
          processed_at?: string | null
          metadata?: Json
        }
        Update: {
          id?: string
          user_id?: string
          deck_id?: string | null
          file_name?: string
          file_url?: string
          file_size?: number | null
          mime_type?: string
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          error_message?: string | null
          created_at?: string
          processed_at?: string | null
          metadata?: Json
        }
      }
      cards: {
        Row: {
          id: string
          deck_id: string
          upload_id: string | null
          question: string
          answer: string
          card_type: 'flashcard' | 'multiple_choice' | 'true_false'
          options: Json | null
          correct_option_index: number | null
          difficulty: number
          next_review_at: string | null
          times_reviewed: number
          times_correct: number
          last_reviewed_at: string | null
          position: number
          tags: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          deck_id: string
          upload_id?: string | null
          question: string
          answer: string
          card_type?: 'flashcard' | 'multiple_choice' | 'true_false'
          options?: Json | null
          correct_option_index?: number | null
          difficulty?: number
          next_review_at?: string | null
          times_reviewed?: number
          times_correct?: number
          last_reviewed_at?: string | null
          position?: number
          tags?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          deck_id?: string
          upload_id?: string | null
          question?: string
          answer?: string
          card_type?: 'flashcard' | 'multiple_choice' | 'true_false'
          options?: Json | null
          correct_option_index?: number | null
          difficulty?: number
          next_review_at?: string | null
          times_reviewed?: number
          times_correct?: number
          last_reviewed_at?: string | null
          position?: number
          tags?: string[] | null
          created_at?: string
          updated_at?: string
        }
      }
      user_profiles: {
        Row: {
          id: string
          display_name: string | null
          avatar_url: string | null
          preferences: Json
          study_preferences: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          display_name?: string | null
          avatar_url?: string | null
          preferences?: Json
          study_preferences?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          display_name?: string | null
          avatar_url?: string | null
          preferences?: Json
          study_preferences?: Json
          created_at?: string
          updated_at?: string
        }
      }
      user_card_stats: {
        Row: {
          id: string
          user_id: string
          card_id: string
          attempts: number
          correct: number
          last_reviewed_at: string | null
          first_reviewed_at: string
          flagged: boolean
          flagged_at: string | null
          current_streak: number
          best_streak: number
          ease_factor: number
          interval_days: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          card_id: string
          attempts?: number
          correct?: number
          last_reviewed_at?: string | null
          first_reviewed_at?: string
          flagged?: boolean
          flagged_at?: string | null
          current_streak?: number
          best_streak?: number
          ease_factor?: number
          interval_days?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          card_id?: string
          attempts?: number
          correct?: number
          last_reviewed_at?: string | null
          first_reviewed_at?: string
          flagged?: boolean
          flagged_at?: string | null
          current_streak?: number
          best_streak?: number
          ease_factor?: number
          interval_days?: number
          created_at?: string
          updated_at?: string
        }
      }
      study_sessions: {
        Row: {
          id: string
          user_id: string
          deck_id: string
          mode: 'flashcard' | 'multiple_choice' | 'flagged_only' | 'mixed'
          started_at: string
          completed_at: string | null
          cards_studied: number
          cards_correct: number
          duration_seconds: number | null
          average_response_time: number | null
          completed: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          deck_id: string
          mode?: 'flashcard' | 'multiple_choice' | 'flagged_only' | 'mixed'
          started_at?: string
          completed_at?: string | null
          cards_studied?: number
          cards_correct?: number
          duration_seconds?: number | null
          average_response_time?: number | null
          completed?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          deck_id?: string
          mode?: 'flashcard' | 'multiple_choice' | 'flagged_only' | 'mixed'
          started_at?: string
          completed_at?: string | null
          cards_studied?: number
          cards_correct?: number
          duration_seconds?: number | null
          average_response_time?: number | null
          completed?: boolean
          created_at?: string
        }
      }
      card_interactions: {
        Row: {
          id: string
          session_id: string | null
          user_id: string
          card_id: string
          interaction_type: 'flip' | 'multiple_choice' | 'flag' | 'unflag'
          correct: boolean | null
          response_time_seconds: number | null
          selected_option_index: number | null
          created_at: string
        }
        Insert: {
          id?: string
          session_id?: string | null
          user_id: string
          card_id: string
          interaction_type: 'flip' | 'multiple_choice' | 'flag' | 'unflag'
          correct?: boolean | null
          response_time_seconds?: number | null
          selected_option_index?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string | null
          user_id?: string
          card_id?: string
          interaction_type?: 'flip' | 'multiple_choice' | 'flag' | 'unflag'
          correct?: boolean | null
          response_time_seconds?: number | null
          selected_option_index?: number | null
          created_at?: string
        }
      }
    }
    Views: {
      deck_statistics: {
        Row: {
          deck_id: string
          user_id: string
          deck_name: string
          card_count: number
          cards_studied: number
          flagged_count: number
          total_attempts: number
          total_correct: number
          accuracy_percentage: number
          last_studied_at: string | null
          session_count: number
        }
      }
    }
    Functions: {
      get_or_create_user_card_stats: {
        Args: {
          p_user_id: string
          p_card_id: string
        }
        Returns: Database['public']['Tables']['user_card_stats']['Row']
      }
      update_card_stats: {
        Args: {
          p_user_id: string
          p_card_id: string
          p_correct: boolean
          p_flagged?: boolean
        }
        Returns: Database['public']['Tables']['user_card_stats']['Row']
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Additional type definitions for frontend use
export interface StudyPreferences {
  theme: 'light' | 'dark' | 'system'
  autoAdvance: boolean
  showFeedback: boolean
  studyMode: 'flashcard' | 'multiple_choice' | 'mixed'
  cardsPerSession: number
  shuffleCards: boolean
}

export interface DeckStats {
  deck_id: string
  user_id: string
  deck_name: string
  card_count: number
  cards_studied: number
  flagged_count: number
  total_attempts: number
  total_correct: number
  accuracy_percentage: number
  last_studied_at: string | null
  session_count: number
}

export interface CardStats {
  card_id: string
  attempts: number
  correct: number
  accuracy: number
  flagged: boolean
  last_reviewed_at: string | null
  current_streak: number
  best_streak: number
}

export interface SessionSummary {
  session_id: string
  deck_name: string
  mode: string
  cards_studied: number
  cards_correct: number
  accuracy: number
  duration: string
  started_at: string
}

export interface ExportDeckData {
  deck: {
    name: string
    description: string
    created_at: string
  }
  cards: Array<{
    question: string
    answer: string
    card_type: string
    options?: string[]
    correct_option_index?: number
    tags?: string[]
  }>
  stats?: Array<{
    question: string
    attempts: number
    correct: number
    flagged: boolean
  }>
}

export interface ImportCardData {
  question: string
  answer: string
  card_type?: 'flashcard' | 'multiple_choice' | 'true_false'
  options?: string[]
  correct_option_index?: number
  distractor1?: string
  distractor2?: string
  distractor3?: string
  tags?: string[]
}
