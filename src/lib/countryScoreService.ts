import { supabase } from "./supabase";

const COUNTRY_SCORES_TABLE = "scores";

export type CountryScoreRow = {
  team: string;
  points: number;
  updated_at?: string;
};

export type CountryScoreMap = Record<string, number>;

export async function getCountryScores(): Promise<CountryScoreMap> {
  const { data, error } = await supabase
    .from(COUNTRY_SCORES_TABLE)
    .select("team, points")
    .order("points", { ascending: false });

  if (error) {
    throw error;
  }

  return (data || []).reduce((scores: CountryScoreMap, row: CountryScoreRow) => {
    scores[row.team] = row.points || 0;
    return scores;
  }, {});
}

export async function getCountryScoreRows(): Promise<CountryScoreRow[]> {
  const { data, error } = await supabase
    .from(COUNTRY_SCORES_TABLE)
    .select("team, points, updated_at")
    .order("points", { ascending: false })
    .order("team", { ascending: true });

  if (error) {
    throw error;
  }

  return data || [];
}

export async function updateCountryScores(
  calculatedScores: CountryScoreMap
): Promise<{
  updatedRows: CountryScoreRow[];
  missingTeams: string[];
}> {
  const { data: existingCountries, error: fetchError } = await supabase
    .from(COUNTRY_SCORES_TABLE)
    .select("team");

  if (fetchError) {
    throw fetchError;
  }

  const existingTeams = existingCountries || [];
  const existingTeamNames = new Set(existingTeams.map((row) => row.team));

  const missingTeams = Object.keys(calculatedScores || {}).filter(
    (team) => !existingTeamNames.has(team)
  );

  const now = new Date().toISOString();

  const rowsToUpdate: CountryScoreRow[] = existingTeams.map((row) => ({
    team: row.team,
    points: calculatedScores[row.team] || 0,
    updated_at: now,
  }));

  const { data: updatedRows, error: updateError } = await supabase
    .from(COUNTRY_SCORES_TABLE)
    .upsert(rowsToUpdate, { onConflict: "team" })
    .select("team, points, updated_at");

  if (updateError) {
    throw updateError;
  }

  return {
    updatedRows: updatedRows || [],
    missingTeams,
  };
}

export function getPointsForTeam(teamScores: CountryScoreMap, team: string) {
  return teamScores[team] || 0;
}