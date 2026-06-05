import { useEffect, useState } from "react";

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

// Group stage fixtures in order
const GROUP_FIXTURES = [
  ["Mexico", "South Africa"],
  ["Korea Republic", "Czechia"],
  ["Canada", "Bosnia and Herzegovina"],
  ["USA", "Paraguay"],
  ["Haiti", "Scotland"],
  ["Australia", "Türkiye"],
  ["Brazil", "Morocco"],
  ["Qatar", "Switzerland"],
  ["Côte d'Ivoire", "Ecuador"],
  ["Germany", "Curaçao"],
  ["Netherlands", "Japan"],
  ["Sweden", "Tunisia"],
  ["Saudi Arabia", "Uruguay"],
  ["Spain", "Cabo Verde"],
  ["IR Iran", "New Zealand"],
  ["Belgium", "Egypt"],
  ["France", "Senegal"],
  ["Iraq", "Norway"],
  ["Argentina", "Algeria"],
  ["Austria", "Jordan"],
  ["Ghana", "Panama"],
  ["England", "Croatia"],
  ["Portugal", "Congo DR"],
  ["Uzbekistan", "Colombia"],
  ["Czechia", "South Africa"],
  ["Switzerland", "Bosnia and Herzegovina"],
  ["Canada", "Qatar"],
  ["Mexico", "Korea Republic"],
  ["Brazil", "Haiti"],
  ["Scotland", "Morocco"],
  ["Türkiye", "Paraguay"],
  ["USA", "Australia"],
  ["Germany", "Côte d'Ivoire"],
  ["Ecuador", "Curaçao"],
  ["Netherlands", "Sweden"],
  ["Tunisia", "Japan"],
  ["Uruguay", "Cabo Verde"],
  ["Spain", "Saudi Arabia"],
  ["Belgium", "IR Iran"],
  ["New Zealand", "Egypt"],
  ["Norway", "Senegal"],
  ["France", "Iraq"],
  ["Argentina", "Austria"],
  ["Jordan", "Algeria"],
  ["England", "Ghana"],
  ["Panama", "Croatia"],
  ["Portugal", "Uzbekistan"],
  ["Colombia", "Congo DR"],
  ["Scotland", "Brazil"],
  ["Morocco", "Haiti"],
  ["Switzerland", "Canada"],
  ["Bosnia and Herzegovina", "Qatar"],
  ["Czechia", "Mexico"],
  ["South Africa", "Korea Republic"],
  ["Curaçao", "Côte d'Ivoire"],
  ["Ecuador", "Germany"],
  ["Japan", "Sweden"],
  ["Tunisia", "Netherlands"],
  ["Türkiye", "USA"],
  ["Paraguay", "Australia"],
  ["Norway", "France"],
  ["Senegal", "Iraq"],
  ["Egypt", "IR Iran"],
  ["New Zealand", "Belgium"],
  ["Cabo Verde", "Saudi Arabia"],
  ["Uruguay", "Spain"],
  ["Panama", "England"],
  ["Croatia", "Ghana"],
  ["Algeria", "Austria"],
  ["Jordan", "Argentina"],
  ["Colombia", "Portugal"],
  ["Congo DR", "Uzbekistan"],
];

export default function AdminPage({ goBack }) {
  const [matches, setMatches] = useState({});

  useEffect(() => {
    const stored = localStorage.getItem("matches");

    const initial = {};

    // Group stage matches with preset teams
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

    // Knockout matches
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
    setMatches((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value,
      },
    }));
  };

  const togglePens = (key, side) => {
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

  const clearAllStorage = () => {
    const confirmClear = window.confirm(
      "Are you sure you want to clear ALL local storage? This will reset leagues, matches, and leaderboard data."
    );

    if (!confirmClear) return;

    localStorage.clear();
    window.location.reload();
  };

  return (
    <section className="panel hero">
      <h2>Admin - Fixtures & Results</h2>

      <p className="subtext">
        Enter scores for the group matches and both teams plus scores for the knockout rounds.
        Group stage team names are locked because they are pre-filled. For the 3rd place playoff
        and Final, if the match ends level you can use the Pens buttons to select the winner on penalties.
      </p>

      <div className="toolbar" style={{ marginTop: 16, marginBottom: 16 }}>
        <button className="btn btn-secondary" onClick={goBack}>
          Back
        </button>

        <button className="btn btn-danger" onClick={clearAllStorage}>
          Clear Storage
        </button>
      </div>

      <div className="table-wrap">
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
                      className="input"
                      value={match.home}
                      disabled={isGroupMatch}
                      onChange={(e) => updateMatch(key, "home", e.target.value)}
                    />
                  </td>

                  <td>
                    <div
                      style={{
                        display: "flex",
                        gap: "12px",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {/* Home score + pens */}
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                        }}
                      >
                        <input
                          className="input"
                          type="number"
                          value={match.homeScore}
                          onChange={(e) =>
                            updateMatch(key, "homeScore", Number(e.target.value))
                          }
                          style={{ width: "70px", textAlign: "center" }}
                        />

                        {isPensMatch && isDraw && (
                          <button
                            type="button"
                            className="btn btn-secondary"
                            style={{
                              marginTop: "4px",
                              padding: "6px 10px",
                              background: match.homePens ? "#22c55e" : undefined,
                              color: match.homePens ? "white" : undefined,
                            }}
                            onClick={() => togglePens(key, "home")}
                          >
                            Pens
                          </button>
                        )}
                      </div>

                      <span style={{ fontWeight: "bold" }}>-</span>

                      {/* Away score + pens */}
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                        }}
                      >
                        <input
                          className="input"
                          type="number"
                          value={match.awayScore}
                          onChange={(e) =>
                            updateMatch(key, "awayScore", Number(e.target.value))
                          }
                          style={{ width: "70px", textAlign: "center" }}
                        />

                        {isPensMatch && isDraw && (
                          <button
                            type="button"
                            className="btn btn-secondary"
                            style={{
                              marginTop: "4px",
                              padding: "6px 10px",
                              background: match.awayPens ? "#22c55e" : undefined,
                              color: match.awayPens ? "white" : undefined,
                            }}
                            onClick={() => togglePens(key, "away")}
                          >
                            Pens
                          </button>
                        )}
                      </div>
                    </div>
                  </td>

                  <td>
                    <input
                      className="input"
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
