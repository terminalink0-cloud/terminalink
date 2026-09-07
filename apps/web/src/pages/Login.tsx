// apps/web/src/pages/Login.tsx

import { useState } from "react";
import type { FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { login as loginRequest } from "../auth/auth.service";
import { useAuth } from "../auth/AuthContext";

// ============================================================
// TYPES
// ============================================================

type LoginResult = {
  accessToken?: string;
  user?: {
    id?: string;
    username?: string;
    role?: string;
    status?: string;
  };
};

type LoginLocationState = {
  from?: {
    pathname?: string;
    search?: string;
    hash?: string;
  };
};

// ============================================================
// HELPERS
// ============================================================

function getErrorMessage(error: unknown): string {
  if (typeof error !== "object" || error === null) {
    return "Login failed";
  }

  const value = error as {
    response?: {
      data?: { message?: string | string[] } | string;
    };
    message?: string;
  };

  const responseData = value.response?.data;

  if (typeof responseData === "string") {
    return responseData;
  }

  if (responseData && typeof responseData === "object") {
    const message = responseData.message;
    if (Array.isArray(message)) {
      return message.join(", ");
    }
    if (typeof message === "string") {
      return message;
    }
  }

  if (typeof value.message === "string" && value.message.trim()) {
    return value.message;
  }

  return "Login failed";
}

function getRoleHome(role: string): string {
  switch (role) {
    case "ADMIN":
      return "/";
    case "DISPATCHER":
      return "/dispatcher";
    case "DRIVER":
      return "/driver";
    default:
      console.warn(`Unknown role "${role}", redirecting to /commuter`);
      return "/commuter";
  }
}

function getSafeReturnPath(state: LoginLocationState | null): string | null {
  const pathname = state?.from?.pathname;

  if (
    !pathname ||
    !pathname.startsWith("/") ||
    pathname.startsWith("//") ||
    pathname === "/login"
  ) {
    return null;
  }

  const search = state?.from?.search ?? "";
  const hash = state?.from?.hash ?? "";
  return `${pathname}${search}${hash}`;
}

// ============================================================
// ICONS
// ============================================================

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <path
        d="M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Z"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <path
        d="M4.5 20.25a7.5 7.5 0 0 1 15 0"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <rect
        x="4.5"
        y="10.5"
        width="15"
        height="9.75"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <path
        d="M8 10.5V7.75a4 4 0 1 1 8 0V10.5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function EyeIcon({ visible }: { visible: boolean }) {
  if (visible) {
    return (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
        <path
          d="M2.25 12S5.25 5.25 12 5.25 21.75 12 21.75 12 18.75 18.75 12 18.75 2.25 12 2.25 12Z"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinejoin="round"
        />
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.75" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <path
        d="M3 3l18 18"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <path
        d="M10.58 10.58a3 3 0 0 0 4.24 4.24M6.53 6.6C4.14 8.14 2.25 12 2.25 12s3 6.75 9.75 6.75c1.7 0 3.15-.43 4.36-1.08M17.9 17.9C19.86 16.53 21.75 12 21.75 12s-.86-1.93-2.6-3.7A11.6 11.6 0 0 0 12 5.25c-.6 0-1.18.05-1.73.14"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 shrink-0" aria-hidden="true">
      <path
        d="M12 9v4.5M12 16.5h.008M10.29 3.86 1.82 18a1.5 1.5 0 0 0 1.29 2.25h17.78A1.5 1.5 0 0 0 22.18 18L13.71 3.86a1.5 1.5 0 0 0-2.42 0Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ============================================================
// LOGIN COMPONENT
// ============================================================

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login: authLogin } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (loading || !username.trim() || !password) {
      return;
    }

    setError("");
    const normalizedUsername = username.trim();

    setLoading(true);
    try {
      const result = (await loginRequest({
        username: normalizedUsername,
        password,
      })) as LoginResult;

      if (!result?.accessToken || !result?.user) {
        throw new Error("Invalid login response.");
      }

      const role = String(result.user.role ?? "").trim().toUpperCase();
      if (!role) {
        throw new Error("Login response does not contain a user role.");
      }

      authLogin(result);

      const returnPath = getSafeReturnPath(
        location.state as LoginLocationState | null,
      );

      if (returnPath) {
        navigate(returnPath, { replace: true });
        return;
      }

      navigate(getRoleHome(role), { replace: true });
    } catch (caughtError) {
      if (import.meta.env.DEV) {
        console.error("LOGIN ERROR:", caughtError);
      }
      setError(getErrorMessage(caughtError));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-blue-600 via-blue-700 to-indigo-900 px-4 py-10 dark:from-slate-900 dark:via-slate-950 dark:to-slate-950">
      <div className="w-full max-w-sm">
        {/* BRAND */}
        <div className="mb-6 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-3xl shadow-lg ring-1 ring-white/20">
            🚐
          </div>
          <h1 className="mt-4 text-xl font-bold text-white">Terminalink</h1>
          <p className="mt-1 text-sm text-blue-100 dark:text-slate-300">
            Sign in to manage dispatch and fleet tracking.
          </p>
        </div>

        {/* CARD */}
        <form
          noValidate
          onSubmit={submit}
          className="space-y-5 rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900"
        >
          {/* ERROR */}
          {error && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300"
            >
              <AlertIcon />
              <span>{error}</span>
            </div>
          )}

          {/* USERNAME */}
          <div>
            <label
              htmlFor="username"
              className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-slate-300"
            >
              Username
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400 dark:text-slate-500">
                <UserIcon />
              </span>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                autoFocus
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                disabled={loading}
                placeholder="Enter your username"
                className="w-full rounded-xl border border-gray-300 bg-gray-50 py-3 pl-11 pr-3 text-gray-900 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500 dark:focus:border-blue-500 dark:focus:bg-slate-900 dark:focus:ring-blue-900"
              />
            </div>
          </div>

          {/* PASSWORD */}
          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-slate-300"
            >
              Password
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400 dark:text-slate-500">
                <LockIcon />
              </span>
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={loading}
                placeholder="Enter your password"
                className="w-full rounded-xl border border-gray-300 bg-gray-50 py-3 pl-11 pr-11 text-gray-900 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500 dark:focus:border-blue-500 dark:focus:bg-slate-900 dark:focus:ring-blue-900"
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                disabled={loading}
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
                className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300"
              >
                <EyeIcon visible={showPassword} />
              </button>
            </div>
          </div>

          {/* LOGIN BUTTON */}
          <button
            type="submit"
            disabled={loading || !username.trim() || !password}
            className="w-full rounded-xl bg-blue-600 px-4 py-3.5 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Login"}
          </button>

          {/* DIVIDER */}
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-gray-200 dark:bg-slate-700" />
            <span className="text-xs font-medium uppercase text-gray-400 dark:text-slate-500">OR</span>
            <div className="h-px flex-1 bg-gray-200 dark:bg-slate-700" />
          </div>

          {/* BACK BUTTON */}
          <button
            type="button"
            onClick={() => navigate("/commuter")}
            disabled={loading}
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            Back to Commuter Map
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-blue-100 dark:text-slate-400">
          Provincial Integrated Transport Terminal · Virac, Catanduanes
        </p>
      </div>
    </div>
  );
}