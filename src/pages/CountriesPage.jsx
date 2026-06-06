import { useEffect, useMemo, useState } from "react";
import ScoringRules from "../components/ScoringRules";
import { getCountryScoreRows } from "../lib/countryScoreService";

export default function CountriesPage({ pools, goBack }) {
  const [countryRows, setCountryRows] = useState([]);
  const [loadingScores, setLoadingScores] = useState(true);
  const [scoreError, setScoreError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadScores = async () => {
      try {
        setLoadingScores(true);
        setScoreError("");

        const rows = await getCountryScoreRows();

        if (isMounted) {
          setCountryRows(rows);
        }
      } catch (error) {
        console.error(error);

        if (isMounted) {
          setScoreError("There was a problem loading the country scores.");
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

  const countriesWithScores = useMemo(() => {
    return [...countryRows]
      .map((row) => ({
        team: row.team,
        points: row.points || 0,
      }))
      .sort((a, b) => b.points - a.points || a.team.localeCompare(b.team));
  }, [countryRows]);

  return (
    <>
      <p>This page shows all available countries ordered by their total points.</p>

      {loadingScores && <p>Loading latest country scores...</p>}

      {scoreError && (
        <p style={{ color: "crimson", fontWeight: "bold" }}>{scoreError}</p>
      )}

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

      <p>Country points update daily.</p>
    </>
  );
}