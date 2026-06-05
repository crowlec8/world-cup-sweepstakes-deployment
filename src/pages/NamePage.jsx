export default function NamePage({
  nameInput,
  setNameInput,
  startGame,
  canContinue,
}) {
  return (
    <section className="panel hero">
      <h2>Enter your full name</h2>

      <form onSubmit={startGame}>
        <input
          className="input"
          placeholder="e.g. John Doe"
          value={nameInput}
          onChange={(e) => setNameInput(e.target.value)}
          style={{ marginTop: 12 }}
        />

        <button
          className="btn btn-primary"
          type="submit"
          disabled={!canContinue}
          style={{ marginTop: 16, width: "100%" }}
        >
          Continue
        </button>
      </form>
    </section>
  );
}