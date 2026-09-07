// apps/web/src/pages/Dashboard.tsx

import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getDashboard } from "../api/reports.api";

// Removed external StatCard import to ensure dark mode works.
// We define a local StatCard component below.

type DashboardStats = {
  totalTrips: number;
  completedTrips: number;
  totalPassengers: number;
  totalRevenue: number | string;
  recentTrips?: any[];
};

export default function Dashboard() {
  const navigate = useNavigate();

  const { data, isLoading, isError } = useQuery<DashboardStats>({
    queryKey: ["dashboard"],
    queryFn: getDashboard,
    refetchInterval: 15_000,
  });

  // ==========================================================
  // LOADING
  // ==========================================================

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-slate-950">
        <div className="rounded-xl bg-white px-6 py-5 text-gray-500 shadow-sm dark:bg-slate-900 dark:text-slate-400">
          Loading dashboard...
        </div>
      </div>
    );
  }

  // ==========================================================
  // ERROR
  // ==========================================================

  if (isError || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 p-6 dark:bg-slate-950">
        <div className="w-full max-w-md rounded-xl bg-red-50 p-6 text-center dark:bg-red-950/30">
          <h2 className="text-lg font-semibold text-red-800 dark:text-red-200">
            Failed to load dashboard.
          </h2>
          <p className="mt-2 text-sm text-red-600 dark:text-red-300">
            Check that the API is running and try again.
          </p>
          <button
            type="button"
            onClick={() => {
              window.location.reload();
            }}
            className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // ==========================================================
  // RECENT TRIPS
  // ==========================================================

  const recentTrips = Array.isArray(data.recentTrips) ? data.recentTrips : [];

  // ==========================================================
  // STATUS CLASS
  // ==========================================================

  function getStatusClass(status?: string): string {
    switch (String(status ?? "").toUpperCase()) {
      case "COMPLETED":
        return "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300";
      case "BOARDING":
        return "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300";
      case "EN_ROUTE":
        return "bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300";
      case "APPROACHING":
        return "bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300";
      case "ARRIVED":
      case "DOCKED":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-300";
      case "CANCELLED":
        return "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300";
      case "WAITING":
        return "bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-slate-300";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-slate-300";
    }
  }

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="min-h-screen space-y-6 bg-gray-100 p-6 dark:bg-slate-950">
      {/* ======================================================
          HEADER
      ======================================================= */}

      <section className="rounded-2xl bg-white p-6 shadow-sm dark:bg-slate-900">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Terminalink Dashboard
            </h1>
            <p className="mt-2 text-gray-500 dark:text-slate-400">
              Transport operation overview.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              navigate("/commuter");
            }}
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
          >
            View Live Commuter Map
          </button>
        </div>
      </section>

      {/* ======================================================
          STATS
      ======================================================= */}

      <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <LocalStatCard
          title="Total Trips"
          value={data.totalTrips}
          description="Registered trips"
          icon="🚐"
        />
        <LocalStatCard
          title="Completed Trips"
          value={data.completedTrips}
          description="Successful trips"
          icon="✅"
        />
        <LocalStatCard
          title="Passengers"
          value={data.totalPassengers}
          description="Passengers served"
          icon="👥"
        />
        <LocalStatCard
          title="Revenue"
          value={`₱${Number(data.totalRevenue).toLocaleString("en-PH")}`}
          description="Total earnings"
          icon="💰"
        />
      </section>

      {/* ======================================================
          RECENT TRIPS
      ======================================================= */}

      <section className="overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-slate-900">
        <div className="flex flex-col gap-3 border-b border-gray-200 p-6 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Recent Trips
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
              Latest trip activity in Terminalink.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              navigate("/trips");
            }}
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 dark:bg-slate-700 dark:hover:bg-slate-600"
          >
            View All Trips
          </button>
        </div>

        {recentTrips.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead className="border-b border-gray-200 bg-gray-50 dark:border-slate-800 dark:bg-slate-800/50">
                <tr className="text-sm text-gray-500 dark:text-slate-400">
                  <th className="p-4">Trip</th>
                  <th className="p-4">Driver</th>
                  <th className="p-4">Vehicle</th>
                  <th className="p-4">Route</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {recentTrips.map((trip: any) => (
                  <tr
                    key={trip.id}
                    className="border-b border-gray-100 hover:bg-gray-50 dark:border-slate-800 dark:hover:bg-slate-800/50"
                  >
                    <td className="p-4">
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {trip.tripNumber ?? "-"}
                      </div>
                    </td>
                    <td className="p-4 text-gray-700 dark:text-slate-300">
                      {trip.driver?.user?.displayName ?? "-"}
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {trip.vehicle?.plateNumber ?? "-"}
                      </div>
                      <div className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                        {[trip.vehicle?.make, trip.vehicle?.model]
                          .filter(Boolean)
                          .join(" ") || "-"}
                      </div>
                    </td>
                    <td className="p-4 text-gray-700 dark:text-slate-300">
                      {trip.route?.origin?.name && trip.route?.destination?.name
                        ? `${trip.route.origin.name} → ${trip.route.destination.name}`
                        : "-"}
                    </td>
                    <td className="p-4">
                      <span
                        className={[
                          "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
                          getStatusClass(trip.status),
                        ].join(" ")}
                      >
                        {trip.status ?? "-"}
                      </span>
                    </td>
                    <td className="p-4">
                      <button
                        type="button"
                        onClick={() => {
                          if (trip.id) {
                            navigate(`/trips/${trip.id}`);
                          }
                        }}
                        className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-10 text-center">
            <div className="text-4xl">🚐</div>
            <p className="mt-3 font-medium text-gray-700 dark:text-slate-300">
              No recent trips.
            </p>
            <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
              Trip activity will appear here once trips are created.
            </p>
          </div>
        )}
      </section>

      {/* ======================================================
          QUICK ACTIONS
      ======================================================= */}

      <section>
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Quick Actions
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {/* LIVE COMMUTER */}
          <button
            type="button"
            onClick={() => {
              navigate("/commuter");
            }}
            className="rounded-2xl border border-blue-100 bg-blue-50 p-6 text-left transition hover:-translate-y-0.5 hover:shadow-md dark:border-blue-900/50 dark:bg-blue-950/40"
          >
            <div className="text-3xl">📍</div>
            <h3 className="mt-4 font-bold text-blue-900 dark:text-blue-100">
              Live Commuter Map
            </h3>
            <p className="mt-2 text-sm text-blue-700 dark:text-blue-300">
              Monitor live UV locations, routes, drivers, and available seats.
            </p>
          </button>

          {/* TRIPS */}
          <button
            type="button"
            onClick={() => {
              navigate("/trips");
            }}
            className="rounded-2xl bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:bg-slate-900"
          >
            <div className="text-3xl">🚐</div>
            <h3 className="mt-4 font-bold text-gray-900 dark:text-white">Trips</h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">
              View passenger trips and trip activity.
            </p>
          </button>

          {/* FLEET */}
          <button
            type="button"
            onClick={() => {
              navigate("/admin/fleet");
            }}
            className="rounded-2xl bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:bg-slate-900"
          >
            <div className="text-3xl">🚌</div>
            <h3 className="mt-4 font-bold text-gray-900 dark:text-white">Fleet</h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">
              Manage drivers, vehicles, and assignments.
            </p>
          </button>

          {/* REPORTS */}
          <button
            type="button"
            onClick={() => {
              navigate("/reports");
            }}
            className="rounded-2xl bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:bg-slate-900"
          >
            <div className="text-3xl">📊</div>
            <h3 className="mt-4 font-bold text-gray-900 dark:text-white">Reports</h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">
              Analyze transport operations and performance.
            </p>
          </button>
        </div>
      </section>
    </div>
  );
}

// ============================================================
// LOCAL STAT CARD (dark mode supported)
// ============================================================

function LocalStatCard({
  title,
  value,
  description,
  icon,
}: {
  title: string;
  value: number | string;
  description: string;
  icon: string;
}) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-500 dark:text-slate-400">{title}</p>
        <span className="text-2xl">{icon}</span>
      </div>
      <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
      <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">{description}</p>
    </div>
  );
}