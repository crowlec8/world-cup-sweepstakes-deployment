export default function ScoringRules() {
  return (
    <div className="scoring-card">
      <div className="scoring-grid">
        <div className="score-row">
          <span><strong>1pts</strong></span>
          <span><strong>Each goal scored</strong></span>
        </div>

        <div className="score-row">
          <span><strong>5pts</strong></span>
          <span><strong>Round of 32</strong></span>
        </div>

        <div className="score-row">
          <span><strong>10pts</strong></span>
          <span><strong>Round of 16</strong></span>
        </div>

        <div className="score-row">
          <span><strong>20pts</strong></span>
          <span><strong>Quarter Final</strong></span>
        </div>

        <div className="score-row">
          <span><strong>40pts</strong></span>
          <span><strong>Semi Final</strong></span>
        </div>

        <div className="score-row">
          <span><strong>40pts</strong></span>
          <span><strong>3rd Place</strong></span>
        </div>

        <div className="score-row">
          <span><strong>80pts</strong></span>
          <span><strong>Final</strong></span>
        </div>

        <div className="score-row">
          <span><strong>160pts</strong></span>
          <span><strong>Winner</strong></span>
        </div>
      </div>
    </div>
  );
}