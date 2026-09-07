// apps/web/src/pages/CommuterMap.tsx

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import { io } from "socket.io-client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Moon, RefreshCw, Sun, Wifi, WifiOff } from "lucide-react";
import { getLiveVehicles } from "../api/commuter.api";
import type { LiveVehicle } from "../api/commuter.api";
import "leaflet/dist/leaflet.css";

// ============================================================
// TERMINAL
// ============================================================

const TERMINAL_POSITION: [number, number] = [13.579, 124.2184];

// ============================================================
// MAP TILES (only free OSM tiles, no API key required)
// ============================================================

const TILE_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const TILE_ATTRIBUTION = "&copy; OpenStreetMap contributors";

// ============================================================
// SOCKET URL
// ============================================================

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ??
  `${window.location.protocol}//${window.location.hostname}:3001/tracking`;

// ============================================================
// HELPERS
// ============================================================

function vehicleName(vehicle: LiveVehicle): string {
  return [vehicle.vehicle.make, vehicle.vehicle.model].filter(Boolean).join(" ") || "UV";
}

function driverName(vehicle: LiveVehicle): string {
  return vehicle.driver?.displayName?.trim() || "Driver";
}

function routeName(vehicle: LiveVehicle): string {
  return `${vehicle.route.origin} → ${vehicle.route.destination}`;
}

function secondsAgo(recordedAt: string): number | null {
  const time = new Date(recordedAt).getTime();
  if (!Number.isFinite(time)) return null;
  return Math.max(0, Math.floor((Date.now() - time) / 1000));
}

function accuracyText(accuracy: number | null | undefined): string {
  if (typeof accuracy !== "number" || !Number.isFinite(accuracy)) return "-";
  return `${Math.round(accuracy)} m`;
}

function availabilityText(vehicle: LiveVehicle): string {
  if (vehicle.availableSeats <= 0) return "FULL";
  if (vehicle.availableSeats <= 3) return "LIMITED";
  return "AVAILABLE";
}

function availabilityClass(vehicle: LiveVehicle): string {
  if (vehicle.availableSeats <= 0)
    return "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300";
  if (vehicle.availableSeats <= 3)
    return "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300";
  return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300";
}

function getRoleBackPath(role?: string): string {
  switch (String(role ?? "").trim().toUpperCase()) {
    case "ADMIN":
      return "/";
    case "DISPATCHER":
      return "/dispatcher";
    case "DRIVER":
      return "/driver";
    default:
      return "/commuter";
  }
}

function getRoleBackLabel(role?: string): string {
  switch (String(role ?? "").trim().toUpperCase()) {
    case "ADMIN":
      return "Back to Admin Dashboard";
    case "DISPATCHER":
      return "Back to Dispatcher Dashboard";
    case "DRIVER":
      return "Back to Driver Dashboard";
    default:
      return "Back";
  }
}

// ============================================================
// VEHICLE ICON
// ============================================================

