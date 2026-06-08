import { supabase } from "./supabase";

/**
 * Create a league
 */
export async function createLeagueDB(name: string, code: string) {
  const { data, error } = await supabase
    .from("leagues")
    .insert([{ name, code }])
    .select()
    .single();

  if (error) throw error;

  return data;
}

/**
 * Get league by code
 */
export async function getLeagueByCode(code: string) {
  const { data, error } = await supabase
    .from("leagues")
    .select("*")
    .eq("code", code)
    .single();

  if (error) return null;

  return data;
}

/**
 * Get league by id
 */
export async function getLeagueById(id: string) {
  const { data, error } = await supabase
    .from("leagues")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;

  return data;
}

/**
 * Get players in a league
 */
export async function getPlayersByLeagueId(leagueId: string) {
  const { data, error } = await supabase
    .from("players")
    .select("*")
    .eq("league_id", leagueId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data || []).map((p) => ({
    name: p.name,
    teams: p.teams,
    createdAt: p.created_at,
  }));
}

/**
 * Add player with teams
 */
export async function addPlayerToLeague(
  leagueId: string,
  name: string,
  teams: string[]
) {
  const { error } = await supabase.from("players").insert([
    {
      league_id: leagueId,
      name,
      teams,
    },
  ]);

  if (error) throw error;
}

/**
 * Clear leaderboard
 */
export async function clearLeaguePlayers(leagueId: string) {
  const { error } = await supabase
    .from("players")
    .delete()
    .eq("league_id", leagueId);

  if (error) throw error;
}