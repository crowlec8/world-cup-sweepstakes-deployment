export default function LeagueChoicePage({
  onCreate,
  onJoin,
  onViewExistingLeague,
}) {
  return (
    <section className="panel hero">
      <h2>Choose League Option</h2>

      <p className="subtext">
        Create a new league, join a league for the first time, or view a league
        you have already joined.
      </p>

      <div
        style={{
          display: "grid",
          gap: 12,
          marginTop: 24,
        }}
      >
        <button className="btn btn-primary" type="button" onClick={onCreate}>
          Create League
        </button>

        <button className="btn btn-secondary" type="button" onClick={onJoin}>
          Join League
        </button>

        <button
          className="btn btn-secondary"
          type="button"
          onClick={onViewExistingLeague}
        >
          View Existing League
        </button>
      </div>
    </section>
  );
}