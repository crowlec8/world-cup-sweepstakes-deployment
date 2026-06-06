import { useEffect, useMemo, useState } from "react";
import ScoringRules from "../components/ScoringRules.jsx";
import {
  getCountryScores,
  getPointsForTeam,
} from "../lib/countryScoreService";

export default function LeaderboardPage({ leaderboard, playerName }) {
  const [teamScores, setTeamScores] = useState({});
  const [loadingScores, setLoadingScores] = useState(true);
  const [scoreError, setScoreError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadScores = async () => {
      try {
        setLoadingScores(true);
        setScoreError("");

        const scores = await getCountryScores();

        if (isMounted) {
          setTeamScores(scores);
        }
      } catch (error) {
        console.error(error);

        if (isMounted) {
          setScoreError("There was a problem loading the latest scores.");
        }
      } finally {
        if (isMounted) {
          setLoadingScores(false);
        }
      }
    };

    loadScores();

    return () => {
      isMounted = false;
    };
  }, []);

  const leaderboardWithScores = useMemo(() => {
    return [...leaderboard]
      .map((entry) => {
        const totalPoints = (entry.teams || []).reduce((sum, team) => {
          return sum + getPointsForTeam(teamScores, team);
        }, 0);

        return {
          ...entry,
          totalPoints,
        };
      })
      .sort((a, b) => b.totalPoints - a.totalPoints);
  }, [leaderboard, teamScores]);

  return (
    <section className="page-section leaderboard-page">
      {loadingScores && <p>Loading latest scores...</p>}

      {scoreError && <p className="error-message">{scoreError}</p>}

      {leaderboardWithScores.length === 0 ? (
        <p>No entries yet. Spin the slots to add the first row.</p>
      ) : (
        <div className="responsive-table-shell leaderboard-table-shell">
          <table className="responsive-table leaderboard-table">
            <thead>
              <tr>
                <th>Pos</th>
                <th>Name</th>
                <th>Pool 1</th>
                <th>Pool 2</th>
                <th>Pool 3</th>
                <th>Pool 4</th>
                <th>Total Points</th>
              </tr>
            </thead>

            <tbody>
              {leaderboardWithScores.map((entry, index) => (
                <tr key={`${entry.name}-${index}`}>
                  <td data-label="Pos">{index + 1}</td>
                  <td data-label="Name">{entry.name}</td>
                  <td data-label="Pool 1">{entry.teams?.[0] ?? "-"}</td>
                  <td data-label="Pool 2">{entry.teams?.[1] ?? "-"}</td>
                  <td data-label="Pool 3">{entry.teams?.[2] ?? "-"}</td>
                  <td data-label="Pool 4">{entry.teams?.[3] ?? "-"}</td>
                  <td data-label="Total Points">{entry.totalPoints}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="page-note">Scores will be updated daily.</p>

      <ScoringRules />
    </section>
  );
}