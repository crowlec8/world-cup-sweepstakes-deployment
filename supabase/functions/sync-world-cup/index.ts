import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type FootballDataMatch = {
  id: number;
  utcDate: string;
  status: string;
  stage?: string;
  group?: string | null;
  matchday?: number | null;
  homeTeam?: {
    id?: number;
    name?: string;
    shortName?: string;
    tla?: string;
  };
  awayTeam?: {
    id?: number;
    name?: string;
    shortName?: string;
    tla?: string;
  };
  score?: {
    winner?: string | null;
    duration?: string | null;
    fullTime?: {
      home?: number | null;
      away?: number | null;
    };
  };
};

type FootballDataResponse = {
  matches?: FootballDataMatch[];
};

type CountryScoreRow = {
  team: string;
  points: number;
  updated_at?: string;
};

type CountryScoreMap = Record<string, number>;

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

const FOOTBALL_DATA_API_KEY = Deno.env.get("FOOTBALL_DATA_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const FOOTBALL_DATA_BASE_URL = "https://api.football-data.org/v4";
const COUNTRY_SCORES_TABLE = "scores";
const MATCHES_TABLE = "matches";

/**
 * These names must match the names in your app and scores table.
 * Add to this list if the API returns a different version of a country name.
 */
const API_TO_APP_TEAM_NAMES: Record<string, string> = {
  "Korea Republic": "South Korea",
  "Republic of Korea": "South Korea",
  "South Korea": "South Korea",
  "IR Iran": "Iran",
  Iran: "Iran",
  "United States": "USA",
  "United States of America": "USA",
  USA: "USA",
  "Côte d'Ivoire": "Ivory Coast",
  "Cote d'Ivoire": "Ivory Coast",
  "Ivory Coast": "Ivory Coast",
  "Congo DR": "DR Congo",
  "Congo Democratic Republic": "DR Congo",
  "DR Congo": "DR Congo",
  "Czech Republic": "Czechia",
  Czechia: "Czechia",
  Türkiye: "Turkey",
  Turkiye: "Turkey",
  Turkey: "Turkey",
  "Bosnia-Herzegovina": "Bosnia and Herzegovina",
  "Bosnia and Herzegovina": "Bosnia and Herzegovina",
  "Cape Verde Islands": "Cape Verde",
  "Cabo Verde": "Cape Verde",
  "Cape Verde": "Cape Verde",
  Curacao: "Curacao",
  Curaçao: "Curacao",
};

function normalizeTeamName(apiName?: string | null) {
  if (!apiName) {
    return "";
  }

  const trimmedName = apiName.trim();

  return API_TO_APP_TEAM_NAMES[trimmedName] || trimmedName;
}

function getLocalDateInIreland(utcDate?: string | null) {
  if (!utcDate) {
    return null;
  }

  const date = new Date(utcDate);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Dublin",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  return formatter.format(date);
}

function mapApiWinnerToTeamName(match: FootballDataMatch) {
  const winner = match.score?.winner;

  if (!winner || winner === "DRAW") {
    return null;
  }

  if (winner === "HOME_TEAM") {
    return normalizeTeamName(match.homeTeam?.name);
  }

  if (winner === "AWAY_TEAM") {
    return normalizeTeamName(match.awayTeam?.name);
  }

  return null;
}

function mapStage(stage?: string | null) {
  if (!stage) {
    return "UNKNOWN";
  }

  const stageMap: Record<string, string> = {
    GROUP_STAGE: "GROUP",
    LAST_32: "R32",
    ROUND_OF_32: "R32",
    LAST_16: "R16",
    ROUND_OF_16: "R16",
    QUARTER_FINALS: "QF",
    SEMI_FINALS: "SF",
    THIRD_PLACE: "3RD",
    FINAL: "FINAL",
  };

  return stageMap[stage] || stage;
}

function buildMatchId(match: FootballDataMatch) {
  return `FD-${match.id}`;
}

function buildMatchRow(match: FootballDataMatch) {
  const stage = mapStage(match.stage);
  const homeTeam = normalizeTeamName(match.homeTeam?.name);
  const awayTeam = normalizeTeamName(match.awayTeam?.name);
  const homeScore = match.score?.fullTime?.home;
  const awayScore = match.score?.fullTime?.away;

  return {
    id: buildMatchId(match),
    api_match_id: String(match.id),
    stage,
    group_name: match.group || null,
    match_number: match.matchday || null,
    match_date_utc: match.utcDate || null,
    match_date_local: getLocalDateInIreland(match.utcDate),
    home_team: homeTeam,
    away_team: awayTeam,
    api_home_score: typeof homeScore === "number" ? homeScore : null,
    api_away_score: typeof awayScore === "number" ? awayScore : null,
    api_winner: mapApiWinnerToTeamName(match),
    api_status: match.status || null,
    api_duration: match.score?.duration || null,
    last_synced_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
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

async function updateCountryScores(
  supabase: ReturnType<typeof createClient>,
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

async function recalculateCountryScoresFromMatches(
  supabase: ReturnType<typeof createClient>
): Promise<{
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
    supabase,
    calculatedScores
  );

  return {
    calculatedScores,
    updatedRows,
    missingTeams,
  };
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
    },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return jsonResponse({ ok: true });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  if (!FOOTBALL_DATA_API_KEY) {
    return jsonResponse(
      {
        error: "Missing FOOTBALL_DATA_API_KEY secret.",
      },
      500
    );
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return jsonResponse(
      {
        error: "Missing Supabase environment variables.",
      },
      500
    );
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const url = `${FOOTBALL_DATA_BASE_URL}/competitions/WC/matches?season=2026`;

    const apiResponse = await fetch(url, {
      method: "GET",
      headers: {
        "X-Auth-Token": FOOTBALL_DATA_API_KEY,
      },
    });

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();

      return jsonResponse(
        {
          error: "football-data.org request failed.",
          status: apiResponse.status,
          details: errorText,
        },
        502
      );
    }

    const footballData = (await apiResponse.json()) as FootballDataResponse;
    const apiMatches = footballData.matches || [];
    const rows = apiMatches.map(buildMatchRow);

    if (rows.length === 0) {
      const scoreResult = await recalculateCountryScoresFromMatches(supabase);

      return jsonResponse({
        ok: true,
        synced: 0,
        matchesReturnedByApi: 0,
        scoresUpdated: scoreResult.updatedRows.length,
        calculatedTeamCount: Object.keys(scoreResult.calculatedScores).length,
        message:
          "No matches were returned by football-data.org for WC season 2026. Existing Supabase matches were still used to recalculate scores.",
      });
    }

    /*
      Important:
      This only upserts API fields.
      It does not include manual_home_score, manual_away_score,
      manual_winner, manual_status, source, or locked.
      That means your manual overrides are not wiped by syncing.
    */
    const { data, error } = await supabase
      .from(MATCHES_TABLE)
      .upsert(rows, { onConflict: "id" })
      .select("id, match_date_local, stage, home_team, away_team, api_status");

    if (error) {
      throw error;
    }

    const scoreResult = await recalculateCountryScoresFromMatches(supabase);

    return jsonResponse({
      ok: true,
      synced: data?.length || 0,
      matchesReturnedByApi: apiMatches.length,
      scoresUpdated: scoreResult.updatedRows.length,
      calculatedTeamCount: Object.keys(scoreResult.calculatedScores).length,
      message: `Synced ${data?.length || 0} World Cup matches and updated ${scoreResult.updatedRows.length} score rows.`,
    });
  } catch (error) {
    console.error(error);

    return jsonResponse(
      {
        error: "Unexpected sync failure.",
        details: error instanceof Error ? error.message : String(error),
      },
      500
    );
  }
});