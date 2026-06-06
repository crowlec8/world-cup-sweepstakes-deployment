import { useEffect, useState } from "react";

export default function ViewExistingLeaguePage({
  initialName = "",
  onViewExistingLeague,
}) {
  const [name, setName] = useState(initialName);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setName(initialName || "");
  }, [initialName]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const cleanName = name.trim();
    const cleanPassword = password.trim();

    if (!cleanName || !cleanPassword) {
      setError("Please enter your name and league password.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await onViewExistingLeague(cleanName, cleanPassword);

      if (result === "missing") {
        setError("Please enter your name and league password.");
        return;
      }

      if (result === "not_found") {
        setError("League password not found.");
        return;
      }

      if (result === "player_not_found") {
        setError(
          "That name has not joined this league yet. Please check the name or join the league first."
        );
        return;
      }

      if (result === "error") {
        setError("Something went wrong. Please try again.");
        return;
      }
    } catch (error) {
      console.error(error);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="panel hero">
      <h2>View Existing League</h2>

      <p className="subtext">
        Already joined a league? Enter your name and league password to go
        straight to that league's leaderboard.
      </p>

      <form className="name-form" onSubmit={handleSubmit}>
        <input
          className="input"
          type="text"
          placeholder="Your full name"
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            setError("");
          }}
        />

        <input
          className="input"
          type="text"
          placeholder="League password"
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
            setError("");
          }}
        />

        <button
          className="btn btn-primary"
          type="submit"
          disabled={loading}
        >
          {loading ? "Loading..." : "View Leaderboard"}
        </button>
      </form>

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
    </section>
  );
}