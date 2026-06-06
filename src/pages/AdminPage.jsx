import { useEffect, useState } from "react";
import { calculateTeamScores } from "../utils/scoring.js";
import { updateCountryScores } from "../lib/countryScoreService";
import { getAdminMatches, saveAdminMatches } from "../lib/matchService";

// 72 group stage match keys
const GROUP_STAGE_KEYS = Array.from({ length: 72 }, (_, i) => `GROUP-${i + 1}`);

// Knockout structure
const MATCH_TEMPLATE = [
  ...Array.from({ length: 16 }, (_, i) => `R32-${i + 1}`),
  ...Array.from({ length: 8 }, (_, i) => `R16-${i + 1}`),
  ...Array.from({ length: 4 }, (_, i) => `QF-${i + 1}`),
  ...Array.from({ length: 2 }, (_, i) => `SF-${i + 1}`),
  "3RD",
  "FINAL",
];

// Team names here must exactly match scores.team in Supabase
const GROUP_FIXTURES = [
  ["Mexico", "South Africa"],
  ["South Korea", "Czechia"],
  ["Canada", "Bosnia and Herzegovina"],
  ["USA", "Paraguay"],
  ["Haiti", "Scotland"],
  ["Australia", "Turkey"],
  ["Brazil", "Morocco"],
  ["Qatar", "Switzerland"],
  ["Ivory Coast", "Ecuador"],
  ["Germany", "Curacao"],
  ["Netherlands", "Japan"],
  ["Sweden", "Tunisia"],
  ["Saudi Arabia", "Uruguay"],
  ["Spain", "Cape Verde"],
  ["Iran", "New Zealand"],
  ["Belgium", "Egypt"],
  ["France", "Senegal"],
  ["Iraq", "Norway"],
  ["Argentina", "Algeria"],
  ["Austria", "Jordan"],
  ["Ghana", "Panama"],
  ["England", "Croatia"],
  ["Portugal", "DR Congo"],
  ["Uzbekistan", "Colombia"],
  ["Czechia", "South Africa"],
  ["Switzerland", "Bosnia and Herzegovina"],
  ["Canada", "Qatar"],
  ["Mexico", "South Korea"],
  ["Brazil", "Haiti"],
  ["Scotland", "Morocco"],
  ["Turkey", "Paraguay"],
  ["USA", "Australia"],
  ["Germany", "Ivory Coast"],
  ["Ecuador", "Curacao"],
  ["Netherlands", "Sweden"],
  ["Tunisia", "Japan"],
  ["Uruguay", "Cape Verde"],
  ["Spain", "Saudi Arabia"],
  ["Belgium", "Iran"],
  ["New Zealand", "Egypt"],
  ["Norway", "Senegal"],
  ["France", "Iraq"],
  ["Argentina", "Austria"],
  ["Jordan", "Algeria"],
  ["England", "Ghana"],
  ["Panama", "Croatia"],
  ["Portugal", "Uzbekistan"],
  ["Colombia", "DR Congo"],
  ["Scotland", "Brazil"],
  ["Morocco", "Haiti"],
  ["Switzerland", "Canada"],
  ["Bosnia and Herzegovina", "Qatar"],
  ["Czechia", "Mexico"],
  ["South Africa", "South Korea"],
  ["Curacao", "Ivory Coast"],
  ["Ecuador", "Germany"],
  ["Japan", "Sweden"],
  ["Tunisia", "Netherlands"],
  ["Turkey", "USA"],
  ["Paraguay", "Australia"],
  ["Norway", "France"],
  ["Senegal", "Iraq"],
  ["Egypt", "Iran"],
  ["New Zealand", "Belgium"],
  ["Cape Verde", "Saudi Arabia"],
  ["Uruguay", "Spain"],
  ["Panama", "England"],
  ["Croatia", "Ghana"],
  ["Algeria", "Austria"],
  ["Jordan", "Argentina"],
  ["Colombia", "Portugal"],
  ["DR Congo", "Uzbekistan"],
];

