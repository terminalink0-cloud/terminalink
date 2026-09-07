import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

type AuthContextType = {
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
  authenticated: boolean;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("token");

    if (stored) {
      setToken(stored);
    }
  }, []);

  function login(jwt: string) {
    localStorage.setItem("token", jwt);
    setToken(jwt);
  }

  function logout() {
    localStorage.removeItem("token");
    setToken(null);
  }

  return (
    <AuthContext.Provider
      value={{
        token,
        authenticated: !!token,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}