import { useEffect, useState } from "react";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import PrivacyPolicy from "./pages/PrivacyPolicy";
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

  // Privacy Policy is a public page and does not require authentication
  if (window.location.pathname === "/privacy-policy") {
    return <PrivacyPolicy />;
  }

  // Show loading state while checking authentication
  if (isAuthenticated === null) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    );
  }

  // Show login page if the user is not authenticated
  if (!isAuthenticated) {
    return <Login />;
  }

  // Show dashboard if the user is authenticated
  return <Dashboard />;
}

export default App;