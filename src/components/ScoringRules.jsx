export default function ScoringRules() {
  return (
    <div className="rules-content">
      <p className="rules-intro">
        To take part, each player must either create a league or join an
        existing league using the league code. Once inside a league, each player
        gets one spin and is randomly assigned four teams.
      </p>

      <p className="rules-intro">
        The four teams are drawn from four separate pools, so every player gets
        one team from each pool. As the tournament progresses, each country earns
        points based on goals scored and how far they go in the competition. A
        player’s total score is the combined score of their four countries.
      </p>

      <div className="rules-section">
        <h3>Goal points</h3>

        <div className="rules-score-row">
          <span>Every goal scored by one of your countries</span>
          <strong>+1 point</strong>
        </div>
      </div>

      <div className="rules-section">
        <h3>Round points</h3>

        <p>
          These points are cumulative. For example, if one of your teams reaches
          the semi-final, they will already have collected the earlier round
          points as well.
        </p>

        <div className="rules-score-list">
          <div className="rules-score-row">
            <span>Reaches Round of 32</span>
            <strong>+5 points</strong>
          </div>

          <div className="rules-score-row">
            <span>Reaches Round of 16</span>
            <strong>+10 points</strong>
          </div>

          <div className="rules-score-row">
            <span>Reaches Quarter-final</span>
            <strong>+20 points</strong>
          </div>

          <div className="rules-score-row">
            <span>Reaches Semi-final</span>
            <strong>+40 points</strong>
          </div>

          <div className="rules-score-row">
            <span>Reaches Final</span>
            <strong>+80 points</strong>
          </div>
        </div>
      </div>

      <div className="rules-section">
        <h3>Bonus points</h3>

        <div className="rules-score-list">
          <div className="rules-score-row">
            <span>Wins the 3rd place playoff</span>
            <strong>+40 points</strong>
          </div>

          <div className="rules-score-row">
            <span>Wins the World Cup Final</span>
            <strong>+160 points</strong>
          </div>
        </div>
      </div>

      <div className="rules-example">
        <h3>Example</h3>

        <p>
          If one of your countries reaches the final, scores 12 goals during the
          tournament, and wins the World Cup, they would receive:
        </p>

        <p>
          <strong>
            12 goal points + 5 + 10 + 20 + 40 + 80 + 160 = 327 points
          </strong>
        </p>
      </div>
    </div>
  );
}