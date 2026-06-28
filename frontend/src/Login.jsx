import { useState } from "react";
import { API_URL } from "./config";

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    const res = await fetch(`${API_URL}/api/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error);
      return;
    }

    // ✅ spara token
    localStorage.setItem("token", data.token);

    // ✅ sätt user i App
    onLogin(data.user);
  };

  return (
    <form onSubmit={handleLogin}>
      <h2>Login</h2>

      <input
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Username"
      />

      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />

      <button type="submit">Login</button>
    </form>
  );
}