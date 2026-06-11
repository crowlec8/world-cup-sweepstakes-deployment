import {
  areSweepstakesEntriesClosed,
  ENTRY_CLOSED_MESSAGE,
} from "../utils/entryDeadline";

export default function LeagueChoicePage({
  onCreate,
  onJoin,
  onViewExistingLeague,
}) {
  const entriesClosed = areSweepstakesEntriesClosed();

  return (
    <section className="panel hero">
      <h2>Choose League Option</h2>

      {entriesClosed ? (
        <>
          <p className="subtext">{ENTRY_CLOSED_MESSAGE}</p>
          <p className="subtext">
            You can no longer create or join a league. You can still view an
            existing league if you already entered before the deadline.
          </p>

          <button
            className="btn btn-secondary"
            type="button"
            onClick={onViewExistingLeague}
            style={{ marginTop: 16 }}
          >
            View Existing League
          </button>
        </>
      ) : (
        <>
          <p className="subtext">
            Create a new league, join a league for the first time, or view a
            league you have already joined.
          </p>

          <div className="button-row">
            <button className="btn btn-primary" type="button" onClick={onCreate}>
              Create League
            </button>

            <button className="btn btn-primary" type="button" onClick={onJoin}>
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
        </>
      )}
    </section>
  );
}