export function calculateTeamScores(matches) {
  const scores = {};

  const addOldPoints = (team, points) => {
    if (!team) return;

    const cleanTeam = String(team).trim();

    if (!cleanTeam) return;

    scores[cleanTeam] = (scores[cleanTeam] || 0) + Number(points || 0);
  };

  Object.entries(matches || {}).forEach(([matchKey, match]) => {
    if (!match) return;

    const home = match.home?.trim();
    const away = match.away?.trim();
    const homeScore = Number(match.homeScore || 0);
    const awayScore = Number(match.awayScore || 0);

    addOldPoints(home, homeScore);
    addOldPoints(away, awayScore);

    if (matchKey.startsWith("R32")) {
      addOldPoints(home, 5);
      addOldPoints(away, 5);
    }

    if (matchKey.startsWith("R16")) {
      addOldPoints(home, 10);
      addOldPoints(away, 10);
    }

    if (matchKey.startsWith("QF")) {
      addOldPoints(home, 20);
      addOldPoints(away, 20);
    }

    if (matchKey.startsWith("SF")) {
      addOldPoints(home, 40);
      addOldPoints(away, 40);
    }

    if (matchKey === "FINAL") {
      addOldPoints(home, 80);
      addOldPoints(away, 80);
    }

    let winner = null;

    if (home && away) {
      if (homeScore > awayScore) winner = home;
      if (awayScore > homeScore) winner = away;

      if (homeScore === awayScore) {
        if (match.homePens) winner = home;
        if (match.awayPens) winner = away;
      }
    }

    if (winner && matchKey === "3RD") {
      addOldPoints(winner, 40);
    }

    if (winner && matchKey === "FINAL") {
      addOldPoints(winner, 160);
    }
  });

  return scores;
}

function addPoints(scores, team, points) {
  if (!team) return;

  const cleanTeam = String(team).trim();

  if (!cleanTeam) return;

  scores[cleanTeam] = (scores[cleanTeam] || 0) + Number(points || 0);
}

function normaliseScoreValue(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const numericValue = Number(value);

  if (Number.isNaN(numericValue)) {
    return null;
  }

  return numericValue;
}

function getFinalHomeScore(match) {
  const manualScore = normaliseScoreValue(match.manual_home_score);

  if (manualScore !== null) {
    return manualScore;
  }

  return normaliseScoreValue(match.api_home_score);
}

function getFinalAwayScore(match) {
  const manualScore = normaliseScoreValue(match.manual_away_score);

  if (manualScore !== null) {
    return manualScore;
  }

  return normaliseScoreValue(match.api_away_score);
}

function getFinalWinner(match) {
  if (match.manual_winner) {
    return match.manual_winner;
  }

  if (match.api_winner) {
    return match.api_winner;
  }

  const homeScore = getFinalHomeScore(match);
  const awayScore = getFinalAwayScore(match);

  if (homeScore === null || awayScore === null) {
    return null;
  }

  if (homeScore > awayScore) {
    return match.home_team;
  }

  if (awayScore > homeScore) {
    return match.away_team;
  }

  return null;
}

function getStageKey(match) {
  const stage = match.stage || "";

  if (stage === "GROUP" || stage === "GROUP_STAGE") {
    return "GROUP";
  }

  if (stage === "R32" || stage === "LAST_32" || stage === "ROUND_OF_32") {
    return "R32";
  }

  if (stage === "R16" || stage === "LAST_16" || stage === "ROUND_OF_16") {
    return "R16";
  }

  if (stage === "QF" || stage === "QUARTER_FINALS") {
    return "QF";
  }

  if (stage === "SF" || stage === "SEMI_FINALS") {
    return "SF";
  }

  if (stage === "3RD" || stage === "THIRD_PLACE") {
    return "3RD";
  }

  if (stage === "FINAL") {
    return "FINAL";
  }

  return stage;
}

function hasScore(match) {
  const homeScore = getFinalHomeScore(match);
  const awayScore = getFinalAwayScore(match);

  return homeScore !== null && awayScore !== null;
}

export function calculateTeamScoresFromApiMatches(matches) {
  const scores = {};

  (matches || []).forEach((match) => {
    if (!match) return;

    if (!hasScore(match)) {
      return;
    }

    const home = match.home_team?.trim();
    const away = match.away_team?.trim();
    const homeScore = getFinalHomeScore(match);
    const awayScore = getFinalAwayScore(match);
    const stage = getStageKey(match);

    addPoints(scores, home, homeScore);
    addPoints(scores, away, awayScore);

    if (stage === "R32") {
      addPoints(scores, home, 5);
      addPoints(scores, away, 5);
    }

    if (stage === "R16") {
      addPoints(scores, home, 10);
      addPoints(scores, away, 10);
    }

    if (stage === "QF") {
      addPoints(scores, home, 20);
      addPoints(scores, away, 20);
    }

    if (stage === "SF") {
      addPoints(scores, home, 40);
      addPoints(scores, away, 40);
    }

    if (stage === "FINAL") {
      addPoints(scores, home, 80);
      addPoints(scores, away, 80);
    }

    const winner = getFinalWinner(match);

    if (winner && stage === "3RD") {
      addPoints(scores, winner, 40);
    }

    if (winner && stage === "FINAL") {
      addPoints(scores, winner, 160);
    }
  });

  return scores;
}