import ScoringRules from "../components/ScoringRules";
import { calculateTeamScores } from "../utils/scoring";

export default function LeaderboardPage({
  leaderboard,
  playerName,
}) {
  // ✅ Get match data from Admin page
  const matches = JSON.parse(localStorage.getItem("matches") || "{}");

  // ✅ Calculate team scores from matches
  const teamScores = calculateTeamScores(matches);

  // ✅ Add total score to each player
  const leaderboardWithScores = [...leaderboard]
    .map((entry) => {
      const totalPoints = (entry.teams || []).reduce((sum, team) => {
        return sum + (teamScores?.[team] || 0);
      }, 0);

      return {
        ...entry,
        totalPoints,
      };
    })
    .sort((a, b) => b.totalPoints - a.totalPoints);

  return (
    <>
      <table>
        <tr>
          <th>Pos</th>
          <th>Name</th>
          <th>Pool 1</th>
          <th>Pool 2</th>
          <th>Pool 3</th>
          <th>Pool 4</th>
          <th>Total Points</th>
        </tr>

        {leaderboardWithScores.length === 0 ? (
          <tr>
            <td colSpan="7">
              No entries yet. Spin the slots to add the first row.
            </td>
          </tr>
        ) : (
          leaderboardWithScores.map((entry, index) => (
            <tr key={entry.name}>
              <td>{index + 1}</td>
              <td>{entry.name}</td>
              <td>{entry.teams?.[0] ?? "-"}</td>
              <td>{entry.teams?.[1] ?? "-"}</td>
              <td>{entry.teams?.[2] ?? "-"}</td>
              <td>{entry.teams?.[3] ?? "-"}</td>
              <td>{entry.totalPoints}</td>
            </tr>
          ))
        )}
      </table>

      <p style={{ marginTop: 12 }}>
        Scores will be updated daily.
      </p>
    </>
  );
}