
export default function LeagueChoicePage({ onCreate, onJoin }) {
  return (
    <section className="panel hero">
      <h2>Choose League Option</h2>

      <div className="toolbar" style={{ marginTop: 20 }}>
        <button className="btn btn-primary" onClick={onCreate}>
          Create League
        </button>

        <button className="btn btn-secondary" onClick={onJoin}>
          Join League
        </button>
      </div>
    </section>
  );
}
