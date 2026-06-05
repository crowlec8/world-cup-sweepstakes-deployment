import { useState } from "react";

export default function AdminLoginPage({ onLogin }) {
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    if (password === "CCrowley1396!") {
      onLogin();
      setPassword("");
    } else {
      alert("Wrong password");
    }
  };

  return (
    <div className="card"> {/* ✅ matches your other pages */}
      <h2>Admin Login</h2>

      <form onSubmit={handleSubmit} className="form">
        <input
          type="password"
          placeholder="Enter admin password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input"  
        />

        <button type="submit" className="btn">
          Login
        </button>
      </form>
    </div>
  );
}