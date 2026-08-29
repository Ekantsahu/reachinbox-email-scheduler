import { useEffect, useState } from "react";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import { getCurrentUser } from "./services/api";
import "./App.css";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(
    null,
  );

  useEffect(() => {
    async function checkAuth() {
      try {
        await getCurrentUser();
        setIsAuthenticated(true);
      } catch {
        setIsAuthenticated(false);
      }
    }

    checkAuth();
  }, []);

  if (isAuthenticated === null) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return <Dashboard />;
}

export default App;