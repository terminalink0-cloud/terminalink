// apps/web/src/routes/AppRouter.tsx

import {
  BrowserRouter,
  Route,
  Routes,
} from "react-router-dom";

// ============================================================
// LAYOUTS
// ============================================================

import DashboardLayout
  from "../layouts/DashboardLayout";

import DispatcherLayout
  from "../layouts/DispatcherLayout";

import DriverLayout
  from "../layouts/DriverLayout";

// ============================================================
// ADMIN PAGES
// ============================================================

import Dashboard
  from "../pages/Dashboard";

import Trips
  from "../pages/Trips";

import Drivers
  from "../pages/Drivers";

import DriverDetails
  from "../pages/DriverDetails";

import Vehicles
  from "../pages/Vehicles";

import VehicleDetails
  from "../pages/VehicleDetails";

import Dispatchers
  from "../pages/Dispatchers";

import DispatcherDetails
  from "../pages/DispatcherDetails";

import Reports
  from "../pages/Reports";

import AdminFleet
  from "../pages/AdminFleet";

import Cooperatives
  from "../pages/Cooperatives";

// ============================================================
// DISPATCHER PAGES
// ============================================================

import DispatcherDashboard
  from "../pages/DispatcherDashboard";

import DispatcherBoarding
  from "../pages/DispatcherBoarding";

import DispatcherTrips
  from "../pages/DispatcherTrips";

// ============================================================
// DRIVER PAGES
// ============================================================

import DriverDashboard
  from "../pages/DriverDashboard";

import DriverTrips
  from "../pages/DriverTrips";

// ============================================================
// PUBLIC COMMUTER
// ============================================================

import CommuterMap
  from "../pages/CommuterMap";

// ============================================================
// AUTH
// ============================================================

import Login
  from "../pages/Login";

import NotFound
  from "../pages/NotFound";

import ProtectedRoute
  from "../auth/ProtectedRoute";


// ============================================================
// ROUTER
// ============================================================

export default function AppRouter() {
  return (
    <BrowserRouter>

      <Routes>

        {/* ====================================================
            PUBLIC ROUTES
        ==================================================== */}

        <Route
          path="/login"
          element={
            <Login />
          }
        />


        {/* ====================================================
            PUBLIC COMMUTER MAP

            IMPORTANT:
            This route is intentionally outside every
            ProtectedRoute so anyone can access live tracking.
        ==================================================== */}

        <Route
          path="/commuter"
          element={
            <CommuterMap />
          }
        />


        {/* ====================================================
            ADMIN ROUTES
        ==================================================== */}

        <Route
          element={
            <ProtectedRoute
              role="ADMIN"
            >
              <DashboardLayout />
            </ProtectedRoute>
          }
        >

          {/* ADMIN DASHBOARD */}

          <Route
            path="/"
            element={
              <Dashboard />
            }
          />


          {/* TRIPS */}

          <Route
            path="/trips"
            element={
              <Trips />
            }
          />


          {/* DRIVERS */}

          <Route
            path="/drivers"
            element={
              <Drivers />
            }
          />


          <Route
            path="/drivers/:id"
            element={
              <DriverDetails />
            }
          />


          {/* VEHICLES */}

          <Route
            path="/vehicles"
            element={
              <Vehicles />
            }
          />


          <Route
            path="/vehicles/:id"
            element={
              <VehicleDetails />
            }
          />


          {/* COOPERATIVES */}

          <Route
            path="/cooperatives"
            element={
              <Cooperatives />
            }
          />


          {/* ADMIN FLEET */}

          <Route
            path="/admin/fleet"
            element={
              <AdminFleet />
            }
          />


          {/* DISPATCHERS */}

          <Route
            path="/dispatchers"
            element={
              <Dispatchers />
            }
          />


          <Route
            path="/dispatchers/:id"
            element={
              <DispatcherDetails />
            }
          />


          {/* REPORTS */}

          <Route
            path="/reports"
            element={
              <Reports />
            }
          />

        </Route>


        {/* ====================================================
            DISPATCHER ROUTES
        ==================================================== */}

        <Route
          element={
            <ProtectedRoute
              role="DISPATCHER"
            >
              <DispatcherLayout />
            </ProtectedRoute>
          }
        >

          {/* DISPATCHER DASHBOARD */}

          <Route
            path="/dispatcher"
            element={
              <DispatcherDashboard />
            }
          />


          {/* BOARDING */}

          <Route
            path="/dispatcher/boarding"
            element={
              <DispatcherBoarding />
            }
          />


          {/* TRIPS */}

          <Route
            path="/dispatcher/trips"
            element={
              <DispatcherTrips />
            }
          />

        </Route>


        {/* ====================================================
            DRIVER ROUTES
        ==================================================== */}

        <Route
          element={
            <ProtectedRoute
              role="DRIVER"
            >
              <DriverLayout />
            </ProtectedRoute>
          }
        >

          {/* DRIVER DASHBOARD */}

          <Route
            path="/driver"
            element={
              <DriverDashboard />
            }
          />


          {/* DRIVER TRIPS */}

          <Route
            path="/driver/trips"
            element={
              <DriverTrips />
            }
          />


          {/* DRIVER PROFILE */}

          <Route
            path="/driver/profile"
            element={
              <DriverDashboard />
            }
          />

        </Route>


        {/* ====================================================
            FALLBACK
        ==================================================== */}

        <Route
          path="*"
          element={
            <NotFound />
          }
        />

      </Routes>

    </BrowserRouter>
  );
}