function createInitialMatches() {
  const initial = {};

  GROUP_STAGE_KEYS.forEach((key, i) => {
    const fixture = GROUP_FIXTURES[i];

    initial[key] = {
      home: fixture ? fixture[0] : "",
      away: fixture ? fixture[1] : "",
      homeScore: 0,
      awayScore: 0,
      homePens: false,
      awayPens: false,
    };
  });

  MATCH_TEMPLATE.forEach((key) => {
    initial[key] = {
      home: "",
      away: "",
      homeScore: 0,
      awayScore: 0,
      homePens: false,
      awayPens: false,
    };
  });

  return initial;
}

function mergeSavedRowsIntoInitialMatches(savedRows) {
  const initial = createInitialMatches();

  savedRows.forEach((row) => {
    const key = row.match_key;

    if (!initial[key]) {
      return;
    }

    const isGroupMatch = key.startsWith("GROUP");

    initial[key] = {
      ...initial[key],
      home: isGroupMatch ? initial[key].home : row.home || "",
      away: isGroupMatch ? initial[key].away : row.away || "",
      homeScore: Number(row.home_score || 0),
      awayScore: Number(row.away_score || 0),
      homePens: Boolean(row.home_pens),
      awayPens: Boolean(row.away_pens),
    };
  });

  return initial;
}

function mergeLocalStorageIntoInitialMatches(localMatches) {
  const initial = createInitialMatches();

  Object.entries(localMatches || {}).forEach(([key, match]) => {
    if (!initial[key]) {
      return;
    }

    const isGroupMatch = key.startsWith("GROUP");

    initial[key] = {
      ...initial[key],
      home: isGroupMatch ? initial[key].home : match.home || "",
      away: isGroupMatch ? initial[key].away : match.away || "",
      homeScore: Number(match.homeScore || 0),
      awayScore: Number(match.awayScore || 0),
      homePens: Boolean(match.homePens),
      awayPens: Boolean(match.awayPens),
    };
  });

  return initial;
}

