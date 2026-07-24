import { useState } from "react";
import { useAuth } from "../Contexts/AuthContext";
import { API_URL } from "../config";

export default function Login() {
  const { setUser } = useAuth();
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
    setUser(data.user);
  };

  return (
  <form
      onSubmit={handleLogin}
      className="
          max-w-md
          mx-auto
          mt-20
          p-6
          bg-white
          rounded-xl
          shadow-lg
          flex
          flex-col
          gap-4
      "
  >
      <h2 className="text-2xl font-bold text-center">
          Login
      </h2>

      <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username"
          className="
              border
              rounded-lg
              px-4
              py-2
              focus:outline-none
              focus:ring-2
              focus:ring-blue-500
          "
      />

      <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="
              border
              rounded-lg
              px-4
              py-2
              focus:outline-none
              focus:ring-2
              focus:ring-blue-500
          "
      />

      <button
          type="submit"
          className="btn-primary"
      >
          Login
      </button>
  </form>
  );
}