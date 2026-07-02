import Login from "./App/Login";
import Dashboard from "./App/Dashboard";
import { useAuth } from "./Contexts/AuthContext";

export default function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return <div>Laddar...</div>;
  }

  if (!user) {
    return <Login />;
  }

  if(user){
    return <Dashboard user={user} />
  }
  
}