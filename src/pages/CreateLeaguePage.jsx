import { useState } from "react";

export default function CreateLeaguePage({ onCreate }) {
  const [leagueName, setLeagueName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleCreate = async () => {
    const cleanName = leagueName.trim();
    const cleanPassword = password.trim();

    if (!cleanName || !cleanPassword) {
      setError("Please enter both league name and password");
      return;
    }

    try {
      // Pass both values up
      const result = await onCreate(cleanName, cleanPassword);

      // If App.tsx returns an error message
      if (result === "exists") {
        setError("League password already taken");
        return;
      }

      setError("");
    } catch (err) {
      console.error(err);
      setError("Something went wrong");
    }
  };

  return (
    <section className="panel hero">
      <h2>Create a League</h2>

      <input
        className="input"
        placeholder="Enter league name"
        value={leagueName}
        onChange={(e) => setLeagueName(e.target.value)}
        style={{ marginTop: 12 }}
      />

      <input
        className="input"
        placeholder="Enter league password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ marginTop: 12 }}
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
        onClick={handleCreate}
      >
        Create League
      </button>
    </section>
  );
}