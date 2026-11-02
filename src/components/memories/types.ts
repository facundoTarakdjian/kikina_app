export interface FeedEntry {
  id: string;
  occurred_on: string; // YYYY-MM-DD
  type: string;
  place_name: string;
  place_city: string | null;
  thumb_url: string | null;
  scores: Array<{
    user_id: string;
    score: number;
    display_name: string;
    color: string | null;
  }>;
}

export interface FeedProfile {
  id: string;
  display_name: string;
  color: string | null;
}
