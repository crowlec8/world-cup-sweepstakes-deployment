import { supabase } from "./supabase";

const ADMIN_MATCHES_TABLE = "admin_matches";

export type AdminMatchRow = {
  match_key: string;
  home: string;
  away: string;
  home_score: number;
  away_score: number;
  home_pens: boolean;
  away_pens: boolean;
  updated_at?: string;
};

export type AdminMatch = {
  home: string;
  away: string;
  homeScore: number;
  awayScore: number;
  homePens: boolean;
  awayPens: boolean;
};

export type AdminMatchMap = Record<string, AdminMatch>;

export async function getAdminMatches(): Promise<AdminMatchRow[]> {
  const { data, error } = await supabase
    .from(ADMIN_MATCHES_TABLE)
    .select(
      "match_key, home, away, home_score, away_score, home_pens, away_pens, updated_at"
    )
    .order("match_key", { ascending: true });

  if (error) {
    throw error;
  }

  return data || [];
}

export async function saveAdminMatches(matches: AdminMatchMap) {
  const now = new Date().toISOString();

  const rows = Object.entries(matches || {}).map(([matchKey, match]) => ({
    match_key: matchKey,
    home: match.home || "",
    away: match.away || "",
    home_score: Number(match.homeScore || 0),
    away_score: Number(match.awayScore || 0),
    home_pens: Boolean(match.homePens),
    away_pens: Boolean(match.awayPens),
    updated_at: now,
  }));

  const { data, error } = await supabase
    .from(ADMIN_MATCHES_TABLE)
    .upsert(rows, { onConflict: "match_key" })
    .select(
      "match_key, home, away, home_score, away_score, home_pens, away_pens, updated_at"
    );

  if (error) {
    throw error;
  }

  return data || [];
}