import { useEffect, useState } from "react";

function Users() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetch("http://localhost:3000/api/users")
      .then(res => res.json())
      .then(data => setUsers(data));
  }, []);

  return (
    <div>
      <h1>Users</h1>
      {users.map(u => (
        <p key={u.id}>{u.name}</p>
      ))}
    </div>
  );
}

export default Users;