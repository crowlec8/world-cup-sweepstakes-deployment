import { useEffect, useMemo, useState } from "react";

import { recalculateCountryScoresFromMatches } from "../lib/countryScoreService";
import {
  clearMatchOverride,
  getFinalAwayScore,
  getFinalHomeScore,
  getFinalWinner,
  getMatches,
  isManualMatch,
  saveMatchOverride,
  syncWorldCupMatches,
} from "../lib/matchService";

function formatDateTime(matchDateUtc) {
  if (!matchDateUtc) {
    return "TBC";
  }

  const date = new Date(matchDateUtc);

  if (Number.isNaN(date.getTime())) {
    return "TBC";
  }

  return new Intl.DateTimeFormat("en-IE", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Dublin",
  }).format(date);
}

function formatScore(homeScore, awayScore) {
  if (typeof homeScore !== "number" || typeof awayScore !== "number") {
    return "-";
  }

  return `${homeScore} - ${awayScore}`;
}

function getStageLabel(stage, groupName) {
  if (stage === "GROUP") {
    if (!groupName) {
      return "Group";
    }

    return groupName.replace("GROUP_", "Group ");
  }

  if (stage === "R32") return "Round of 32";
  if (stage === "R16") return "Round of 16";
  if (stage === "QF") return "Quarter-final";
  if (stage === "SF") return "Semi-final";
  if (stage === "3RD") return "3rd Place";
  if (stage === "FINAL") return "Final";

  return stage || "TBC";
}

function getSourceLabel(match) {
  return isManualMatch(match) ? "Manual Override" : "API";
}

function getDraftValue(value) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value);
}

