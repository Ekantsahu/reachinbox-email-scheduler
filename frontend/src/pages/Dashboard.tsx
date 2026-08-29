import { useEffect, useState } from "react";
import Header from "../components/Header";
import Tabs from "../components/Tabs";
import EmailTable from "../components/EmailTable";
import {
  getScheduledEmails,
  getSentEmails,
  getCurrentUser,
} from "../services/api";
import type { Email } from "../types/email";
import ComposeEmail from "./ComposeEmail";
import { logout } from "../services/api";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<"scheduled" | "sent">("scheduled");

  const [scheduledEmails, setScheduledEmails] = useState<Email[]>([]);
  const [sentEmails, setSentEmails] = useState<Email[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showCompose, setShowCompose] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [user, setUser] = useState<{
    id: string;
    email: string;
    name: string | null;
    avatarUrl: string | null;
  } | null>(null);

  // Temporary user ID until Google OAuth is implemented
  useEffect(() => {
    let cancelled = false;

    async function fetchEmails() {
      try {
        setLoading(true);
        setError("");

        const userResponse = await getCurrentUser();

        if (cancelled) return;

        setUser(userResponse.user);

        const [scheduledResponse, sentResponse] = await Promise.all([
          getScheduledEmails(userResponse.user.id),
          getSentEmails(userResponse.user.id),
        ]);

        if (cancelled) return;

        setScheduledEmails(scheduledResponse.emails);
        setSentEmails(sentResponse.emails);
      } catch (error) {
        if (cancelled) return;

        setError(
          error instanceof Error ? error.message : "Failed to load emails",
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchEmails();

    return () => {
      cancelled = true;
    };
  }, [refreshKey]);
  const emails = activeTab === "scheduled" ? scheduledEmails : sentEmails;

  if (showCompose) {
    return (
      <ComposeEmail
        userId={user?.id || ""}
        senderEmail={user?.email || ""}
        onBack={() => {
          setShowCompose(false);
          setRefreshKey((prev) => prev + 1);
        }}
      />
    );
  }
  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        userName={user?.name || "User"}
        userEmail={user?.email || ""}
        userAvatar={user?.avatarUrl || undefined}
        onLogout={async () => {
          try {
            await logout();
            window.location.href = "/";
          } catch (error) {
            console.error("Logout failed:", error);
          }
        }}
      />

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Emails</h1>

            <p className="mt-1 text-sm text-gray-500">
              Manage your scheduled and sent emails
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowCompose(true)}
            className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
          >
            Compose New Email
          </button>
        </div>

        <Tabs activeTab={activeTab} onChange={setActiveTab} />

        <div className="mt-6 overflow-hidden rounded-lg border bg-white">
          {loading ? (
            <div className="flex min-h-[300px] items-center justify-center">
              <p className="text-sm text-gray-500">Loading emails...</p>
            </div>
          ) : error ? (
            <div className="flex min-h-[300px] items-center justify-center">
              <p className="text-sm text-red-500">{error}</p>
            </div>
          ) : (
            <EmailTable emails={emails} type={activeTab} />
          )}
        </div>
      </main>
    </div>
  );
}
