import {
  Navigate,
  useLocation,
} from "react-router-dom";

import {
  useAuth,
} from "./AuthContext";


type Role =
  | "ADMIN"
  | "DISPATCHER"
  | "DRIVER";


type ProtectedRouteProps = {
  children: React.ReactNode;
  role?: Role;
};


export default function ProtectedRoute({
  children,
  role,
}: ProtectedRouteProps) {
  const location =
    useLocation();

  const {
    authenticated,
    user,
  } = useAuth();


  // ==========================================================
  // NOT LOGGED IN
  // ==========================================================

  if (!authenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location,
        }}
      />
    );
  }


  // ==========================================================
  // ROLE CHECK
  // ==========================================================

  if (
    role &&
    user?.role !== role
  ) {
    const userRole =
      String(
        user?.role ?? "",
      )
        .trim()
        .toUpperCase();


    if (
      userRole ===
      "DISPATCHER"
    ) {
      return (
        <Navigate
          to="/dispatcher"
          replace
        />
      );
    }


    if (
      userRole ===
      "DRIVER"
    ) {
      return (
        <Navigate
          to="/driver"
          replace
        />
      );
    }


    if (
      userRole ===
      "ADMIN"
    ) {
      return (
        <Navigate
          to="/"
          replace
        />
      );
    }


    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }


  return (
    <>
      {children}
    </>
  );
}