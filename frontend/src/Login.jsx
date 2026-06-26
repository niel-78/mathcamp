
import { useState } from "react";

export default function Login({ onLogin }) {
  const [key, setKey] = useState("");

  const handleLogin = async () => {
    const res = await fetch(
      `http://192.168.1.115:3000/api/login?key=${key}`
    );

    if (!res.ok) {
      alert("Fel kod");
      return;
    }

    const user = await res.json();
    onLogin(user);
  };

  return (
    <div>
      <h2>Ange din kod</h2>

      <input
        value={key}
        onChange={(e) => setKey(e.target.value)}
      />

      <button onClick={handleLogin}>
        Starta prov
      </button>
    </div>
  );
}