export default function AdminPage({ goBack }) {
  const [matches, setMatches] = useState([]);
  const [draftOverrides, setDraftOverrides] = useState({});
  const [selectedDate, setSelectedDate] = useState("");
  const [loadingMatches, setLoadingMatches] = useState(true);
  const [syncingMatches, setSyncingMatches] = useState(false);
  const [savingMatchId, setSavingMatchId] = useState("");
  const [updatingScores, setUpdatingScores] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [saveError, setSaveError] = useState("");

  const buildDraftsFromMatches = (rows) => {
    const nextDrafts = {};

    rows.forEach((match) => {
      nextDrafts[match.id] = {
        manual_home_score: getDraftValue(match.manual_home_score),
        manual_away_score: getDraftValue(match.manual_away_score),
        manual_winner: match.manual_winner || "",
      };
    });

    return nextDrafts;
  };

  const loadMatches = async () => {
    setLoadingMatches(true);
    setSaveMessage("");
    setSaveError("");

    try {
      const rows = await getMatches();

      setMatches(rows);
      setDraftOverrides(buildDraftsFromMatches(rows));

      return rows;
    } catch (error) {
      console.error(error);
      setSaveError("Could not load matches from Supabase.");
      return [];
    } finally {
      setLoadingMatches(false);
    }
  };

  useEffect(() => {
    loadMatches();
  }, []);

  const availableDates = useMemo(() => {
    const dates = new Set();

    matches.forEach((match) => {
      if (match.match_date_local) {
        dates.add(match.match_date_local);
      }
    });

    return [...dates].sort();
  }, [matches]);

  const filteredMatches = useMemo(() => {
    if (!selectedDate) {
      return matches;
    }

    return matches.filter((match) => match.match_date_local === selectedDate);
  }, [matches, selectedDate]);

  const updateDraftOverride = (matchId, field, value) => {
    setSaveMessage("");
    setSaveError("");

    setDraftOverrides((prev) => ({
      ...prev,
      [matchId]: {
        ...(prev[matchId] || {}),
        [field]: value,
      },
    }));
  };

  const refreshMatchesOnPage = async () => {
    const latestMatches = await getMatches();

    setMatches(latestMatches);
    setDraftOverrides(buildDraftsFromMatches(latestMatches));

    return latestMatches;
  };

  const handleSyncLatestScores = async () => {
    setSyncingMatches(true);
    setSaveMessage("");
    setSaveError("");

    try {
      const result = await syncWorldCupMatches();

      await refreshMatchesOnPage();

      setSaveMessage(
        result?.message ||
          "Latest fixtures and scores synced successfully from the API."
      );
    } catch (error) {
      console.error(error);
      setSaveError(
        error?.message ||
          "There was a problem syncing fixtures and scores from the API."
      );
    } finally {
      setSyncingMatches(false);
    }
  };

  const handleUpdateLeaderboardScores = async () => {
    setUpdatingScores(true);
    setSaveMessage("");
    setSaveError("");

    try {
      const { calculatedScores, updatedRows, missingTeams } =
        await recalculateCountryScoresFromMatches();

      if (Object.keys(calculatedScores).length === 0) {
        setSaveError(
          "No scores were calculated from the matches table. Check that at least one match has an API score or a saved manual override."
        );
        return;
      }

      await refreshMatchesOnPage();

      let message = `Leaderboard scores updated successfully for ${updatedRows.length} countries.`;

      if (calculatedScores.Mexico !== undefined) {
        message += ` Mexico calculated points: ${calculatedScores.Mexico}.`;
      }

      if (missingTeams.length > 0) {
        message += ` These teams were not found in Supabase and were skipped: ${[
          ...new Set(missingTeams),
        ].join(", ")}.`;
      }

      setSaveMessage(message);
    } catch (error) {
      console.error(error);
      setSaveError(
        error?.message ||
          "There was a problem recalculating and updating the leaderboard scores."
      );
    } finally {
      setUpdatingScores(false);
    }
  };

  const handleSyncAndUpdateScores = async () => {
    setSyncingMatches(true);
    setUpdatingScores(true);
    setSaveMessage("");
    setSaveError("");

    try {
      const result = await syncWorldCupMatches();

      const { calculatedScores, updatedRows, missingTeams } =
        await recalculateCountryScoresFromMatches();

      if (Object.keys(calculatedScores).length === 0) {
        setSaveError(
          "API sync worked, but no scores were calculated yet. This is normal if all API matches are unplayed and you have no manual overrides saved."
        );
        return;
      }

      await refreshMatchesOnPage();

      let message = `${
        result?.message || "Latest fixtures and scores synced successfully."
      } Leaderboard scores updated for ${updatedRows.length} countries.`;

      if (calculatedScores.Mexico !== undefined) {
        message += ` Mexico calculated points: ${calculatedScores.Mexico}.`;
      }

      if (missingTeams.length > 0) {
        message += ` These teams were not found in Supabase and were skipped: ${[
          ...new Set(missingTeams),
        ].join(", ")}.`;
      }

      setSaveMessage(message);
    } catch (error) {
      console.error(error);
      setSaveError(
        error?.message ||
          "There was a problem syncing API scores and updating the leaderboard."
      );
    } finally {
      setSyncingMatches(false);
      setUpdatingScores(false);
    }
  };

  const handleSaveOverride = async (match) => {
    const draft = draftOverrides[match.id] || {};

    const manualHomeScore =
      draft.manual_home_score === "" || draft.manual_home_score === undefined
        ? null
        : Number(draft.manual_home_score);

    const manualAwayScore =
      draft.manual_away_score === "" || draft.manual_away_score === undefined
        ? null
        : Number(draft.manual_away_score);

    if (
      draft.manual_home_score !== "" &&
      draft.manual_home_score !== undefined &&
      Number.isNaN(Number(draft.manual_home_score))
    ) {
      setSaveError("Manual home score must be a number.");
      return;
    }

    if (
      draft.manual_away_score !== "" &&
      draft.manual_away_score !== undefined &&
      Number.isNaN(Number(draft.manual_away_score))
    ) {
      setSaveError("Manual away score must be a number.");
      return;
    }

    setSavingMatchId(match.id);
    setSaveMessage("");
    setSaveError("");

    try {
      const updatedMatch = await saveMatchOverride({
        id: match.id,
        manual_home_score: manualHomeScore,
        manual_away_score: manualAwayScore,
        manual_winner: draft.manual_winner || null,
        manual_status: null,
      });

      setMatches((prev) =>
        prev.map((existingMatch) =>
          existingMatch.id === updatedMatch.id ? updatedMatch : existingMatch
        )
      );

      setDraftOverrides((prev) => ({
        ...prev,
        [updatedMatch.id]: {
          manual_home_score:
            updatedMatch.manual_home_score === null ||
            updatedMatch.manual_home_score === undefined
              ? ""
              : String(updatedMatch.manual_home_score),
          manual_away_score:
            updatedMatch.manual_away_score === null ||
            updatedMatch.manual_away_score === undefined
              ? ""
              : String(updatedMatch.manual_away_score),
          manual_winner: updatedMatch.manual_winner || "",
        },
      }));

      setSaveMessage(
        "Manual override saved. Click Update Leaderboard Scores to apply it to the leaderboard."
      );
    } catch (error) {
      console.error(error);
      setSaveError("There was a problem saving the manual override.");
    } finally {
      setSavingMatchId("");
    }
  };

  const handleClearOverride = async (match) => {
    setSavingMatchId(match.id);
    setSaveMessage("");
    setSaveError("");

    try {
      const updatedMatch = await clearMatchOverride(match.id);

      setMatches((prev) =>
        prev.map((existingMatch) =>
          existingMatch.id === updatedMatch.id ? updatedMatch : existingMatch
        )
      );

      setDraftOverrides((prev) => ({
        ...prev,
        [match.id]: {
          manual_home_score: "",
          manual_away_score: "",
          manual_winner: "",
        },
      }));

      setSaveMessage(
        "Manual override cleared. Click Update Leaderboard Scores to apply the API value to the leaderboard."
      );
    } catch (error) {
      console.error(error);
      setSaveError("There was a problem clearing the manual override.");
    } finally {
      setSavingMatchId("");
    }
  };

  if (loadingMatches) {
    return (
      <section className="page-section admin-page">
        <h2>Admin - Fixtures & Results</h2>

        <p className="page-intro">Loading synced match data...</p>

        <button type="button" onClick={goBack}>
          Back
        </button>
      </section>
    );
  }

  return (
    <section className="page-section admin-page admin-api-page">
      <style>
        {`
          .admin-api-page {
            width: 100%;
            max-width: 100%;
            overflow-x: hidden;
          }

          .admin-api-page h2 {
            text-align: center;
            color: #ffffff;
          }

          .admin-api-toolbar {
            display: flex;
            align-items: center;
            justify-content: center;
            flex-wrap: wrap;
            gap: 12px;
            margin: 26px 0 28px;
          }

          .admin-api-toolbar button,
          .admin-api-card button {
            border: none;
            cursor: pointer;
            border-radius: 16px;
            padding: 12px 16px;
            color: #e2e8f0;
            background: rgba(255, 255, 255, 0.08);
            font-size: 0.95rem;
            font-weight: 800;
          }

          .admin-api-toolbar button:hover,
          .admin-api-card button:hover {
            background: rgba(37, 99, 235, 0.72);
          }

          .admin-api-toolbar button:disabled,
          .admin-api-card button:disabled {
            cursor: not-allowed;
            opacity: 0.65;
          }

          .admin-api-toolbar button:nth-child(2),
          .admin-api-toolbar button:nth-child(3) {
            color: #ffffff;
            background: #2563eb;
          }

          .admin-api-toolbar button:nth-child(2):hover,
          .admin-api-toolbar button:nth-child(3):hover {
            background: #1d4ed8;
          }

          .admin-api-date-filter {
            width: min(220px, 100%);
            border: 1px solid rgba(255, 255, 255, 0.14);
            border-radius: 16px;
            padding: 12px 14px;
            color: #f8fafc;
            background: rgba(2, 6, 23, 0.72);
            font-weight: 800;
            outline: none;
          }

          .admin-api-list {
            display: grid;
            gap: 16px;
            width: 100%;
            max-width: 100%;
            margin-top: 24px;
          }

          .admin-api-card {
            width: 100%;
            max-width: 100%;
            overflow: hidden;
            border-radius: 24px;
            background: rgba(8, 24, 44, 0.88);
            border: 1px solid rgba(255, 255, 255, 0.16);
            box-shadow: 0 18px 40px rgba(0, 0, 0, 0.28);
          }

          .admin-api-card-header {
            display: grid;
            grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr) auto;
            gap: 14px;
            align-items: center;
            padding: 18px 20px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.12);
            background: rgba(15, 23, 42, 0.46);
          }

          .admin-api-date {
            color: #facc15;
            font-weight: 950;
            font-size: 1.05rem;
          }

          .admin-api-stage {
            color: #e2e8f0;
            font-weight: 900;
            text-align: center;
          }

          .admin-api-source {
            justify-self: end;
            border-radius: 999px;
            padding: 8px 12px;
            color: #ffffff;
            background: rgba(37, 99, 235, 0.28);
            border: 1px solid rgba(147, 197, 253, 0.22);
            font-size: 0.78rem;
            font-weight: 900;
            letter-spacing: 0.08em;
            text-transform: uppercase;
          }

          .admin-api-card-body {
            display: grid;
            grid-template-columns: minmax(0, 1.1fr) minmax(240px, 0.85fr) minmax(0, 1.1fr);
            gap: 18px;
            align-items: stretch;
            padding: 20px;
          }

          .admin-api-team {
            display: grid;
            align-content: center;
            gap: 8px;
            min-width: 0;
            padding: 18px;
            border-radius: 18px;
            background: rgba(255, 255, 255, 0.045);
            border: 1px solid rgba(255, 255, 255, 0.08);
          }

          .admin-api-team-label,
          .admin-api-small-label {
            color: rgba(255, 255, 255, 0.66);
            font-size: 0.72rem;
            font-weight: 900;
            letter-spacing: 0.1em;
            text-transform: uppercase;
          }

          .admin-api-team-name {
            color: #ffffff;
            font-size: 1.2rem;
            font-weight: 900;
            word-break: break-word;
          }

          .admin-api-score-panel {
            display: grid;
            gap: 12px;
            align-content: center;
            min-width: 0;
            padding: 18px;
            border-radius: 18px;
            background: rgba(2, 6, 23, 0.42);
            border: 1px solid rgba(255, 255, 255, 0.1);
          }

          .admin-api-score-line {
            display: flex;
            justify-content: space-between;
            gap: 14px;
            color: #e2e8f0;
            font-weight: 800;
          }

          .admin-api-score-line strong {
            color: #facc15;
          }

          .admin-api-override-grid {
            display: grid;
            grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
            align-items: center;
            gap: 8px;
          }

          .admin-api-override-grid input {
            width: 100%;
            min-width: 0;
            border: 1px solid rgba(255, 255, 255, 0.16);
            border-radius: 14px;
            padding: 12px 10px;
            color: #f8fafc;
            background: rgba(2, 6, 23, 0.72);
            font-weight: 900;
            text-align: center;
            outline: none;
          }

          .admin-api-override-grid span {
            color: #facc15;
            font-weight: 950;
          }

          .admin-api-controls {
            display: grid;
            grid-template-columns: minmax(0, 1fr);
            gap: 12px;
            padding: 0 20px 20px;
          }

          .admin-api-control-block {
            min-width: 0;
            padding: 14px;
            border-radius: 18px;
            background: rgba(255, 255, 255, 0.045);
            border: 1px solid rgba(255, 255, 255, 0.08);
          }

          .admin-api-control-block select {
            width: 100%;
            min-width: 0;
            margin-top: 8px;
            border: 1px solid rgba(255, 255, 255, 0.16);
            border-radius: 14px;
            padding: 11px 12px;
            color: #f8fafc;
            background: rgba(2, 6, 23, 0.72);
            font-weight: 800;
            outline: none;
          }

          .admin-api-helper {
            margin-top: 8px;
            color: #cbd5e1;
            font-size: 0.82rem;
            line-height: 1.45;
          }

          .admin-api-actions {
            display: flex;
            align-items: center;
            justify-content: flex-end;
            flex-wrap: wrap;
            gap: 10px;
            padding: 0 20px 20px;
          }

          .admin-api-actions button:first-child {
            color: #ffffff;
            background: #2563eb;
          }

          .admin-api-actions button:first-child:hover {
            background: #1d4ed8;
          }

          @media (max-width: 900px) {
            .admin-api-card-header {
              grid-template-columns: 1fr;
              text-align: left;
            }

            .admin-api-stage {
              text-align: left;
            }

            .admin-api-source {
              justify-self: start;
            }

            .admin-api-card-body {
              grid-template-columns: 1fr;
            }

            .admin-api-actions {
              justify-content: stretch;
            }

            .admin-api-actions button {
              width: 100%;
            }
          }

          @media (max-width: 700px) {
            .admin-api-toolbar {
              display: grid;
              grid-template-columns: 1fr;
            }

            .admin-api-toolbar button,
            .admin-api-date-filter {
              width: 100%;
            }

            .admin-api-card-header,
            .admin-api-card-body,
            .admin-api-controls,
            .admin-api-actions {
              padding-left: 14px;
              padding-right: 14px;
            }
          }
        `}
      </style>

      <h2>Admin - Fixtures & Results</h2>

      <p className="page-intro">
        Fixtures, dates and API scores are synced from football-data.org into
        Supabase. You can override any score or winner here. Manual overrides
        always take priority over API data.
      </p>

      <div className="admin-api-toolbar">
        <button type="button" onClick={goBack}>
          Back
        </button>

        <button
          type="button"
          onClick={handleSyncAndUpdateScores}
          disabled={syncingMatches || updatingScores}
        >
          {syncingMatches || updatingScores
            ? "Syncing..."
            : "Sync API + Update Leaderboard"}
        </button>

        <button
          type="button"
          onClick={handleUpdateLeaderboardScores}
          disabled={updatingScores}
        >
          {updatingScores ? "Updating..." : "Update Leaderboard Scores"}
        </button>

        <button
          type="button"
          onClick={handleSyncLatestScores}
          disabled={syncingMatches}
        >
          {syncingMatches ? "Syncing..." : "Sync API Only"}
        </button>

        <select
          className="admin-api-date-filter"
          value={selectedDate}
          onChange={(event) => setSelectedDate(event.target.value)}
        >
          <option value="">All Dates</option>

          {availableDates.map((date) => (
            <option key={date} value={date}>
              {date}
            </option>
          ))}
        </select>

        {selectedDate && (
          <button type="button" onClick={() => setSelectedDate("")}>
            Clear Date Filter
          </button>
        )}
      </div>

      {saveMessage && <p className="success-message">{saveMessage}</p>}

      {saveError && <p className="error-message">{saveError}</p>}

      {filteredMatches.length === 0 ? (
        <p className="page-intro">
          No matches found. Click Sync API Only to pull fixtures from the API.
        </p>
      ) : (
        <div className="admin-api-list">
          {filteredMatches.map((match) => {
            const draft = draftOverrides[match.id] || {};
            const finalHomeScore = getFinalHomeScore(match);
            const finalAwayScore = getFinalAwayScore(match);
            const finalWinner = getFinalWinner(match);

            return (
              <article className="admin-api-card" key={match.id}>
                <div className="admin-api-card-header">
                  <div className="admin-api-date">
                    {formatDateTime(match.match_date_utc)}
                  </div>

                  <div className="admin-api-stage">
                    {getStageLabel(match.stage, match.group_name)}
                  </div>

                  <div className="admin-api-source">
                    {getSourceLabel(match)}
                  </div>
                </div>

                <div className="admin-api-card-body">
                  <div className="admin-api-team">
                    <span className="admin-api-team-label">Home</span>
                    <span className="admin-api-team-name">
                      {match.home_team || "TBC"}
                    </span>
                  </div>

                  <div className="admin-api-score-panel">
                    <div className="admin-api-score-line">
                      <span>API Score</span>
                      <strong>
                        {formatScore(
                          match.api_home_score,
                          match.api_away_score
                        )}
                      </strong>
                    </div>

                    <div className="admin-api-score-line">
                      <span>Used Score</span>
                      <strong>
                        {formatScore(finalHomeScore, finalAwayScore)}
                      </strong>
                    </div>

                    <div>
                      <div className="admin-api-small-label">
                        Manual Override
                      </div>

                      <div className="admin-api-override-grid">
                        <input
                          type="number"
                          min="0"
                          placeholder="-"
                          value={draft.manual_home_score ?? ""}
                          onChange={(event) =>
                            updateDraftOverride(
                              match.id,
                              "manual_home_score",
                              event.target.value
                            )
                          }
                        />

                        <span>-</span>

                        <input
                          type="number"
                          min="0"
                          placeholder="-"
                          value={draft.manual_away_score ?? ""}
                          onChange={(event) =>
                            updateDraftOverride(
                              match.id,
                              "manual_away_score",
                              event.target.value
                            )
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <div className="admin-api-team">
                    <span className="admin-api-team-label">Away</span>
                    <span className="admin-api-team-name">
                      {match.away_team || "TBC"}
                    </span>
                  </div>
                </div>

                <div className="admin-api-controls">
                  <div className="admin-api-control-block">
                    <div className="admin-api-small-label">Winner</div>

                    <select
                      value={draft.manual_winner ?? ""}
                      onChange={(event) =>
                        updateDraftOverride(
                          match.id,
                          "manual_winner",
                          event.target.value
                        )
                      }
                    >
                      <option value="">
                        Use API/score: {finalWinner || "None"}
                      </option>

                      {match.home_team && (
                        <option value={match.home_team}>
                          {match.home_team}
                        </option>
                      )}

                      {match.away_team && (
                        <option value={match.away_team}>
                          {match.away_team}
                        </option>
                      )}
                    </select>

                    <div className="admin-api-helper">
                      Use this only when you need to manually choose who
                      advanced, for example after penalties.
                    </div>
                  </div>
                </div>

                <div className="admin-api-actions">
                  <button
                    type="button"
                    onClick={() => handleSaveOverride(match)}
                    disabled={savingMatchId === match.id}
                  >
                    {savingMatchId === match.id ? "Saving..." : "Save Override"}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleClearOverride(match)}
                    disabled={savingMatchId === match.id}
                  >
                    Clear Override
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <p className="page-note">
        Update Leaderboard Scores recalculates directly from the Supabase
        matches table. Manual scores are used first. If no manual score exists,
        the API score is used.
      </p>
    </section>
  );
}