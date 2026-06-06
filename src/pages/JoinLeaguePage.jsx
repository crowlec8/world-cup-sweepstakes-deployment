import { useState } from "react";

export default function JoinLeaguePage({ onJoin, playerName }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleJoin = async () => {
    const cleanPassword = password.trim();

    if (!cleanPassword) {
      setError("Please enter a league password");
      return;
    }

    try {
      const result = await onJoin(cleanPassword);

      if (result === "not_found") {
        setError("League password not found");
        return;
      }

      setError(""); // clear error on success
    } catch (err) {
      console.error(err);
      setError("Something went wrong");
    }
  };

  return (
    <section className="panel hero">
      <h2>Join League</h2>

      <input
        className="input"
        placeholder="Enter league password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      {/* ✅ Error message */}
      {error && (
        <p style={{ color: "#ef4444", marginTop: 10 }}>
          {error}
        </p>
      )}

      <button
        className="btn btn-primary"
        style={{ marginTop: 16 }}
        onClick={handleJoin}
      >
        Join
      </button>
    </section>
  );
}