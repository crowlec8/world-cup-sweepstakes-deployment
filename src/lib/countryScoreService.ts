import { supabase } from "./supabase";

const COUNTRY_SCORES_TABLE = "scores";
const MATCHES_TABLE = "matches";

export type CountryScoreRow = {
  team: string;
  points: number;
  updated_at?: string;
};

export type CountryScoreMap = Record<string, number>;

type MatchRow = {
  id: string;
  stage: string | null;
  home_team: string | null;
  away_team: string | null;
  api_home_score: number | string | null;
  api_away_score: number | string | null;
  manual_home_score: number | string | null;
  manual_away_score: number | string | null;
  api_winner: string | null;
  manual_winner: string | null;
  api_status: string | null;
};

export async function getCountryScores(): Promise<CountryScoreMap> {
  const { data, error } = await supabase
    .from(COUNTRY_SCORES_TABLE)
    .select("team, points")
    .order("points", { ascending: false });

  if (error) {
    throw error;
  }

  return (data || []).reduce((scores: CountryScoreMap, row: CountryScoreRow) => {
    scores[row.team] = Number(row.points || 0);
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

  return (data || []).map((row) => ({
    team: row.team,
    points: Number(row.points || 0),
    updated_at: row.updated_at,
  }));
}

function normaliseScoreValue(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const numericValue = Number(value);

  if (Number.isNaN(numericValue)) {
    return null;
  }

  return numericValue;
}

function isFinishedApiMatch(match: MatchRow) {
  return match.api_status === "FINISHED";
}

function getFinalHomeScore(match: MatchRow) {
  const manualScore = normaliseScoreValue(match.manual_home_score);

  if (manualScore !== null) {
    return manualScore;
  }

  if (!isFinishedApiMatch(match)) {
    return null;
  }

  return normaliseScoreValue(match.api_home_score);
}

function getFinalAwayScore(match: MatchRow) {
  const manualScore = normaliseScoreValue(match.manual_away_score);

  if (manualScore !== null) {
    return manualScore;
  }

  if (!isFinishedApiMatch(match)) {
    return null;
  }

  return normaliseScoreValue(match.api_away_score);
}

function getFinalWinner(match: MatchRow) {
  if (match.manual_winner) {
    return match.manual_winner;
  }

  if (!isFinishedApiMatch(match)) {
    return null;
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

function getStageKey(match: MatchRow) {
  const stage = match.stage || "";

  if (stage === "GROUP" || stage === "GROUP_STAGE") {
    return "GROUP";
  }

  if (stage === "R32" || stage === "LAST_32" || stage === "ROUND_OF_32") {
    return "R32";
  }

  if (stage === "R16" || stage === "LAST_16" || stage === "ROUND_OF_16") {
    return "R16";
  }

  if (stage === "QF" || stage === "QUARTER_FINALS") {
    return "QF";
  }

  if (stage === "SF" || stage === "SEMI_FINALS") {
    return "SF";
  }

  if (stage === "3RD" || stage === "THIRD_PLACE") {
    return "3RD";
  }

  if (stage === "FINAL") {
    return "FINAL";
  }

  return stage;
}

function addPoints(scores: CountryScoreMap, team: string | null, points: number) {
  if (!team) {
    return;
  }

  const cleanTeam = String(team).trim();

  if (!cleanTeam) {
    return;
  }

  scores[cleanTeam] = (scores[cleanTeam] || 0) + Number(points || 0);
}

function ensureTeamExists(scores: CountryScoreMap, team: string | null) {
  if (!team) {
    return;
  }

  const cleanTeam = String(team).trim();

  if (!cleanTeam) {
    return;
  }

  if (scores[cleanTeam] === undefined) {
    scores[cleanTeam] = 0;
  }
}

function addKnockoutAppearancePoints(
  scores: CountryScoreMap,
  stage: string,
  home: string | null,
  away: string | null
) {
  if (stage === "R32") {
    addPoints(scores, home, 5);
    addPoints(scores, away, 5);
  }

  if (stage === "R16") {
    addPoints(scores, home, 10);
    addPoints(scores, away, 10);
  }

  if (stage === "QF") {
    addPoints(scores, home, 20);
    addPoints(scores, away, 20);
  }

  if (stage === "SF") {
    addPoints(scores, home, 40);
    addPoints(scores, away, 40);
  }

  if (stage === "FINAL") {
    addPoints(scores, home, 80);
    addPoints(scores, away, 80);
  }
}

function addWinnerPoints(
  scores: CountryScoreMap,
  stage: string,
  winner: string | null
) {
  if (winner && stage === "3RD") {
    addPoints(scores, winner, 40);
  }

  if (winner && stage === "FINAL") {
    addPoints(scores, winner, 160);
  }
}

function calculateScoresFromMatches(matches: MatchRow[]) {
  const scores: CountryScoreMap = {};

  matches.forEach((match) => {
    const home = match.home_team;
    const away = match.away_team;
    const stage = getStageKey(match);
    const winner = getFinalWinner(match);
    const homeScore = getFinalHomeScore(match);
    const awayScore = getFinalAwayScore(match);

    const hasBothTeams = Boolean(home && away);
    const hasBothScores = homeScore !== null && awayScore !== null;

    if (!hasBothTeams) {
      return;
    }

    if (hasBothScores) {
      ensureTeamExists(scores, home);
      ensureTeamExists(scores, away);

      addPoints(scores, home, homeScore);
      addPoints(scores, away, awayScore);

      addKnockoutAppearancePoints(scores, stage, home, away);
    }

    if (winner) {
      ensureTeamExists(scores, winner);
      addWinnerPoints(scores, stage, winner);
    }
  });

  return scores;
}

export async function updateCountryScores(
  calculatedScores: CountryScoreMap
): Promise<{
  updatedRows: CountryScoreRow[];
  missingTeams: string[];
}> {
  const cleanCalculatedScores = Object.entries(calculatedScores || {}).reduce(
    (scores: CountryScoreMap, [team, points]) => {
      const cleanTeam = String(team || "").trim();

      if (!cleanTeam) {
        return scores;
      }

      scores[cleanTeam] = Number(points || 0);
      return scores;
    },
    {}
  );

  const { data: existingCountries, error: fetchError } = await supabase
    .from(COUNTRY_SCORES_TABLE)
    .select("team");

  if (fetchError) {
    throw fetchError;
  }

  const existingTeams = existingCountries || [];
  const allTeamNames = new Set<string>();

  existingTeams.forEach((row) => {
    const cleanTeam = String(row.team || "").trim();

    if (cleanTeam) {
      allTeamNames.add(cleanTeam);
    }
  });

  Object.keys(cleanCalculatedScores).forEach((team) => {
    const cleanTeam = String(team || "").trim();

    if (cleanTeam) {
      allTeamNames.add(cleanTeam);
    }
  });

  const now = new Date().toISOString();

  const rowsToUpsert: CountryScoreRow[] = [...allTeamNames].map((team) => ({
    team,
    points: cleanCalculatedScores[team] ?? 0,
    updated_at: now,
  }));

  if (rowsToUpsert.length === 0) {
    return {
      updatedRows: [],
      missingTeams: [],
    };
  }

  const { data: updatedRows, error: updateError } = await supabase
    .from(COUNTRY_SCORES_TABLE)
    .upsert(rowsToUpsert, { onConflict: "team" })
    .select("team, points, updated_at");

  if (updateError) {
    throw updateError;
  }

  return {
    updatedRows: updatedRows || [],
    missingTeams: [],
  };
}

export async function recalculateCountryScoresFromMatches(): Promise<{
  calculatedScores: CountryScoreMap;
  updatedRows: CountryScoreRow[];
  missingTeams: string[];
}> {
  const { data: matches, error: matchesError } = await supabase
    .from(MATCHES_TABLE)
    .select(
      `
      id,
      stage,
      home_team,
      away_team,
      api_home_score,
      api_away_score,
      manual_home_score,
      manual_away_score,
      api_winner,
      manual_winner,
      api_status
    `
    )
    .order("match_date_utc", { ascending: true });

  if (matchesError) {
    throw matchesError;
  }

  const calculatedScores = calculateScoresFromMatches((matches || []) as MatchRow[]);

  const { updatedRows, missingTeams } = await updateCountryScores(
    calculatedScores
  );

  return {
    calculatedScores,
    updatedRows,
    missingTeams,
  };
}

export function getPointsForTeam(teamScores: CountryScoreMap, team: string) {
  return teamScores[team] || 0;
}