export default function AdminPage({ goBack }) {
  const [matches, setMatches] = useState({});
  const [loadingMatches, setLoadingMatches] = useState(true);
  const [savingScores, setSavingScores] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadMatches = async () => {
      setLoadingMatches(true);
      setSaveMessage("");
      setSaveError("");

      try {
        const savedRows = await getAdminMatches();

        if (!isMounted) {
          return;
        }

        if (savedRows.length > 0) {
          setMatches(mergeSavedRowsIntoInitialMatches(savedRows));
          return;
        }

        const stored = localStorage.getItem("matches");

        if (stored) {
          const localMatches = JSON.parse(stored);
          setMatches(mergeLocalStorageIntoInitialMatches(localMatches));
          setSaveMessage(
            "Loaded locally saved match data. Click Update Supabase Scores once to sync these match results across devices."
          );
          return;
        }

        setMatches(createInitialMatches());
      } catch (error) {
        console.error(error);

        if (!isMounted) {
          return;
        }

        const stored = localStorage.getItem("matches");

        if (stored) {
          try {
            const localMatches = JSON.parse(stored);
            setMatches(mergeLocalStorageIntoInitialMatches(localMatches));
            setSaveError(
              "Could not load saved matches from Supabase, so local browser data was loaded instead."
            );
          } catch {
            setMatches(createInitialMatches());
            setSaveError("Could not load saved matches from Supabase.");
          }
        } else {
          setMatches(createInitialMatches());
          setSaveError("Could not load saved matches from Supabase.");
        }
      } finally {
        if (isMounted) {
          setLoadingMatches(false);
        }
      }
    };

    loadMatches();

    return () => {
      isMounted = false;
    };
  }, []);

  const updateMatch = (key, field, value) => {
    setSaveMessage("");
    setSaveError("");

    setMatches((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value,
      },
    }));
  };

  const togglePens = (key, side) => {
    setSaveMessage("");
    setSaveError("");

    setMatches((prev) => {
      const match = prev[key];

      return {
        ...prev,
        [key]: {
          ...match,
          homePens: side === "home" ? !match.homePens : false,
          awayPens: side === "away" ? !match.awayPens : false,
        },
      };
    });
  };

  const saveScoresToSupabase = async () => {
    setSavingScores(true);
    setSaveMessage("");
    setSaveError("");

    try {
      await saveAdminMatches(matches);

      const calculatedScores = calculateTeamScores(matches);
      const { updatedRows, missingTeams } = await updateCountryScores(
        calculatedScores
      );

      localStorage.setItem("matches", JSON.stringify(matches));

      let message = `Match results saved and scores updated successfully for ${updatedRows.length} countries.`;

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
          "There was a problem saving the match results or updating the scores in Supabase."
      );
    } finally {
      setSavingScores(false);
    }
  };

  if (loadingMatches) {
    return (
      <section className="page-section admin-page">
        <h2>Admin - Fixtures & Results</h2>

        <p className="page-intro">Loading saved match results...</p>

        <button type="button" onClick={goBack}>
          Back
        </button>
      </section>
    );
  }

  return (
    <section className="page-section admin-page">
      <h2>Admin - Fixtures & Results</h2>

      <p className="page-intro">
        Enter scores for the group matches and both teams plus scores for the
        knockout rounds. Group stage team names are locked because they are
        pre-filled. For the 3rd place playoff and Final, if the match ends level
        you can use the Pens buttons to select the winner on penalties.
      </p>

      <div className="admin-toolbar">
        <button type="button" onClick={goBack}>
          Back
        </button>

        <button
          type="button"
          onClick={saveScoresToSupabase}
          disabled={savingScores}
        >
          {savingScores ? "Updating..." : "Update Supabase Scores"}
        </button>
      </div>

      {saveMessage && <p className="success-message">{saveMessage}</p>}

      {saveError && <p className="error-message">{saveError}</p>}

      <div className="responsive-table-shell admin-table-shell">
        <table className="responsive-table admin-table">
          <thead>
            <tr>
              <th>Match</th>
              <th>Home</th>
              <th>Score</th>
              <th>Away</th>
            </tr>
          </thead>

          <tbody>
            {[...GROUP_STAGE_KEYS, ...MATCH_TEMPLATE].map((key) => {
              const match = matches[key];

              if (!match) return null;

              const isGroupMatch = key.startsWith("GROUP");
              const isPensMatch = key === "3RD" || key === "FINAL";
              const isDraw = Number(match.homeScore) === Number(match.awayScore);

              return (
                <tr key={key}>
                  <td data-label="Match">
                    {isGroupMatch ? `Group Match ${key.split("-")[1]}` : key}
                  </td>

                  <td data-label="Home">
                    <input
                      type="text"
                      value={match.home}
                      disabled={isGroupMatch}
                      onChange={(e) => updateMatch(key, "home", e.target.value)}
                    />
                  </td>

                  <td data-label="Score">
                    <div className="admin-score-controls">
                      <input
                        type="number"
                        min="0"
                        value={match.homeScore}
                        onChange={(e) =>
                          updateMatch(key, "homeScore", Number(e.target.value))
                        }
                      />

                      {isPensMatch && isDraw && (
                        <button
                          type="button"
                          onClick={() => togglePens(key, "home")}
                          className={match.homePens ? "selected-pen-button" : ""}
                        >
                          Pens
                        </button>
                      )}

                      <span>-</span>

                      <input
                        type="number"
                        min="0"
                        value={match.awayScore}
                        onChange={(e) =>
                          updateMatch(key, "awayScore", Number(e.target.value))
                        }
                      />

                      {isPensMatch && isDraw && (
                        <button
                          type="button"
                          onClick={() => togglePens(key, "away")}
                          className={match.awayPens ? "selected-pen-button" : ""}
                        >
                          Pens
                        </button>
                      )}
                    </div>
                  </td>

                  <td data-label="Away">
                    <input
                      type="text"
                      value={match.away}
                      disabled={isGroupMatch}
                      onChange={(e) => updateMatch(key, "away", e.target.value)}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}