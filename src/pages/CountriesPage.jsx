import ScoringRules from "../components/ScoringRules";
import { calculateTeamScores } from "../utils/scoring.js";

export default function CountriesPage({ pools, goBack }) {
  const allTeams = [...new Set(pools.flat())];

  const matches = JSON.parse(localStorage.getItem("matches") || "{}");
  const teamScores = calculateTeamScores(matches);

  const countriesWithScores = allTeams
    .map((team) => ({
      team,
      points: teamScores[team] || 0,
    }))
    .sort((a, b) => b.points - a.points);

  return (
    <section className="panel hero">
      <p className="subtext">
        This page shows all available countries ordered by their total points.
      </p>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Pos</th>
              <th>Country</th>
              <th>Total Points</th>
            </tr>
          </thead>

          <tbody>
            {countriesWithScores.map((entry, index) => (
              <tr key={entry.team}>
                <td>{index + 1}</td>
                <td>{entry.team}</td>
                <td>{entry.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="small-note">
        Country points update daily.
      </p>

    </section>
  );
}