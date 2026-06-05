
import Slot from "../components/Slot";
import ScoringRules from "../components/ScoringRules";

export default function DrawPage({
  spinSlots,
  spinning,
  hasSpun,
  displayIndexes,
  pools,
}) {
  return (
    <section className="panel hero">
      <button
        className="btn btn-primary"
        onClick={spinSlots}
        disabled={spinning || hasSpun}
        style={{ marginTop: 20, width: "100%" }}
      >
        {spinning
            ? "Spinning..."
            : hasSpun
            ? "Teams Generated"
            : "Generate Teams"}
      </button>

      <div className="slot-grid">
        {pools.map((pool, index) => (
          <Slot
            key={index}
            label={`Pool ${index + 1}`}
            teams={pool}
            displayIndex={displayIndexes[index]}
            spinning={spinning}
            finalised={hasSpun}
          />
        ))}
      </div>

    </section>
  );
}
