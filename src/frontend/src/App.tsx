import { Toaster } from "@/components/ui/sonner";
import { useEffect, useState } from "react";
import AdminDashboard from "./pages/AdminDashboard";
import LoginPage from "./pages/LoginPage";
import UserDashboard from "./pages/UserDashboard";

export type UserSession =
  | { role: "admin"; token: string }
  | { role: "user"; name: string }
  | null;

const SESSION_KEY = "pdf_library_session";

function loadSession(): UserSession {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as UserSession;
  } catch {
    return null;
  }
}

function saveSession(session: UserSession) {
  if (session) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } else {
    localStorage.removeItem(SESSION_KEY);
  }
}

export default function App() {
  const [session, setSession] = useState<UserSession>(loadSession);

  useEffect(() => {
    saveSession(session);
  }, [session]);

  const handleLogin = (s: UserSession) => setSession(s);
  const handleLogout = () => setSession(null);

  return (
    <>
      {!session && <LoginPage onLogin={handleLogin} />}
      {session?.role === "admin" && (
        <AdminDashboard token={session.token} onLogout={handleLogout} />
      )}
      {session?.role === "user" && (
        <UserDashboard name={session.name} onLogout={handleLogout} />
      )}
      <Toaster richColors position="top-right" />
    </>
  );
}
