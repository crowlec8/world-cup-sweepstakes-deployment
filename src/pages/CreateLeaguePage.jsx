import { useState } from "react";
import {
  areSweepstakesEntriesClosed,
  ENTRY_CLOSED_MESSAGE,
} from "../utils/entryDeadline";

export default function CreateLeaguePage({ onCreate, playerName }) {
  const [leagueName, setLeagueName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const entriesClosed = areSweepstakesEntriesClosed();

  const handleCreate = async () => {
    if (entriesClosed) {
      setError(ENTRY_CLOSED_MESSAGE);
      return;
    }

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

      if (result === "closed") {
        setError(ENTRY_CLOSED_MESSAGE);
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

      {entriesClosed && (
        <>
          <p className="subtext">{ENTRY_CLOSED_MESSAGE}</p>
          <p className="subtext">
            You can still view an existing league if you already entered before
            the deadline.
          </p>
        </>
      )}

      <input
        className="input"
        placeholder="Enter league name"
        value={leagueName}
        onChange={(e) => setLeagueName(e.target.value)}
        style={{ marginTop: 12 }}
        disabled={entriesClosed}
      />

      <input
        className="input"
        placeholder="Enter league password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ marginTop: 12 }}
        disabled={entriesClosed}
      />

      {error && (
        <p style={{ color: "#ef4444", marginTop: 10 }}>
          {error}
        </p>
      )}

      <button
        className="btn btn-primary"
        style={{ marginTop: 16 }}
        onClick={handleCreate}
        disabled={entriesClosed}
      >
        {entriesClosed ? "Entries Closed" : "Create League"}
      </button>
    </section>
  );
}