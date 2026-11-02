export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      api_tokens: {
        Row: {
          created_at: string
          id: string
          last_used_at: string | null
          name: string
          revoked_at: string | null
          token_hash: string
          token_prefix: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_used_at?: string | null
          name: string
          revoked_at?: string | null
          token_hash: string
          token_prefix: string
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          last_used_at?: string | null
          name?: string
          revoked_at?: string | null
          token_hash?: string
          token_prefix?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          body: string
          couple_id: string
          created_at: string
          entry_id: string
          id: string
          user_id: string
        }
        Insert: {
          body: string
          couple_id: string
          created_at?: string
          entry_id: string
          id?: string
          user_id?: string
        }
        Update: {
          body?: string
          couple_id?: string
          created_at?: string
          entry_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      counter_events: {
        Row: {
          couple_id: string
          created_at: string
          created_by: string
          delta: number
          game_id: string
          id: string
          source: string
          user_id: string
        }
        Insert: {
          couple_id: string
          created_at?: string
          created_by?: string
          delta: number
          game_id: string
          id?: string
          source?: string
          user_id: string
        }
        Update: {
          couple_id?: string
          created_at?: string
          created_by?: string
          delta?: number
          game_id?: string
          id?: string
          source?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "counter_events_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "counter_events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "counter_events_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "counter_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      couples: {
        Row: {
          created_at: string
          id: string
          met_on: string
          name: string
          together_on: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          met_on: string
          name?: string
          together_on?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          met_on?: string
          name?: string
          together_on?: string | null
        }
        Relationships: []
      }
      date_details: {
        Row: {
          couple_id: string
          entry_id: string
          food: string | null
          kind: string | null
          updated_at: string
          would_return: string | null
        }
        Insert: {
          couple_id: string
          entry_id: string
          food?: string | null
          kind?: string | null
          updated_at?: string
          would_return?: string | null
        }
        Update: {
          couple_id?: string
          entry_id?: string
          food?: string | null
          kind?: string | null
          updated_at?: string
          would_return?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "date_details_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "date_details_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: true
            referencedRelation: "entries"
            referencedColumns: ["id"]
          },
        ]
      }
      date_ratings: {
        Row: {
          couple_id: string
          entry_id: string
          score: number
          updated_at: string
          user_id: string
        }
        Insert: {
          couple_id: string
          entry_id: string
          score: number
          updated_at?: string
          user_id?: string
        }
        Update: {
          couple_id?: string
          entry_id?: string
          score?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "date_ratings_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "date_ratings_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "date_ratings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      discretion_card_prefs: {
        Row: {
          card_id: string
          couple_id: string
          created_at: string
          pref: string
          user_id: string
        }
        Insert: {
          card_id: string
          couple_id: string
          created_at?: string
          pref: string
          user_id?: string
        }
        Update: {
          card_id?: string
          couple_id?: string
          created_at?: string
          pref?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "discretion_card_prefs_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "discretion_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discretion_card_prefs_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discretion_card_prefs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      discretion_cards: {
        Row: {
          couple_id: string | null
          created_at: string
          created_by: string | null
          id: string
          kind: string
          level: number
          text: string
        }
        Insert: {
          couple_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          kind: string
          level: number
          text: string
        }
        Update: {
          couple_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          kind?: string
          level?: number
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "discretion_cards_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discretion_cards_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      discretion_dice_faces: {
        Row: {
          couple_id: string | null
          die: string
          id: string
          min_level: number
          text: string
        }
        Insert: {
          couple_id?: string | null
          die: string
          id?: string
          min_level: number
          text: string
        }
        Update: {
          couple_id?: string | null
          die?: string
          id?: string
          min_level?: number
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "discretion_dice_faces_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      discretion_idea_done: {
        Row: {
          couple_id: string
          done_at: string
          idea_id: string
        }
        Insert: {
          couple_id: string
          done_at?: string
          idea_id: string
        }
        Update: {
          couple_id?: string
          done_at?: string
          idea_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "discretion_idea_done_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discretion_idea_done_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "discretion_ideas"
            referencedColumns: ["id"]
          },
        ]
      }
      discretion_idea_votes: {
        Row: {
          couple_id: string
          idea_id: string
          updated_at: string
          user_id: string
          vote: string
        }
        Insert: {
          couple_id: string
          idea_id: string
          updated_at?: string
          user_id?: string
          vote: string
        }
        Update: {
          couple_id?: string
          idea_id?: string
          updated_at?: string
          user_id?: string
          vote?: string
        }
        Relationships: [
          {
            foreignKeyName: "discretion_idea_votes_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discretion_idea_votes_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "discretion_ideas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discretion_idea_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      discretion_ideas: {
        Row: {
          couple_id: string | null
          done_at: string | null
          id: string
          level: number
          text: string
        }
        Insert: {
          couple_id?: string | null
          done_at?: string | null
          id?: string
          level: number
          text: string
        }
        Update: {
          couple_id?: string | null
          done_at?: string | null
          id?: string
          level?: number
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "discretion_ideas_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      entries: {
        Row: {
          body: string | null
          couple_id: string
          cover_media_id: string | null
          created_at: string
          created_by: string
          deleted_at: string | null
          first_time_label: string | null
          hidden_until: string | null
          id: string
          is_first_time: boolean
          occurred_at: string | null
          occurred_on: string
          place_id: string | null
          search: unknown
          title: string | null
          type: string
          updated_at: string
        }
        Insert: {
          body?: string | null
          couple_id: string
          cover_media_id?: string | null
          created_at?: string
          created_by?: string
          deleted_at?: string | null
          first_time_label?: string | null
          hidden_until?: string | null
          id?: string
          is_first_time?: boolean
          occurred_at?: string | null
          occurred_on?: string
          place_id?: string | null
          search?: unknown
          title?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          body?: string | null
          couple_id?: string
          cover_media_id?: string | null
          created_at?: string
          created_by?: string
          deleted_at?: string | null
          first_time_label?: string | null
          hidden_until?: string | null
          id?: string
          is_first_time?: boolean
          occurred_at?: string | null
          occurred_on?: string
          place_id?: string | null
          search?: unknown
          title?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "entries_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entries_cover_fk"
            columns: ["cover_media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entries_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entries_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "places"
            referencedColumns: ["id"]
          },
        ]
      }
      envelopes: {
        Row: {
          body: string
          couple_id: string
          created_at: string
          from_user: string
          id: string
          kind: string
          open_when: string | null
          opened_at: string | null
          to_user: string
          unlock_at: string | null
        }
        Insert: {
          body: string
          couple_id: string
          created_at?: string
          from_user?: string
          id?: string
          kind?: string
          open_when?: string | null
          opened_at?: string | null
          to_user: string
          unlock_at?: string | null
        }
        Update: {
          body?: string
          couple_id?: string
          created_at?: string
          from_user?: string
          id?: string
          kind?: string
          open_when?: string | null
          opened_at?: string | null
          to_user?: string
          unlock_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "envelopes_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "envelopes_from_user_fkey"
            columns: ["from_user"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "envelopes_to_user_fkey"
            columns: ["to_user"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      games: {
        Row: {
          archived: boolean
          config: Json
          couple_id: string
          created_at: string
          emoji: string | null
          id: string
          is_builtin: boolean
          name: string
          position: number
          scorer: string
          slug: string
        }
        Insert: {
          archived?: boolean
          config?: Json
          couple_id: string
          created_at?: string
          emoji?: string | null
          id?: string
          is_builtin?: boolean
          name: string
          position?: number
          scorer: string
          slug: string
        }
        Update: {
          archived?: boolean
          config?: Json
          couple_id?: string
          created_at?: string
          emoji?: string | null
          id?: string
          is_builtin?: boolean
          name?: string
          position?: number
          scorer?: string
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "games_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      match_scores: {
        Row: {
          couple_id: string
          extra: Json
          match_id: string
          score: number
          user_id: string
        }
        Insert: {
          couple_id: string
          extra?: Json
          match_id: string
          score: number
          user_id: string
        }
        Update: {
          couple_id?: string
          extra?: Json
          match_id?: string
          score?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_scores_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_scores_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_scores_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          bet: string | null
          bet_paid_at: string | null
          couple_id: string
          created_by: string
          finished_at: string | null
          game_id: string
          id: string
          started_at: string
          state: Json
          status: string
          updated_at: string
          winner_id: string | null
        }
        Insert: {
          bet?: string | null
          bet_paid_at?: string | null
          couple_id: string
          created_by?: string
          finished_at?: string | null
          game_id: string
          id?: string
          started_at?: string
          state?: Json
          status?: string
          updated_at?: string
          winner_id?: string | null
        }
        Update: {
          bet?: string | null
          bet_paid_at?: string | null
          couple_id?: string
          created_by?: string
          finished_at?: string | null
          game_id?: string
          id?: string
          started_at?: string
          state?: Json
          status?: string
          updated_at?: string
          winner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "matches_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      media: {
        Row: {
          bytes: number | null
          couple_id: string
          created_at: string
          created_by: string
          duration_s: number | null
          entry_id: string | null
          height: number | null
          id: string
          kind: string
          lat: number | null
          lng: number | null
          mime: string
          original_name: string | null
          position: number
          storage_path: string
          taken_at: string | null
          thumb_path: string | null
          width: number | null
        }
        Insert: {
          bytes?: number | null
          couple_id: string
          created_at?: string
          created_by?: string
          duration_s?: number | null
          entry_id?: string | null
          height?: number | null
          id?: string
          kind?: string
          lat?: number | null
          lng?: number | null
          mime: string
          original_name?: string | null
          position?: number
          storage_path: string
          taken_at?: string | null
          thumb_path?: string | null
          width?: number | null
        }
        Update: {
          bytes?: number | null
          couple_id?: string
          created_at?: string
          created_by?: string
          duration_s?: number | null
          entry_id?: string | null
          height?: number | null
          id?: string
          kind?: string
          lat?: number | null
          lng?: number | null
          mime?: string
          original_name?: string | null
          position?: number
          storage_path?: string
          taken_at?: string | null
          thumb_path?: string | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "media_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "entries"
            referencedColumns: ["id"]
          },
        ]
      }
      places: {
        Row: {
          address: string | null
          city: string | null
          country: string | null
          couple_id: string
          created_at: string
          id: string
          lat: number | null
          lng: number | null
          name: string
          provider: string
          provider_place_id: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          country?: string | null
          couple_id: string
          created_at?: string
          id?: string
          lat?: number | null
          lng?: number | null
          name: string
          provider?: string
          provider_place_id?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          country?: string | null
          couple_id?: string
          created_at?: string
          id?: string
          lat?: number | null
          lng?: number | null
          name?: string
          provider?: string
          provider_place_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "places_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          color: string | null
          couple_id: string
          created_at: string
          discretion_pin_hash: string | null
          display_name: string
          email: string
          id: string
        }
        Insert: {
          color?: string | null
          couple_id: string
          created_at?: string
          discretion_pin_hash?: string | null
          display_name: string
          email: string
          id: string
        }
        Update: {
          color?: string | null
          couple_id?: string
          created_at?: string
          discretion_pin_hash?: string | null
          display_name?: string
          email?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          last_used_at: string | null
          p256dh: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          last_used_at?: string | null
          p256dh: string
          user_agent?: string | null
          user_id?: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          last_used_at?: string | null
          p256dh?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      question_draws: {
        Row: {
          couple_id: string
          drawn_at: string
          drawn_by: string
          id: string
          question_id: number
        }
        Insert: {
          couple_id: string
          drawn_at?: string
          drawn_by?: string
          id?: string
          question_id: number
        }
        Update: {
          couple_id?: string
          drawn_at?: string
          drawn_by?: string
          id?: string
          question_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "question_draws_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_draws_drawn_by_fkey"
            columns: ["drawn_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_draws_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          active: boolean
          category: string
          id: number
          source: string
          text: string
        }
        Insert: {
          active?: boolean
          category: string
          id: number
          source?: string
          text: string
        }
        Update: {
          active?: boolean
          category?: string
          id?: number
          source?: string
          text?: string
        }
        Relationships: []
      }
      reactions: {
        Row: {
          couple_id: string
          created_at: string
          emoji: string
          entry_id: string
          user_id: string
        }
        Insert: {
          couple_id: string
          created_at?: string
          emoji: string
          entry_id: string
          user_id?: string
        }
        Update: {
          couple_id?: string
          created_at?: string
          emoji?: string
          entry_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reactions_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reactions_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      thoughts: {
        Row: {
          couple_id: string
          created_at: string
          from_user: string
          id: string
          message: string | null
          reply_to: string | null
          seen_at: string | null
          source: string
          to_user: string
        }
        Insert: {
          couple_id: string
          created_at?: string
          from_user?: string
          id?: string
          message?: string | null
          reply_to?: string | null
          seen_at?: string | null
          source?: string
          to_user: string
        }
        Update: {
          couple_id?: string
          created_at?: string
          from_user?: string
          id?: string
          message?: string | null
          reply_to?: string | null
          seen_at?: string | null
          source?: string
          to_user?: string
        }
        Relationships: [
          {
            foreignKeyName: "thoughts_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "thoughts_from_user_fkey"
            columns: ["from_user"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "thoughts_reply_to_fkey"
            columns: ["reply_to"]
            isOneToOne: false
            referencedRelation: "thoughts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "thoughts_to_user_fkey"
            columns: ["to_user"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_details: {
        Row: {
          couple_id: string
          destination: string | null
          end_on: string | null
          entry_id: string
          start_on: string | null
          status: string
        }
        Insert: {
          couple_id: string
          destination?: string | null
          end_on?: string | null
          entry_id: string
          start_on?: string | null
          status?: string
        }
        Update: {
          couple_id?: string
          destination?: string | null
          end_on?: string | null
          entry_id?: string
          start_on?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_details_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_details_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: true
            referencedRelation: "entries"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_plan_items: {
        Row: {
          couple_id: string
          created_at: string
          done: boolean
          id: string
          kind: string
          position: number
          text: string
          trip_id: string
          url: string | null
        }
        Insert: {
          couple_id: string
          created_at?: string
          done?: boolean
          id?: string
          kind?: string
          position?: number
          text: string
          trip_id: string
          url?: string | null
        }
        Update: {
          couple_id?: string
          created_at?: string
          done?: boolean
          id?: string
          kind?: string
          position?: number
          text?: string
          trip_id?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trip_plan_items_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_plan_items_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "entries"
            referencedColumns: ["id"]
          },
        ]
      }
      wishlist_items: {
        Row: {
          couple_id: string
          created_at: string
          created_by: string
          done_at: string | null
          done_entry_id: string | null
          id: string
          list: string
          place_id: string | null
          text: string
        }
        Insert: {
          couple_id: string
          created_at?: string
          created_by?: string
          done_at?: string | null
          done_entry_id?: string | null
          id?: string
          list: string
          place_id?: string | null
          text: string
        }
        Update: {
          couple_id?: string
          created_at?: string
          created_by?: string
          done_at?: string | null
          done_entry_id?: string | null
          id?: string
          list?: string
          place_id?: string | null
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlist_items_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wishlist_items_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wishlist_items_done_entry_id_fkey"
            columns: ["done_entry_id"]
            isOneToOne: false
            referencedRelation: "entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wishlist_items_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "places"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      counter_totals: {
        Row: {
          game_id: string | null
          total: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "counter_events_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "counter_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      discretion_matches: {
        Args: never
        Returns: {
          done_at: string
          idea_id: string
          level: number
          text: string
        }[]
      }
      locked_envelopes: {
        Args: never
        Returns: {
          created_at: string
          id: string
          open_when: string
          unlock_at: string
        }[]
      }
      my_couple_id: { Args: never; Returns: string }
      partner_id: { Args: never; Returns: string }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
