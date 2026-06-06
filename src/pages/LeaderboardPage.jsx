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
      <style>
        {`
          .leaderboard-page {
            width: 100%;
          }

          .leaderboard-list {
            display: grid;
            gap: 14px;
            width: 100%;
            margin-top: 20px;
            padding: 0;
            border: none;
            outline: none;
            box-shadow: none;
            background: transparent;
          }

          .leaderboard-card {
            display: grid;
            grid-template-columns: 72px 1.25fr repeat(4, 1fr) 120px;
            width: 100%;
            overflow: hidden;
            border-radius: 18px;
            color: #f3f7ff;
            background: rgba(8, 24, 44, 0.86);
            border: 1px solid rgba(255, 255, 255, 0.82);
            box-shadow: 0 14px 34px rgba(0, 0, 0, 0.34);
          }

          .leaderboard-cell {
            display: grid;
            align-content: center;
            gap: 6px;
            min-width: 0;
            padding: 14px 12px;
            text-align: center;
            border-right: 1px solid rgba(255, 255, 255, 0.14);
          }

          .leaderboard-cell:last-child {
            border-right: none;
          }

          .leaderboard-label {
            display: block;
            color: rgba(255, 255, 255, 0.72);
            font-size: 0.72rem;
            font-weight: 800;
            letter-spacing: 0.08em;
            text-transform: uppercase;
          }

          .leaderboard-value {
            color: #f8fafc;
            font-size: 1rem;
            font-weight: 500;
            word-break: break-word;
          }

          .leaderboard-position .leaderboard-value,
          .leaderboard-name .leaderboard-value {
            color: #ffffff;
            font-weight: 900;
          }

          .leaderboard-total .leaderboard-value {
            color: #ffd166;
            font-weight: 900;
          }

          .leaderboard-name .leaderboard-label,
          .leaderboard-total .leaderboard-label {
            color: rgba(250, 204, 21, 0.9);
          }

          .leaderboard-status,
          .leaderboard-empty,
          .leaderboard-error {
            margin-top: 16px;
          }

          .leaderboard-error {
            color: #fca5a5;
            font-weight: 700;
          }

          .leaderboard-note {
            color: #cbd5e1;
            margin-top: 18px;
          }

          @media (max-width: 900px) {
            .leaderboard-card {
              grid-template-columns: 64px 1.2fr repeat(2, 1fr);
            }

            .leaderboard-cell {
              border-right: none;
              border-bottom: 1px solid rgba(255, 255, 255, 0.12);
            }

            .leaderboard-cell:nth-last-child(-n + 4) {
              border-bottom: none;
            }
          }

          @media (max-width: 700px) {
            .leaderboard-list {
              gap: 12px;
              margin-top: 20px;
            }

            .leaderboard-card {
              display: block;
              padding: 10px;
              border-radius: 18px;
            }

            .leaderboard-cell {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              gap: 14px;
              width: 100%;
              padding: 10px 2px;
              text-align: right;
              border-right: none;
              border-bottom: 1px solid rgba(255, 255, 255, 0.16);
            }

            .leaderboard-cell:last-child {
              border-bottom: none;
            }

            .leaderboard-label {
              flex: 0 0 96px;
              text-align: left;
              font-size: 0.78rem;
            }

            .leaderboard-value {
              flex: 1;
              text-align: right;
            }
          }
        `}
      </style>

      {loadingScores && (
        <p className="leaderboard-status">Loading latest scores...</p>
      )}

      {scoreError && <p className="leaderboard-error">{scoreError}</p>}

      {leaderboardWithScores.length === 0 ? (
        <p className="leaderboard-empty">
          No entries yet. Spin the slots to add the first row.
        </p>
      ) : (
        <div className="leaderboard-list" aria-label="Leaderboard standings">
          {leaderboardWithScores.map((entry, index) => (
            <article className="leaderboard-card" key={`${entry.name}-${index}`}>
              <div className="leaderboard-cell leaderboard-position">
                <span className="leaderboard-label">Pos</span>
                <span className="leaderboard-value">{index + 1}</span>
              </div>

              <div className="leaderboard-cell leaderboard-name">
                <span className="leaderboard-label">Name</span>
                <span className="leaderboard-value">{entry.name}</span>
              </div>

              <div className="leaderboard-cell">
                <span className="leaderboard-label">Pool 1</span>
                <span className="leaderboard-value">
                  {entry.teams?.[0] ?? "-"}
                </span>
              </div>

              <div className="leaderboard-cell">
                <span className="leaderboard-label">Pool 2</span>
                <span className="leaderboard-value">
                  {entry.teams?.[1] ?? "-"}
                </span>
              </div>

              <div className="leaderboard-cell">
                <span className="leaderboard-label">Pool 3</span>
                <span className="leaderboard-value">
                  {entry.teams?.[2] ?? "-"}
                </span>
              </div>

              <div className="leaderboard-cell">
                <span className="leaderboard-label">Pool 4</span>
                <span className="leaderboard-value">
                  {entry.teams?.[3] ?? "-"}
                </span>
              </div>

              <div className="leaderboard-cell leaderboard-total">
                <span className="leaderboard-label">Total Points</span>
                <span className="leaderboard-value">{entry.totalPoints}</span>
              </div>
            </article>
          ))}
        </div>
      )}

      <p className="leaderboard-note">Scores will be updated daily.</p>
    </section>
  );
}