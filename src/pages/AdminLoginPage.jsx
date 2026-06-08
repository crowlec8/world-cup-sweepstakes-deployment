import { useState } from "react";

export default function AdminLoginPage({ onLogin }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const cleanPassword = password.trim();

    if (!cleanPassword) {
      setError("Please enter the admin password.");
      return;
    }

    setLoggingIn(true);
    setError("");

    try {
      const response = await fetch("/api/admin-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          password: cleanPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.message || "Wrong password.");
        return;
      }

      setPassword("");
      setError("");
      onLogin();
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoggingIn(false);
    }
  };

  return (
    <div className="panel">
      <h2>Admin Login</h2>

      <form onSubmit={handleSubmit}>
        <input
          type="password"
          className="input"
          placeholder="Admin password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError("");
          }}
          disabled={loggingIn}
        />

        {error && <p className="error-text">{error}</p>}

        <button
          type="submit"
          className="btn btn-primary"
          disabled={loggingIn}
          style={{ marginTop: 12 }}
        >
          {loggingIn ? "Checking..." : "Login"}
        </button>
      </form>
    </div>
  );
}