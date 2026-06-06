import { useEffect, useState } from "react";
import { calculateTeamScores } from "../utils/scoring.js";
import { updateCountryScores } from "../lib/countryScoreService";

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

export default function AdminPage({ goBack }) {
  const [matches, setMatches] = useState({});
  const [savingScores, setSavingScores] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("matches");
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

    if (stored) {
      const existing = JSON.parse(stored);

      setMatches({
        ...initial,
        ...existing,
      });
    } else {
      setMatches(initial);
    }
  }, []);

  useEffect(() => {
    if (Object.keys(matches).length > 0) {
      localStorage.setItem("matches", JSON.stringify(matches));
    }
  }, [matches]);

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
      const calculatedScores = calculateTeamScores(matches);
      const { updatedRows, missingTeams } = await updateCountryScores(calculatedScores);

      let message = `Scores updated successfully for ${updatedRows.length} countries.`;

      if (missingTeams.length > 0) {
        message += ` These teams were not found in Supabase and were skipped: ${[
          ...new Set(missingTeams),
        ].join(", ")}.`;
      }

      setSaveMessage(message);
    } catch (error) {
      console.error(error);
      setSaveError(
        error?.message || "There was a problem updating the scores in Supabase."
      );
    } finally {
      setSavingScores(false);
    }
  };

  const clearAllStorage = () => {
    const confirmClear = window.confirm(
      "Are you sure you want to clear ALL local storage? This will reset locally saved match entries on this browser. Supabase scores will not be cleared unless you click Update Supabase Scores afterwards."
    );

    if (!confirmClear) return;

    localStorage.clear();
    window.location.reload();
  };

  return (
    <>
      <h2>Admin - Fixtures & Results</h2>

      <p>
        Enter scores for the group matches and both teams plus scores for the knockout
        rounds. Group stage team names are locked because they are pre-filled. For the
        3rd place playoff and Final, if the match ends level you can use the Pens
        buttons to select the winner on penalties.
      </p>

      <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
        <button type="button" onClick={goBack}>
          Back
        </button>

        <button type="button" onClick={clearAllStorage}>
          Clear Storage
        </button>

        <button
          type="button"
          onClick={saveScoresToSupabase}
          disabled={savingScores}
        >
          {savingScores ? "Updating..." : "Update Supabase Scores"}
        </button>
      </div>

      {saveMessage && (
        <p style={{ color: "green", fontWeight: "bold" }}>{saveMessage}</p>
      )}

      {saveError && (
        <p style={{ color: "crimson", fontWeight: "bold" }}>{saveError}</p>
      )}

      <table>
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
                <td>
                  {isGroupMatch ? `Group Match ${key.split("-")[1]}` : key}
                </td>

                <td>
                  <input
                    type="text"
                    value={match.home}
                    disabled={isGroupMatch}
                    onChange={(e) => updateMatch(key, "home", e.target.value)}
                  />
                </td>

                <td>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                    }}
                  >
                    <input
                      type="number"
                      min="0"
                      value={match.homeScore}
                      onChange={(e) =>
                        updateMatch(key, "homeScore", Number(e.target.value))
                      }
                      style={{ width: "70px", textAlign: "center" }}
                    />

                    {isPensMatch && isDraw && (
                      <button
                        type="button"
                        onClick={() => togglePens(key, "home")}
                        style={{
                          fontWeight: match.homePens ? "bold" : "normal",
                        }}
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
                      style={{ width: "70px", textAlign: "center" }}
                    />

                    {isPensMatch && isDraw && (
                      <button
                        type="button"
                        onClick={() => togglePens(key, "away")}
                        style={{
                          fontWeight: match.awayPens ? "bold" : "normal",
                        }}
                      >
                        Pens
                      </button>
                    )}
                  </div>
                </td>

                <td>
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
    </>
  );
}