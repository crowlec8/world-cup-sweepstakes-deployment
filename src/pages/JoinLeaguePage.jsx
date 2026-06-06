import { useState } from "react";

export default function JoinLeaguePage({
  onJoin,
  playerName,
  onViewExistingLeague,
}) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [alreadyJoined, setAlreadyJoined] = useState(false);
  const [joining, setJoining] = useState(false);

  const handleJoin = async () => {
    const cleanPassword = password.trim();

    if (!cleanPassword) {
      setError("Please enter a league password.");
      setAlreadyJoined(false);
      return;
    }

    setJoining(true);
    setError("");
    setAlreadyJoined(false);

    try {
      const result = await onJoin(cleanPassword);

      if (result === "not_found") {
        setError("League password not found.");
        return;
      }

      if (result === "already_joined") {
        setError(
          `${playerName} has already joined this league. To view this league, use the View Existing League button and enter your name and league password.`
        );
        setAlreadyJoined(true);
        return;
      }

      if (result === "error") {
        setError("Something went wrong. Please try again.");
        return;
      }

      setError("");
      setAlreadyJoined(false);
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
      setAlreadyJoined(false);
    } finally {
      setJoining(false);
    }
  };

  return (
    <section className="panel hero">
      <h2>Join League</h2>

      <p className="subtext">
        Enter the league password to join this league for the first time. If you
        have already joined, use View Existing League instead.
      </p>

      <input
        className="input"
        type="text"
        placeholder="League password"
        value={password}
        onChange={(e) => {
          setPassword(e.target.value);
          setError("");
          setAlreadyJoined(false);
        }}
        style={{ marginTop: 12 }}
      />

      {error && (
        <p
          style={{
            color: "#fca5a5",
            marginTop: 12,
            fontWeight: 700,
          }}
        >
          {error}
        </p>
      )}

      {alreadyJoined && (
        <button
          className="btn btn-secondary"
          type="button"
          onClick={onViewExistingLeague}
          style={{ marginTop: 12 }}
        >
          View Existing League
        </button>
      )}

      <button
        className="btn btn-primary"
        type="button"
        onClick={handleJoin}
        disabled={joining}
        style={{ marginTop: 12 }}
      >
        {joining ? "Checking..." : "Join"}
      </button>
    </section>
  );
}