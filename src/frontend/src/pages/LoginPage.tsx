import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BookOpen, Eye, EyeOff, ShieldCheck, User } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import type { UserSession } from "../App";

const ADMIN_TOKEN = "dxnamaaz90";

type LoginMode = "choose" | "admin" | "user";

interface LoginPageProps {
  onLogin: (session: UserSession) => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [mode, setMode] = useState<LoginMode>("choose");
  const [adminToken, setAdminToken] = useState("");
  const [userName, setUserName] = useState("");
  const [tokenError, setTokenError] = useState("");
  const [nameError, setNameError] = useState("");
  const [showToken, setShowToken] = useState(false);

  const handleAdminLogin = () => {
    if (!adminToken.trim()) {
      setTokenError("Token is required");
      return;
    }
    if (adminToken !== ADMIN_TOKEN) {
      setTokenError("Invalid token. Access denied.");
      return;
    }
    onLogin({ role: "admin", token: adminToken });
  };

  const handleUserLogin = () => {
    const name = userName.trim() || "Guest";
    onLogin({ role: "user", name });
  };

  const handleAdminKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleAdminLogin();
  };

  const handleUserKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleUserLogin();
  };

  return (
    <div className="min-h-screen bg-background bg-mesh flex flex-col items-center justify-center px-4 py-10">
      {/* Background decorative blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-accent/5 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo / header */}
        <div className="flex flex-col items-center mb-8 gap-3">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <BookOpen className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-display font-bold text-gradient">
            PDF Library
          </h1>
          <p className="text-muted-foreground text-sm text-center">
            Your private document hub
          </p>
        </div>

        <AnimatePresence mode="wait">
          {mode === "choose" && (
            <motion.div
              key="choose"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
                <p className="text-center text-sm text-muted-foreground font-medium uppercase tracking-wider">
                  Choose your role
                </p>

                <button
                  type="button"
                  data-ocid="login.admin_button"
                  onClick={() => setMode("admin")}
                  className="w-full group flex items-center gap-4 p-4 rounded-xl border border-border bg-secondary/30 hover:bg-primary/10 hover:border-primary/30 transition-all duration-200 text-left"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                    <ShieldCheck className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground font-display">
                      Admin
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Manage and upload PDFs
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  data-ocid="login.user_button"
                  onClick={() => setMode("user")}
                  className="w-full group flex items-center gap-4 p-4 rounded-xl border border-border bg-secondary/30 hover:bg-accent/10 hover:border-accent/30 transition-all duration-200 text-left"
                >
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0 group-hover:bg-accent/20 transition-colors">
                    <User className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground font-display">
                      User / Guest
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Browse and view PDFs
                    </p>
                  </div>
                </button>
              </div>
            </motion.div>
          )}

          {mode === "admin" && (
            <motion.div
              key="admin"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4 text-primary" />
                  </div>
                  <h2 className="font-display font-semibold text-lg text-foreground">
                    Admin Login
                  </h2>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="token-input"
                    className="text-foreground/80 text-sm"
                  >
                    Access Token
                  </Label>
                  <div className="relative">
                    <Input
                      id="token-input"
                      data-ocid="login.token_input"
                      type={showToken ? "text" : "password"}
                      placeholder="Enter admin token"
                      value={adminToken}
                      onChange={(e) => {
                        setAdminToken(e.target.value);
                        setTokenError("");
                      }}
                      onKeyDown={handleAdminKeyDown}
                      className={`pr-10 bg-input/50 border-border focus:border-primary/50 transition-colors ${
                        tokenError
                          ? "border-destructive focus:border-destructive"
                          : ""
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowToken(!showToken)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showToken ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {tokenError && (
                    <p
                      data-ocid="login.error_state"
                      className="text-destructive text-xs flex items-center gap-1"
                    >
                      {tokenError}
                    </p>
                  )}
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setMode("choose");
                      setAdminToken("");
                      setTokenError("");
                    }}
                    className="flex-1 border-border bg-transparent hover:bg-secondary/50"
                  >
                    Back
                  </Button>
                  <Button
                    data-ocid="login.submit_button"
                    onClick={handleAdminLogin}
                    className="flex-1 bg-primary/90 hover:bg-primary text-primary-foreground font-semibold"
                  >
                    Login as Admin
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {mode === "user" && (
            <motion.div
              key="user"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                    <User className="w-4 h-4 text-accent" />
                  </div>
                  <h2 className="font-display font-semibold text-lg text-foreground">
                    User Login
                  </h2>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="name-input"
                    className="text-foreground/80 text-sm"
                  >
                    Your Name{" "}
                    <span className="text-muted-foreground text-xs">
                      (optional)
                    </span>
                  </Label>
                  <Input
                    id="name-input"
                    data-ocid="login.user_input"
                    type="text"
                    placeholder="Enter your name or leave blank"
                    value={userName}
                    onChange={(e) => {
                      setUserName(e.target.value);
                      setNameError("");
                    }}
                    onKeyDown={handleUserKeyDown}
                    className={`bg-input/50 border-border focus:border-accent/50 transition-colors ${
                      nameError ? "border-destructive" : ""
                    }`}
                  />
                  {nameError && (
                    <p className="text-destructive text-xs">{nameError}</p>
                  )}
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setMode("choose");
                      setUserName("");
                      setNameError("");
                    }}
                    className="flex-1 border-border bg-transparent hover:bg-secondary/50"
                  >
                    Back
                  </Button>
                  <Button
                    data-ocid="login.submit_button"
                    onClick={handleUserLogin}
                    className="flex-1 bg-accent/90 hover:bg-accent text-accent-foreground font-semibold"
                  >
                    Enter Library
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <footer className="mt-10 text-center text-xs text-muted-foreground relative z-10">
        © {new Date().getFullYear()}. Built with love using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary/80 hover:text-primary transition-colors"
        >
          caffeine.ai
        </a>
      </footer>
    </div>
  );
}
