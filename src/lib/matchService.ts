import { supabase } from "./supabase";

/* -------------------------------------------------------------------------- */
/* Old admin_matches support kept temporarily for safety                       */
/* The new AdminPage uses the matches table functions further down.            */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/* New API-backed matches table support                                        */
/* -------------------------------------------------------------------------- */

export type MatchRow = {
  id: string;
  api_match_id: string | null;

  stage: string;
  group_name: string | null;
  match_number: number | null;

  match_date_utc: string | null;
  match_date_local: string | null;

  home_team: string | null;
  away_team: string | null;

  api_home_score: number | null;
  api_away_score: number | null;
  api_winner: string | null;
  api_status: string | null;
  api_duration: string | null;

  manual_home_score: number | null;
  manual_away_score: number | null;
  manual_winner: string | null;
  manual_status: string | null;

  source: string;
  locked: boolean;

  last_synced_at: string | null;
  updated_at: string;
};

export type MatchOverrideInput = {
  id: string;
  manual_home_score: number | null;
  manual_away_score: number | null;
  manual_winner: string | null;
  manual_status: string | null;
};

export async function getMatches(): Promise<MatchRow[]> {
  const { data, error } = await supabase
    .from("matches")
    .select("*")
    .order("match_date_utc", { ascending: true })
    .order("match_number", { ascending: true });

  if (error) {
    throw error;
  }

  return (data || []) as MatchRow[];
}

export async function saveMatchOverride(
  input: MatchOverrideInput
): Promise<MatchRow> {
  const hasManualOverride =
    input.manual_home_score !== null ||
    input.manual_away_score !== null ||
    Boolean(input.manual_winner) ||
    Boolean(input.manual_status);

  const { data, error } = await supabase
    .from("matches")
    .update({
      manual_home_score: input.manual_home_score,
      manual_away_score: input.manual_away_score,
      manual_winner: input.manual_winner,
      manual_status: input.manual_status,
      source: hasManualOverride ? "manual" : "api",
      locked: hasManualOverride,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.id)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data as MatchRow;
}

export async function clearMatchOverride(matchId: string): Promise<MatchRow> {
  const { data, error } = await supabase
    .from("matches")
    .update({
      manual_home_score: null,
      manual_away_score: null,
      manual_winner: null,
      manual_status: null,
      source: "api",
      locked: false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", matchId)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data as MatchRow;
}

export async function syncWorldCupMatches() {
  const { data, error } = await supabase.functions.invoke("sync-world-cup", {
    body: {},
  });

  if (error) {
    throw error;
  }

  return data;
}

function normaliseScoreValue(value: unknown): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const numericValue = Number(value);

  if (Number.isNaN(numericValue)) {
    return null;
  }

  return numericValue;
}

export function getFinalHomeScore(match: MatchRow): number | null {
  const manualScore = normaliseScoreValue(match.manual_home_score);

  if (manualScore !== null) {
    return manualScore;
  }

  return normaliseScoreValue(match.api_home_score);
}

export function getFinalAwayScore(match: MatchRow): number | null {
  const manualScore = normaliseScoreValue(match.manual_away_score);

  if (manualScore !== null) {
    return manualScore;
  }

  return normaliseScoreValue(match.api_away_score);
}

export function getFinalWinner(match: MatchRow): string | null {
  if (match.manual_winner) {
    return match.manual_winner;
  }

  if (match.api_winner) {
    return match.api_winner;
  }

  const homeScore = getFinalHomeScore(match);
  const awayScore = getFinalAwayScore(match);

  if (homeScore === null || awayScore === null) {
    return null;
  }

  if (homeScore > awayScore) {
    return match.home_team;
  }

  if (awayScore > homeScore) {
    return match.away_team;
  }

  return null;
}

export function isManualMatch(match: MatchRow): boolean {
  return (
    match.source === "manual" ||
    match.manual_home_score !== null ||
    match.manual_away_score !== null ||
    Boolean(match.manual_winner) ||
    Boolean(match.manual_status)
  );
}