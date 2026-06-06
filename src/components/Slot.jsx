

export default function Slot({ label, teams, displayIndex, spinning, finalised}) {
  const current = teams[displayIndex % teams.length];

  return (
    <div className="slot-card">
      <div className="slot-label">{label}</div>

      <div className={`slot-window ${spinning ? "is-spinning" : ""} ${finalised ? "is-final" : ""}`}>
        <div className="slot-single">
          {current}
        </div>
      </div>
    </div>
  );
}
