export function calculateTeamScores(matches) {
  const scores = {};

  const addPoints = (team, points) => {
    if (!team) return;
    const cleanTeam = team.trim();
    if (!cleanTeam) return;

    scores[cleanTeam] = (scores[cleanTeam] || 0) + points;
  };

  Object.entries(matches || {}).forEach(([matchKey, match]) => {
    if (!match) return;

    const home = match.home?.trim();
    const away = match.away?.trim();
    const homeScore = Number(match.homeScore || 0);
    const awayScore = Number(match.awayScore || 0);

    // 1 point per goal
    addPoints(home, homeScore);
    addPoints(away, awayScore);

    // Round appearance points
    if (matchKey.startsWith("R32")) {
      addPoints(home, 5);
      addPoints(away, 5);
    }

    if (matchKey.startsWith("R16")) {
      addPoints(home, 10);
      addPoints(away, 10);
    }

    if (matchKey.startsWith("QF")) {
      addPoints(home, 20);
      addPoints(away, 20);
    }

    if (matchKey.startsWith("SF")) {
      addPoints(home, 40);
      addPoints(away, 40);
    }

    if (matchKey === "FINAL") {
      addPoints(home, 80);
      addPoints(away, 80);
    }

    // Determine winner (normal time or penalties)
    let winner = null;

    if (home && away) {
      if (homeScore > awayScore) winner = home;
      if (awayScore > homeScore) winner = away;

      if (homeScore === awayScore) {
        if (match.homePens) winner = home;
        if (match.awayPens) winner = away;
      }
    }

    // Winner bonuses
    if (winner && matchKey === "3RD") {
      addPoints(winner, 40);
    }

    if (winner && matchKey === "FINAL") {
      addPoints(winner, 160);
    }
  });

  return scores;
}