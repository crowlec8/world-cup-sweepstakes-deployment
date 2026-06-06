export default function NamePage({
  nameInput,
  setNameInput,
  startGame,
  canContinue,
  onViewExistingLeague,
}) {
  return (
    <section className="panel hero">
      <h2>Enter your full name</h2>

      <p className="subtext">
        Enter your name to create a new league or join a league for the first
        time.
      </p>

      <form className="name-form" onSubmit={startGame}>
        <input
          className="input"
          type="text"
          placeholder="Your full name"
          value={nameInput}
          onChange={(e) => setNameInput(e.target.value)}
          style={{ marginTop: 12 }}
        />

        <button
          className="btn btn-primary"
          type="submit"
          disabled={!canContinue}
        >
          Continue
        </button>
      </form>

      <div
        className="panel"
        style={{
          marginTop: 24,
          padding: 20,
        }}
      >
        <h2 style={{ fontSize: "1.35rem" }}>Already in a league?</h2>

        <p className="subtext">
          If you have already joined a league, you can go straight to that
          league's leaderboard by entering your name and league password.
        </p>

        <button
          className="btn btn-secondary"
          type="button"
          onClick={onViewExistingLeague}
          style={{ marginTop: 12 }}
        >
          View Existing League
        </button>
      </div>
    </section>
  );
}