function createVehicleIcon(heading: number | null, selected: boolean) {
  const safeHeading = typeof heading === "number" && Number.isFinite(heading) ? heading : 0;
  const size = selected ? 52 : 46;

  return L.divIcon({
    className: "terminalink-vehicle-icon",
    html: `
      <div
        style="
          width:${size}px;
          height:${size}px;
          border-radius:50%;
          background:#2563eb;
          border:3px solid white;
          box-shadow:0 4px 14px rgba(0,0,0,.30);
          display:flex;
          align-items:center;
          justify-content:center;
          transform:rotate(${safeHeading}deg);
        "
      >
        <span
          style="
            display:block;
            transform:rotate(${-safeHeading}deg);
            font-size:${selected ? 26 : 23}px;
            line-height:1;
          "
        >
          🚐
        </span>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

// ============================================================
// TERMINAL ICON
// ============================================================

const terminalIcon = L.divIcon({
  className: "terminalink-terminal-icon",
  html: `
    <div
      style="
        width:42px;
        height:42px;
        border-radius:50%;
        background:#dc2626;
        border:3px solid white;
        box-shadow:0 4px 14px rgba(0,0,0,.30);
        display:flex;
        align-items:center;
        justify-content:center;
        font-size:20px;
      "
    >
      📍
    </div>
  `,
  iconSize: [42, 42],
  iconAnchor: [21, 21],
});

// ============================================================
// MAP CONTROLLER
// ============================================================

function MapController({
  selectedVehicle,
  recenterTick,
}: {
  selectedVehicle: LiveVehicle | null;
  recenterTick: number;
}) {
  const map = useMap();

  useEffect(() => {
    if (!selectedVehicle?.location) return;
    map.flyTo(
      [selectedVehicle.location.latitude, selectedVehicle.location.longitude],
      15,
      { duration: 0.8 },
    );
  }, [map, selectedVehicle?.tripId, recenterTick]);

  return null;
}

// ============================================================
// DETAIL ROW
// ============================================================

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-gray-500 dark:text-slate-400">{label}</div>
      <div className="mt-1 text-sm font-medium text-gray-900 dark:text-white">{value}</div>
    </div>
  );
}

// ============================================================
// MAIN
// ============================================================

export default function CommuterMap() {
  const navigate = useNavigate();
  const { authenticated, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const queryClient = useQueryClient();

  const [selectedCooperative, setSelectedCooperative] = useState("ALL");
  const [selectedRoute, setSelectedRoute] = useState("ALL");
  const [selectedVehicle, setSelectedVehicle] = useState<LiveVehicle | null>(null);
  const [recenterTick, setRecenterTick] = useState(0);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [socketConnected, setSocketConnected] = useState(false);

  const isAuthenticated = authenticated && !!user?.role;
  const isDark = theme === "dark";

  // ==========================================================
  // LIVE VEHICLES
  // ==========================================================

  const {
    data: liveVehicles = [],
    isLoading,
    isError,
    refetch,
  } = useQuery<LiveVehicle[]>({
    queryKey: ["commuter-live-vehicles"],
    queryFn: getLiveVehicles,
    refetchInterval: 15_000,
  });

  // ==========================================================
  // CLOCK
  // ==========================================================

  useEffect(() => {
    const timer = window.setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  // ==========================================================
  // SOCKET (polling only to avoid WebSocket handshake errors)
  // ==========================================================

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ["polling"], // force polling; no WebSocket attempt
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      upgrade: false, // disable upgrade to WebSocket
    });

    socket.on("connect", () => setSocketConnected(true));
    socket.on("disconnect", () => setSocketConnected(false));
    socket.on("connect_error", (err) => {
      console.warn("Socket connection error:", err.message);
      setSocketConnected(false);
    });

    socket.on("vehicle:location", (vehicle: LiveVehicle) => {
      // Guard against missing location
      if (!vehicle?.location?.recordedAt) return;

      queryClient.setQueryData<LiveVehicle[]>(["commuter-live-vehicles"], (current = []) => [
        ...current.filter((item) => item.tripId !== vehicle.tripId),
        vehicle,
      ]);

      setSelectedVehicle((current) =>
        current?.tripId === vehicle.tripId ? vehicle : current,
      );
    });

    socket.on("vehicle:removed", ({ tripId }: { tripId: string }) => {
      queryClient.setQueryData<LiveVehicle[]>(["commuter-live-vehicles"], (current = []) =>
        current.filter((vehicle) => vehicle.tripId !== tripId),
      );

      setSelectedVehicle((current) => (current?.tripId === tripId ? null : current));
    });

    return () => {
      socket.disconnect();
    };
  }, [queryClient]);

  // ==========================================================
  // CURRENT VEHICLES (only show positions updated within last 30s)
  // ==========================================================

  const currentVehicles = useMemo(
    () =>
      liveVehicles.filter((vehicle) => {
        if (!vehicle?.location?.recordedAt) return false;
        const timestamp = new Date(vehicle.location.recordedAt).getTime();
        return Number.isFinite(timestamp) && currentTime - timestamp <= 60_000;
      }),
    [liveVehicles, currentTime],
  );

  // ==========================================================
  // FILTERS
  // ==========================================================

  const cooperatives = useMemo(
    () =>
      Array.from(
        new Map(currentVehicles.map((vehicle) => [vehicle.cooperative.id, vehicle.cooperative.name])).entries(),
      ),
    [currentVehicles],
  );

  const routes = useMemo(
    () => Array.from(new Set(currentVehicles.map((vehicle) => routeName(vehicle)))).sort(),
    [currentVehicles],
  );

  // Reset filters if the selected value disappears
  useEffect(() => {
    if (selectedCooperative !== "ALL" && !cooperatives.some(([id]) => id === selectedCooperative)) {
      setSelectedCooperative("ALL");
    }
  }, [cooperatives, selectedCooperative]);

  useEffect(() => {
    if (selectedRoute !== "ALL" && !routes.includes(selectedRoute)) {
      setSelectedRoute("ALL");
    }
  }, [routes, selectedRoute]);

  const filteredVehicles = useMemo(
    () =>
      currentVehicles.filter((vehicle) => {
        const cooperativeMatches =
          selectedCooperative === "ALL" || vehicle.cooperative.id === selectedCooperative;
        const routeMatches = selectedRoute === "ALL" || routeName(vehicle) === selectedRoute;
        return cooperativeMatches && routeMatches;
      }),
    [currentVehicles, selectedCooperative, selectedRoute],
  );

  useEffect(() => {
    if (
      selectedVehicle &&
      !filteredVehicles.some((vehicle) => vehicle.tripId === selectedVehicle.tripId)
    ) {
      setSelectedVehicle(null);
    }
  }, [filteredVehicles, selectedVehicle]);

  // ==========================================================
  // ACCOUNT BUTTON
  // ==========================================================

  function handleAccountButton() {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: { pathname: "/commuter" } } });
      return;
    }
    navigate(getRoleBackPath(user?.role));
  }

  const accountButtonLabel = isAuthenticated ? getRoleBackLabel(user?.role) : "Login";

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="min-h-screen bg-gray-100 transition-colors dark:bg-slate-950">
      <header className="border-b bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-6">
          <div>
            <div className="flex items-center gap-2">
              <span
                className={[
                  "h-3 w-3 rounded-full",
                  socketConnected ? "bg-green-500" : "animate-pulse bg-amber-500",
                ].join(" ")}
              />
              <span
                className={[
                  "text-sm font-semibold",
                  socketConnected
                    ? "text-green-700 dark:text-green-400"
                    : "text-amber-700 dark:text-amber-400",
                ].join(" ")}
              >
                {socketConnected ? "LIVE" : "RECONNECTING"}
              </span>
            </div>
            <h1 className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">Terminalink</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">Live UV Tracking</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-gray-50 px-4 py-3 dark:bg-slate-800">
              <div className="text-xs text-gray-500 dark:text-slate-400">Live UVs</div>
              <div className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                {filteredVehicles.length}
              </div>
            </div>

            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle dark mode"
              title={isDark ? "Switch to light mode" : "Switch to dark mode"}
              className="inline-flex h-[52px] w-[52px] items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition-colors hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            <button
              type="button"
              onClick={handleAccountButton}
              className={
                isAuthenticated
                  ? "rounded-lg bg-gray-900 px-4 py-3 text-sm font-semibold text-white hover:bg-gray-800 dark:bg-slate-700 dark:hover:bg-slate-600"
                  : "rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700"
              }
            >
              {accountButtonLabel}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-4 p-4 md:p-6">
        <section className="rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-900">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
                Provincial Integrated Transport Terminal and Business Complex
              </div>
              <h2 className="mt-1 text-xl font-bold text-gray-900 dark:text-white">
                San Isidro Village, Virac, Catanduanes
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                H6J9+WP Virac, Catanduanes
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-slate-400">
                  Cooperative
                </label>
                <select
                  value={selectedCooperative}
                  onChange={(event) => {
                    setSelectedCooperative(event.target.value);
                    setSelectedVehicle(null);
                  }}
                  className="min-w-[220px] rounded-lg border bg-white px-3 py-2 text-sm text-gray-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="ALL">All Cooperatives</option>
                  {cooperatives.map(([id, name]) => (
                    <option key={id} value={id}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-slate-400">
                  Route
                </label>
                <select
                  value={selectedRoute}
                  onChange={(event) => {
                    setSelectedRoute(event.target.value);
                    setSelectedVehicle(null);
                  }}
                  className="min-w-[220px] rounded-lg border bg-white px-3 py-2 text-sm text-gray-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="ALL">All Routes</option>
                  {routes.map((route) => (
                    <option key={route} value={route}>
                      {route}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-slate-900">
          <div className="relative h-[calc(100vh-260px)] min-h-[560px]">
            <MapContainer
              center={TERMINAL_POSITION}
              zoom={13}
              scrollWheelZoom
              className="h-full w-full"
            >
              {/* Always use OSM tiles; no dark tile, no API key */}
              <TileLayer attribution={TILE_ATTRIBUTION} url={TILE_URL} />

              <MapController selectedVehicle={selectedVehicle} recenterTick={recenterTick} />

              <Marker position={TERMINAL_POSITION} icon={terminalIcon}>
                <Popup>
                  <div className="min-w-[230px]">
                    <div className="text-base font-bold text-gray-900">
                      Provincial Integrated Transport Terminal
                    </div>
                    <div className="mt-1 text-sm text-gray-600">
                      San Isidro Village, Virac, Catanduanes
                    </div>
                    <div className="mt-2 text-xs text-gray-500">H6J9+WP Virac, Catanduanes</div>
                  </div>
                </Popup>
              </Marker>

              {filteredVehicles.map((vehicle) => {
                const selected = selectedVehicle?.tripId === vehicle.tripId;
                const seconds = secondsAgo(vehicle.location.recordedAt);

                return (
                  <Marker
                    key={vehicle.tripId}
                    position={[vehicle.location.latitude, vehicle.location.longitude]}
                    icon={createVehicleIcon(vehicle.location.heading, selected)}
                    eventHandlers={{
                      click: () => setSelectedVehicle(vehicle),
                    }}
                  >
                    <Popup>
                      <div className="min-w-[250px]">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-lg font-bold text-gray-900">
                              {vehicle.vehicle.plateNumber}
                            </div>
                            <div className="mt-1 text-sm text-gray-500">
                              {vehicleName(vehicle)}
                            </div>
                          </div>
                          <span
                            className={[
                              "rounded-full px-2 py-1 text-xs font-semibold",
                              vehicle.availableSeats <= 0
                                ? "bg-red-100 text-red-700"
                                : vehicle.availableSeats <= 3
                                  ? "bg-yellow-100 text-yellow-700"
                                  : "bg-green-100 text-green-700",
                            ].join(" ")}
                          >
                            {availabilityText(vehicle)}
                          </span>
                        </div>

                        <div className="mt-3 text-sm font-medium text-gray-800">
                          {routeName(vehicle)}
                        </div>

                        <div className="mt-2 space-y-1 text-sm text-gray-600">
                          <div>
                            Driver: <strong>{driverName(vehicle)}</strong>
                          </div>
                          <div>{vehicle.cooperative.name}</div>
                          <div>
                            {vehicle.availableSeats} / {vehicle.seatCapacity} seats available
                          </div>
                        </div>

                        <div className="mt-3 text-xs text-gray-500">
                          {seconds === null
                            ? "GPS update unavailable"
                            : seconds === 0
                              ? "Updated just now"
                              : `Updated ${seconds}s ago`}
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>

            {isLoading && (
              <div className="absolute bottom-4 left-4 z-[1000] rounded-xl bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-lg dark:bg-slate-800 dark:text-slate-200">
                Loading live UV positions...
              </div>
            )}

            {isError && (
              <div className="absolute bottom-4 left-4 z-[1000] flex items-center gap-3 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700 shadow-lg dark:bg-red-950/40 dark:text-red-300">
                <span>Unable to load live UV positions.</span>
                <button
                  type="button"
                  onClick={() => void refetch()}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Retry
                </button>
              </div>
            )}

            {!socketConnected && !isLoading && !isError && (
              <div className="absolute bottom-4 left-4 z-[1000] flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800 shadow-lg dark:bg-amber-950/40 dark:text-amber-300">
                <WifiOff className="h-4 w-4" />
                Live connection lost — reconnecting...
              </div>
            )}

            {selectedVehicle?.location && (
              <aside className="absolute bottom-0 left-0 right-0 z-[1000] max-h-[70vh] overflow-y-auto rounded-t-2xl bg-white p-5 shadow-2xl dark:bg-slate-900 sm:bottom-4 sm:left-auto sm:right-4 sm:max-h-none sm:w-[min(380px,calc(100%-2rem))] sm:rounded-2xl">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
                      <span className="text-xs font-semibold uppercase tracking-wide text-green-700 dark:text-green-400">
                        Live UV
                      </span>
                    </div>
                    <h2 className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                      {selectedVehicle.vehicle.plateNumber}
                    </h2>
                    <div className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                      {vehicleName(selectedVehicle)}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedVehicle(null)}
                    className="rounded-full px-2 text-2xl leading-none text-gray-400 hover:bg-gray-100 dark:text-slate-500 dark:hover:bg-slate-800"
                    aria-label="Close"
                  >
                    ×
                  </button>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-gray-50 p-3 dark:bg-slate-800">
                    <div className="text-xs text-gray-500 dark:text-slate-400">Seats</div>
                    <div className="mt-1 text-lg font-bold text-gray-900 dark:text-white">
                      {selectedVehicle.availableSeats} / {selectedVehicle.seatCapacity}
                    </div>
                    <div className="mt-1 text-xs text-gray-500 dark:text-slate-400">available</div>
                  </div>
                  <div className="rounded-xl bg-gray-50 p-3 dark:bg-slate-800">
                    <div className="text-xs text-gray-500 dark:text-slate-400">Status</div>
                    <div className="mt-1 text-sm font-bold text-gray-900 dark:text-white">
                      {selectedVehicle.status}
                    </div>
                  </div>
                </div>

                <div className={["mt-4 rounded-xl p-4", availabilityClass(selectedVehicle)].join(" ")}>
                  <div className="text-xs font-semibold uppercase tracking-wide">Seat Availability</div>
                  <div className="mt-1 text-lg font-bold">
                    {selectedVehicle.availableSeats} seats available
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  <DetailRow label="Driver" value={driverName(selectedVehicle)} />
                  <DetailRow label="Cooperative" value={selectedVehicle.cooperative.name} />
                  <DetailRow label="Route" value={routeName(selectedVehicle)} />
                  <DetailRow
                    label="Last GPS Update"
                    value={
                      (() => {
                        const seconds = secondsAgo(selectedVehicle.location.recordedAt);
                        if (seconds === null) return "-";
                        if (seconds === 0) return "Just now";
                        return `${seconds}s ago`;
                      })()
                    }
                  />
                  <DetailRow
                    label="GPS Accuracy"
                    value={accuracyText(selectedVehicle.location.accuracy)}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setRecenterTick((value) => value + 1)}
                  className="mt-5 w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Center on UV
                </button>
              </aside>
            )}
          </div>
        </section>

        {!isLoading && filteredVehicles.length === 0 && (
          <section className="rounded-2xl bg-white p-8 text-center shadow-sm dark:bg-slate-900">
            <div className="text-4xl">🚐</div>
            <h2 className="mt-3 text-lg font-semibold text-gray-900 dark:text-white">
              No live UVs found
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-gray-500 dark:text-slate-400">
              {socketConnected
                ? "No vehicles are currently broadcasting a recent GPS position."
                : "Live connection lost — vehicle positions may be outdated until it reconnects."}
            </p>
            <div className="mt-4 flex items-center justify-center gap-2 text-xs font-medium text-gray-400 dark:text-slate-500">
              {socketConnected ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
              {socketConnected ? "Connected" : "Reconnecting..."}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}