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

const FOOTBALL_DATA_API_KEY = Deno.env.get("FOOTBALL_DATA_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const FOOTBALL_DATA_BASE_URL = "https://api.football-data.org/v4";

/**
 * These names must match the names in your app and scores table.
 * Add to this list if the API returns a different version of a country name.
 */
const API_TO_APP_TEAM_NAMES: Record<string, string> = {
  "Korea Republic": "South Korea",
  "Republic of Korea": "South Korea",
  "South Korea": "South Korea",

  "IR Iran": "Iran",
  "Iran": "Iran",

  "United States": "USA",
  "United States of America": "USA",
  "USA": "USA",

  "Côte d'Ivoire": "Ivory Coast",
  "Cote d'Ivoire": "Ivory Coast",
  "Ivory Coast": "Ivory Coast",

  "Congo DR": "DR Congo",
  "Congo Democratic Republic": "DR Congo",
  "DR Congo": "DR Congo",

  "Czech Republic": "Czechia",
  "Czechia": "Czechia",

  "Türkiye": "Turkey",
  "Turkiye": "Turkey",
  "Turkey": "Turkey",

  "Bosnia-Herzegovina": "Bosnia and Herzegovina",
  "Bosnia and Herzegovina": "Bosnia and Herzegovina",

  "Cape Verde Islands": "Cape Verde",
  "Cabo Verde": "Cape Verde",
  "Cape Verde": "Cape Verde",

  "Curacao": "Curacao",
  "Curaçao": "Curacao",
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
      { error: "Missing FOOTBALL_DATA_API_KEY secret." },
      500
    );
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return jsonResponse(
      { error: "Missing Supabase environment variables." },
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
      return jsonResponse({
        ok: true,
        synced: 0,
        message:
          "No matches were returned by football-data.org for WC season 2026.",
      });
    }

    /**
     * Important:
     * This only upserts API fields. It does not include manual_home_score,
     * manual_away_score, manual_winner, manual_status, source, or locked.
     * That means your manual overrides are not wiped by syncing.
     */
    const { data, error } = await supabase
      .from("matches")
      .upsert(rows, { onConflict: "id" })
      .select("id, match_date_local, stage, home_team, away_team, api_status");

    if (error) {
      throw error;
    }

    return jsonResponse({
      ok: true,
      synced: data?.length || 0,
      matchesReturnedByApi: apiMatches.length,
      message: `Synced ${data?.length || 0} World Cup matches.`,
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