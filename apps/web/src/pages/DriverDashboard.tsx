// apps/web/src/pages/DriverDashboard.tsx

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import QRCode from "react-qr-code";
import {
  ArrowRight,
  ArrowUpRight,
  Bus,
  CheckCircle2,
  Clock,
  Loader2,
  MapPin,
  Pencil,
  RefreshCw,
  XCircle,
} from "lucide-react";

import { getTripBoardingSummary } from "../api/boarding.api";
import type { BoardingSummary } from "../api/boarding.api";

import {
  createMyDriverTrip,
  getMyDriverProfile,
  getMyDriverTrips,
  markMyTripArrived,
  markMyTripApproaching,
  startMyTrip,
  startMyTripBoarding,
} from "../api/driver.api";
import type { DriverProfile, DriverTrip, DriverTripLeg } from "../api/driver.api";

import api from "../api/axios";
import { useDriverTracking } from "../hooks/useDriverTracking";
import { useTheme } from "../contexts/ThemeContext";

// ============================================================
// TYPES
// ============================================================

type Municipality = { id: string; name: string; active?: boolean };

type RouteItem = {
  id: string;
  origin?: { id?: string; name?: string };
  destination?: { id?: string; name?: string };
  active?: boolean;
};

type ApiError = {
  response?: { data?: { message?: string | string[] } | string };
  message?: string;
};

// ============================================================
// AUTOMATIC ROUTE RULES
// ============================================================

const AUTO_ROUTE_RULES: Record<string, { origin: string; destination: string }> = {
  PAVATRANSCO: { origin: "Panganiban", destination: "Virac" },
  VIRSACAPANTRANSCO: { origin: "Caramoran", destination: "Virac" },
  CATTRANSCO: { origin: "Viga", destination: "Virac" },
  CAPATRASCO: { origin: "Caramoran", destination: "Virac" },
  HAPITRANSCO: { origin: "Bagamanoc", destination: "Virac" },
  GIVITRANSCO: { origin: "Gigmoto", destination: "Virac" },
  BAGITSCO: { origin: "Baras", destination: "Virac" },
};

function normalizeKey(value?: string | null): string {
  return (value ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

// ============================================================
// HELPERS
// ============================================================

function getApiErrorMessage(error: unknown): string | null {
  if (typeof error !== "object" || error === null) return null;
  const value = error as ApiError;
  const responseData = value.response?.data;

  if (typeof responseData === "string") return responseData;

  if (responseData && typeof responseData === "object") {
    const message = responseData.message;
    if (Array.isArray(message)) return message.join(", ");
    if (typeof message === "string") return message;
  }

  if (typeof value.message === "string" && value.message.trim()) return value.message;
  return null;
}

function formatDate(value?: string | null): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
}

function getDriverName(profile?: DriverProfile): string {
  return (
    profile?.user?.displayName ||
    [profile?.user?.firstName, profile?.user?.lastName].filter(Boolean).join(" ") ||
    "Driver"
  );
}

function getCurrentLeg(trip: DriverTrip): DriverTripLeg | null {
  if (trip.status === "COMPLETED" || trip.status === "CANCELLED") return null;

  if (trip.currentLeg) {
    if (trip.currentLeg.status === "COMPLETED" || trip.currentLeg.status === "CANCELLED") {
      return null;
    }
    return trip.currentLeg;
  }

  const activeLeg = (trip.legs ?? [])
    .filter((leg) => leg.status !== "COMPLETED" && leg.status !== "CANCELLED")
    .sort(
      (a, b) =>
        new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime(),
    )[0];

  return activeLeg ?? null;
}

function getRouteForLeg(trip: DriverTrip, leg: DriverTripLeg): string {
  let origin = trip.route?.origin?.name ?? trip.municipality?.name ?? "Municipality";
  let destination = trip.route?.destination?.name ?? "Terminal";

  if (leg.originType === "TERMINAL") {
    origin = trip.route?.destination?.name ?? "Terminal";
  }
  if (leg.destinationType === "MUNICIPALITY") {
    destination = trip.route?.origin?.name ?? trip.municipality?.name ?? "Municipality";
  }

  return `${origin} → ${destination}`;
}

function getOperationText(leg: DriverTripLeg): string {
  if (leg.status === "WAITING") {
    return leg.legType === "RETURN"
      ? "Wait for your cooperative terminal boarding turn."
      : "Vehicle is at the municipality. Start boarding when you are ready.";
  }
  if (leg.status === "BOARDING") {
    return leg.legType === "RETURN"
      ? "Board passengers at the terminal before starting the return trip."
      : "Board passengers at the municipality before leaving for the terminal.";
  }
  if (leg.status === "EN_ROUTE") {
    return leg.destinationType === "MUNICIPALITY"
      ? "Traveling from the terminal to the municipality. GPS tracking is active."
      : "Traveling from the municipality to the terminal. GPS tracking is active.";
  }
  if (leg.status === "APPROACHING") {
    return "Approaching the terminal. Show the verification QR to the dispatcher.";
  }
  if (leg.status === "ARRIVED") {
    return leg.destinationType === "MUNICIPALITY"
      ? "Arrived at the municipality."
      : "Arrived at the terminal.";
  }
  if (leg.status === "COMPLETED") return "This operational leg is complete.";
  if (leg.status === "CANCELLED") return "This operational leg has been cancelled.";
  return "";
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function DriverDashboard() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  useTheme();

  // CREATE TRIP
  const [tripNumber, setTripNumber] = useState("");
  const [municipalityId, setMunicipalityId] = useState("");
  const [routeId, setRouteId] = useState("");

  // BOARDING VISIBILITY & SELECTED TRIP
  const [showBoarding, setShowBoarding] = useState(true);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);

  // CAPACITY EDITING
  const [isEditingCapacity, setIsEditingCapacity] = useState(false);
  const [capacityInput, setCapacityInput] = useState("");

  // ==========================================================
  // QUERIES
  // ==========================================================

  const profileQuery = useQuery<DriverProfile>({
    queryKey: ["driver-profile"],
    queryFn: getMyDriverProfile,
    refetchInterval: 30_000,
  });

  const tripsQuery = useQuery<DriverTrip[]>({
    queryKey: ["driver-trips"],
    queryFn: getMyDriverTrips,
    refetchInterval: 5_000,
  });

  const municipalitiesQuery = useQuery<Municipality[]>({
    queryKey: ["driver-municipalities"],
    queryFn: async () => {
      const response = await api.get("/municipalities");
      if (Array.isArray(response.data)) return response.data;
      return Array.isArray(response.data?.data) ? response.data.data : [];
    },
    refetchInterval: 60_000,
  });

  const routesQuery = useQuery<RouteItem[]>({
    queryKey: ["driver-routes"],
    queryFn: async () => {
      const response = await api.get("/routes");
      if (Array.isArray(response.data)) return response.data;
      return Array.isArray(response.data?.data) ? response.data.data : [];
    },
    refetchInterval: 60_000,
  });

  const trips = Array.isArray(tripsQuery.data) ? tripsQuery.data : [];
  const municipalities = municipalitiesQuery.data ?? [];
  const routes = routesQuery.data ?? [];

  const assignedVehicle = profileQuery.data?.activeVehicleAssignment?.vehicle ?? null;

  // ==========================================================
  // AUTOMATIC ROUTE FOR THIS DRIVER'S COOPERATIVE
  // ==========================================================

  const cooperativeName = profileQuery.data?.cooperative?.name ?? "";

  const autoRouteRule = useMemo(() => {
    const key =
      normalizeKey(profileQuery.data?.cooperative?.name) ||
      normalizeKey(profileQuery.data?.cooperative?.code);

    return key ? AUTO_ROUTE_RULES[key] : undefined;
  }, [profileQuery.data?.cooperative?.name, profileQuery.data?.cooperative?.code]);

  const autoRoute = useMemo(() => {
    if (!autoRouteRule) return undefined;

    return routes.find(
      (route) =>
        normalizeKey(route.origin?.name) === normalizeKey(autoRouteRule.origin) &&
        normalizeKey(route.destination?.name) === normalizeKey(autoRouteRule.destination),
    );
  }, [autoRouteRule, routes]);

  const autoMunicipality = useMemo(() => {
    if (!autoRouteRule) return undefined;

    return municipalities.find(
      (municipality) => normalizeKey(municipality.name) === normalizeKey(autoRouteRule.origin),
    );
  }, [autoRouteRule, municipalities]);

  const autoRouteId = autoRoute?.id;
  const autoMunicipalityId = autoMunicipality?.id;

  useEffect(() => {
    if (autoRouteId) setRouteId(autoRouteId);
  }, [autoRouteId]);

  useEffect(() => {
    if (autoMunicipalityId) setMunicipalityId(autoMunicipalityId);
  }, [autoMunicipalityId]);

  const hasAutoRule = !!autoRouteRule;

  // ==========================================================
  // TRIP DERIVATION
  // ==========================================================

  const waitingTrips = useMemo(
    () =>
      trips.filter((trip) => {
        const leg = getCurrentLeg(trip);
        return leg !== null && leg.status === "WAITING";
      }),
    [trips],
  );

  const nextWaitingTrip = waitingTrips[0] ?? null;

  const currentTrip = useMemo(() => {
    const activeTrips = trips.filter((trip) => {
      if (trip.status === "COMPLETED" || trip.status === "CANCELLED") return false;
      const leg = getCurrentLeg(trip);
      return (
        leg !== null &&
        ["WAITING", "BOARDING", "EN_ROUTE", "APPROACHING"].includes(leg.status)
      );
    });
    return activeTrips[0] ?? null;
  }, [trips]);

  const displayedTrip =
    currentTrip ??
    (selectedTripId ? trips.find((trip) => trip.id === selectedTripId) ?? null : null);

  const currentLeg = displayedTrip ? getCurrentLeg(displayedTrip) : null;

  useDriverTracking({
    enabled:
      !!displayedTrip &&
      !!currentLeg &&
      (currentLeg.status === "EN_ROUTE" || currentLeg.status === "APPROACHING"),
    tripId: displayedTrip?.id ?? null,
    tripLegId: currentLeg?.id ?? null,
  });

  const boardingSummaryQuery = useQuery<BoardingSummary>({
    queryKey: ["driver-boarding-summary", displayedTrip?.id, currentLeg?.id],
    queryFn: () => {
      if (!displayedTrip) throw new Error("No current trip");
      return getTripBoardingSummary(displayedTrip.id);
    },
    enabled:
      !!displayedTrip &&
      !!currentLeg &&
      (currentLeg.status === "BOARDING" || currentLeg.status === "ARRIVED"),
    refetchInterval: currentLeg?.status === "BOARDING" ? 5_000 : false,
  });

  const boardingSummary = boardingSummaryQuery.data ?? null;

  const seatCapacity =
  displayedTrip?.seatCapacity ??
  boardingSummary?.seatCapacity ??
  assignedVehicle?.seatCapacity ??
  0;

const availableSeats =
  displayedTrip?.availableSeats ?? boardingSummary?.availableSeats ?? seatCapacity;

const boardedCount =
  Math.max(0, seatCapacity - availableSeats);

  const isFull = availableSeats <= 0;

  // ==========================================================
  // REFRESH
  // ==========================================================

  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: ["driver-trips"] });
    await queryClient.invalidateQueries({ queryKey: ["driver-profile"] });

    if (displayedTrip) {
      await queryClient.invalidateQueries({
        queryKey: ["driver-boarding-summary", displayedTrip.id, currentLeg?.id],
      });
    }
  }

  // ==========================================================
  // MUTATIONS
  // ==========================================================

  const createTripMutation = useMutation({
    mutationFn: createMyDriverTrip,
    onSuccess: async (data) => {
      setTripNumber("");
      setMunicipalityId("");
      setRouteId("");
      setSelectedTripId(data.id);
      setShowBoarding(false);
      await refresh();
    },
  });

  const startBoardingMutation = useMutation({
    mutationFn: startMyTripBoarding,
    onSuccess: async (data) => {
      setSelectedTripId(data.id);
      setShowBoarding(true);
      await refresh();
    },
  });

  const startTripMutation = useMutation({
    mutationFn: startMyTrip,
    onSuccess: async () => {
      setShowBoarding(false);
      await refresh();
    },
  });

  const approachingMutation = useMutation({
    mutationFn: markMyTripApproaching,
    onSuccess: async () => {
      await refresh();
    },
  });

  const arrivedMutation = useMutation({
    mutationFn: markMyTripArrived,
    onSuccess: async () => {
      setShowBoarding(false);
      setSelectedTripId(null);
      await refresh();
    },
  });

  const adjustSeatMutation = useMutation({
  mutationFn: async (delta: number) => {
    console.log("Mutation executing. Trip ID:", displayedTrip?.id);
    if (!displayedTrip) return;

    const newAvailable = Math.max(0, Math.min(seatCapacity, availableSeats + delta));
    console.log("New available seats:", newAvailable);

    await api.patch(`/trips/${displayedTrip.id}/available-seats`, {
      availableSeats: newAvailable,
    });
  },
  onSuccess: async () => {
    console.log("Seat adjustment succeeded");
    await refresh();
  },
  onError: (error) => {
    console.log("Seat adjustment failed:", error);
    alert(getApiErrorMessage(error) || "Failed to adjust seats");
  },
});

  const updateCapacityMutation = useMutation({
    mutationFn: async (newCapacity: number) => {
      if (!assignedVehicle?.id) throw new Error("No vehicle assigned");
      await api.patch(`/vehicles/${assignedVehicle.id}`, { seatCapacity: newCapacity });
    },
    onSuccess: async () => {
      setIsEditingCapacity(false);
      await queryClient.invalidateQueries({ queryKey: ["driver-profile"] });
    },
  });

  // ==========================================================
  // COUNTS
  // ==========================================================

  const completedCount = trips.filter((trip) => {
    if (trip.status === "COMPLETED") return true;
    const legs = trip.legs ?? [];
    return legs.length > 0 && legs.every((leg) => leg.status === "COMPLETED");
  }).length;

  const activeCount = Math.max(trips.length - completedCount, 0);
  const driverName = getDriverName(profileQuery.data);

  // ==========================================================
  // LOADING
  // ==========================================================

  if (
    profileQuery.isLoading ||
    tripsQuery.isLoading ||
    municipalitiesQuery.isLoading ||
    routesQuery.isLoading
  ) {
    return (
      <div className="min-h-screen bg-slate-50 transition-colors dark:bg-slate-950">
        <div className="flex min-h-[60vh] items-center justify-center p-6">
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <Loader2 className="h-5 w-5 animate-spin text-indigo-600 dark:text-indigo-400" />
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
              Loading driver dashboard...
            </span>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================
  // ERROR
  // ==========================================================

  if (profileQuery.isError || tripsQuery.isError) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 transition-colors dark:bg-slate-950">
        <div className="rounded-2xl border border-red-100 bg-red-50 p-6 dark:border-red-900/50 dark:bg-red-950/30">
          <div className="flex items-start gap-3">
            <XCircle className="mt-0.5 h-6 w-6 shrink-0 text-red-500 dark:text-red-400" />
            <div>
              <h2 className="text-lg font-semibold text-red-800 dark:text-red-200">
                Unable to load driver dashboard
              </h2>
              <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                Verify that the API is running on http://localhost:3001.
              </p>
              <button
                type="button"
                onClick={() => void refresh()}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
              >
                <RefreshCw className="h-4 w-4" />
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="min-h-screen bg-slate-50 transition-colors dark:bg-slate-950">
      <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
        {/* HEADER */}
        <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-600 p-6 text-white shadow-lg shadow-indigo-200/50 dark:shadow-none sm:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-indigo-200">
                Driver Dashboard
              </p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight">
                Welcome, {driverName}
              </h1>
              <p className="mt-2 max-w-md text-sm text-indigo-100">
                Create and operate your own trips. Your assigned vehicle is selected
                automatically.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate("/commuter")}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-indigo-700 shadow-sm transition hover:bg-indigo-50"
              >
                <MapPin className="h-4 w-4" />
                Live Tracking
                <ArrowUpRight className="h-4 w-4" />
              </button>
              <div className="hidden items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm text-indigo-100 backdrop-blur sm:flex">
                <RefreshCw className="h-4 w-4" />
                Auto-refresh 5s
              </div>
            </div>
          </div>
        </section>

        {/* ASSIGNED VEHICLE */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
            Assigned Vehicle
          </div>

          {assignedVehicle ? (
            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-300">
                  <Bus className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xl font-bold text-slate-900 dark:text-white">
                    {assignedVehicle.plateNumber ?? "-"}
                  </div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">
                    {[assignedVehicle.make, assignedVehicle.model]
                      .filter(Boolean)
                      .join(" ") || "Vehicle"}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {isEditingCapacity ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      value={capacityInput}
                      onChange={(e) => setCapacityInput(e.target.value)}
                      className="w-24 rounded-lg border border-slate-300 p-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                    />
                    <button
                      onClick={() => {
                        const newCapacity = Number(capacityInput);
                        if (Number.isInteger(newCapacity) && newCapacity > 0) {
                          updateCapacityMutation.mutate(newCapacity);
                        }
                      }}
                      disabled={updateCapacityMutation.isPending}
                      className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {updateCapacityMutation.isPending ? "Saving..." : "Save"}
                    </button>
                    <button
                      onClick={() => setIsEditingCapacity(false)}
                      className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="inline-flex w-fit items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                      <CheckCircle2 className="h-4 w-4" />
                      {assignedVehicle.seatCapacity ?? 0} seats · Active
                    </div>
                    <button
                      onClick={() => {
                        setCapacityInput(String(assignedVehicle.seatCapacity ?? 0));
                        setIsEditingCapacity(true);
                      }}
                      className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
                      title="Edit capacity"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-950/30">
              <div className="font-semibold text-amber-900 dark:text-amber-200">
                No vehicle assigned
              </div>
              <div className="mt-1 text-sm text-amber-800 dark:text-amber-300">
                Ask the administrator to assign an active vehicle before creating a trip.
              </div>
            </div>
          )}
        </section>

        {/* SUMMARY */}
        <section className="grid gap-4 sm:grid-cols-3">
          <SummaryCard title="My Trips" value={trips.length} icon={<Bus className="h-5 w-5" />} />
          <SummaryCard
            title="Active Trips"
            value={activeCount}
            icon={<Clock className="h-5 w-5" />}
            accent="indigo"
          />
          <SummaryCard
            title="Completed"
            value={completedCount}
            icon={<CheckCircle2 className="h-5 w-5" />}
            accent="emerald"
          />
        </section>

        {/* CREATE NEW TRIP */}
        {!currentTrip && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Start a New Trip
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Create your municipality-to-terminal trip. Your assigned vehicle is
              selected automatically.
            </p>

            {!assignedVehicle ? (
              <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300">
                No active vehicle is assigned to this driver. Vehicle assignment is
                required before a trip can be created.
              </div>
            ) : (
              <>
                <div className="mt-5 grid gap-4 md:grid-cols-3">
                  <Field
                    label="Trip Number"
                    value={tripNumber}
                    onChange={setTripNumber}
                    placeholder="Optional"
                  />

                  {/* AUTOMATIC ROUTE (locked, no override) */}
                  {hasAutoRule && autoRoute && autoMunicipality ? (
                    <div className="md:col-span-2">
                      <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4 dark:border-indigo-900/50 dark:bg-indigo-950/30">
                        <div className="text-xs font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-300">
                          Automatic Route · {cooperativeName}
                        </div>
                        <div className="mt-1 text-lg font-bold text-indigo-900 dark:text-indigo-100">
                          {autoRouteRule.origin} → {autoRouteRule.destination}
                        </div>
                        <p className="mt-1 text-xs text-indigo-700 dark:text-indigo-300">
                          This cooperative operates only on this route. Municipality and
                          route are set automatically.
                        </p>
                      </div>
                    </div>
                  ) : hasAutoRule && (!autoRoute || !autoMunicipality) ? (
                    <div className="md:col-span-2">
                      <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-950/30">
                        <div className="text-xs font-semibold uppercase tracking-wide text-red-600 dark:text-red-300">
                          Automatic Route · {cooperativeName}
                        </div>
                        <div className="mt-1 text-lg font-bold text-red-900 dark:text-red-100">
                          {autoRouteRule.origin} → {autoRouteRule.destination}
                        </div>
                        <p className="mt-1 text-xs text-red-700 dark:text-red-300">
                          This cooperative has a fixed route, but the corresponding
                          municipality or route was not found. Trip creation is disabled.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                          Municipality
                        </label>
                        <select
                          value={municipalityId}
                          onChange={(event) => setMunicipalityId(event.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:ring-indigo-900"
                        >
                          <option value="">Select municipality</option>
                          {municipalities
                            .filter((municipality) => municipality.active !== false)
                            .map((municipality) => (
                              <option key={municipality.id} value={municipality.id}>
                                {municipality.name}
                              </option>
                            ))}
                        </select>
                      </div>

                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                          Route
                        </label>
                        <select
                          value={routeId}
                          onChange={(event) => setRouteId(event.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:ring-indigo-900"
                        >
                          <option value="">Select route</option>
                          {routes
                            .filter((route) => route.active !== false)
                            .map((route) => (
                              <option key={route.id} value={route.id}>
                                {route.origin?.name ?? "Municipality"} →{" "}
                                {route.destination?.name ?? "Terminal"}
                              </option>
                            ))}
                        </select>
                      </div>
                    </>
                  )}
                </div>

                {createTripMutation.error && (
                  <ErrorBox message={getApiErrorMessage(createTripMutation.error)} />
                )}

                <button
                  type="button"
                  disabled={
                    !municipalityId ||
                    !routeId ||
                    createTripMutation.isPending ||
                    (hasAutoRule && (!autoRoute || !autoMunicipality))
                  }
                  onClick={() => {
                    createTripMutation.mutate({
                      municipalityId,
                      routeId,
                      ...(tripNumber.trim() ? { tripNumber: tripNumber.trim() } : {}),
                    });
                  }}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 dark:shadow-none"
                >
                  {createTripMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  {createTripMutation.isPending ? "Creating Trip..." : "Create Trip"}
                </button>
              </>
            )}
          </section>
        )}

        {/* CURRENT TRIP / EMPTY STATE */}
        {displayedTrip && currentLeg ? (
          <DriverTripCard
            trip={displayedTrip}
            leg={currentLeg}
            route={getRouteForLeg(displayedTrip, currentLeg)}
            showBoarding={showBoarding}
            onToggleBoarding={() => setShowBoarding((value) => !value)}
            seatCapacity={seatCapacity}
            availableSeats={availableSeats}
            boardedCount={boardedCount}
            isFull={isFull}
            onAdjustSeat={(delta) => adjustSeatMutation.mutate(delta)}
            adjustSeatPending={adjustSeatMutation.isPending}
            onStartBoarding={() => startBoardingMutation.mutate(displayedTrip.id)}
            onStartTrip={() => startTripMutation.mutate(displayedTrip.id)}
            onApproaching={() => approachingMutation.mutate(displayedTrip.id)}
            onArrived={() => arrivedMutation.mutate(displayedTrip.id)}
            startBoardingPending={startBoardingMutation.isPending}
            startTripPending={startTripMutation.isPending}
            approachingPending={approachingMutation.isPending}
            arrivedPending={arrivedMutation.isPending}
            startBoardingError={getApiErrorMessage(startBoardingMutation.error)}
            startTripError={getApiErrorMessage(startTripMutation.error)}
            approachingError={getApiErrorMessage(approachingMutation.error)}
            arrivedError={getApiErrorMessage(arrivedMutation.error)}
            boardingSummaryLoading={boardingSummaryQuery.isLoading}
            boardingSummaryError={boardingSummaryQuery.isError}
            terminalQueuePosition={displayedTrip.terminalQueuePosition ?? null}
            isFirstTerminalVehicle={displayedTrip.isFirstTerminalVehicle ?? false}
          />
        ) : (
          <EmptyTripState
            nextWaitingTrip={nextWaitingTrip}
            onSelectTrip={(tripId) => {
              setSelectedTripId(tripId);
              setShowBoarding(false);
            }}
          />
        )}
      </div>
    </div>
  );
}

// ============================================================
// EMPTY STATE
// ============================================================

function EmptyTripState({
  nextWaitingTrip,
  onSelectTrip,
}: {
  nextWaitingTrip: DriverTrip | null;
  onSelectTrip: (tripId: string) => void;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mx-auto max-w-xl text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-300">
          <ArrowRight className="h-7 w-7" />
        </div>

        <h2 className="mt-4 text-xl font-semibold text-slate-900 dark:text-white">
          No current trip
        </h2>

        <p className="mx-auto mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
          {nextWaitingTrip
            ? "You have a waiting trip assigned to you."
            : "Create a new trip above when you are ready to depart from the municipality."}
        </p>

        {nextWaitingTrip && (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-left dark:border-slate-800 dark:bg-slate-800/50">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
              Waiting Trip
            </div>
            <div className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
              {nextWaitingTrip.tripNumber}
            </div>
            <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              {getRouteForLeg(nextWaitingTrip, getCurrentLeg(nextWaitingTrip)!)}
            </div>

            <button
              type="button"
              onClick={() => onSelectTrip(nextWaitingTrip.id)}
              className="mt-5 w-full rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
            >
              View Waiting Trip
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

// ============================================================
// DRIVER TRIP CARD
// ============================================================

type DriverTripCardProps = {
  trip: DriverTrip;
  leg: DriverTripLeg;
  route: string;
  showBoarding: boolean;
  onToggleBoarding: () => void;
  seatCapacity: number;
  availableSeats: number;
  boardedCount: number;
  isFull: boolean;
  onAdjustSeat: (delta: number) => void;
  adjustSeatPending: boolean;
  onStartBoarding: () => void;
  onStartTrip: () => void;
  onApproaching: () => void;
  onArrived: () => void;
  startBoardingPending: boolean;
  startTripPending: boolean;
  approachingPending: boolean;
  arrivedPending: boolean;
  startBoardingError: string | null;
  startTripError: string | null;
  approachingError: string | null;
  arrivedError: string | null;
  boardingSummaryLoading: boolean;
  boardingSummaryError: boolean;
  terminalQueuePosition: number | null;
  isFirstTerminalVehicle: boolean;
};

function DriverTripCard({
  trip,
  leg,
  route,
  showBoarding,
  onToggleBoarding,
  seatCapacity,
  availableSeats,
  boardedCount,
  isFull,
  onAdjustSeat,
  adjustSeatPending,
  onStartBoarding,
  onStartTrip,
  onApproaching,
  onArrived,
  startBoardingPending,
  startTripPending,
  approachingPending,
  arrivedPending,
  startBoardingError,
  startTripError,
  approachingError,
  arrivedError,
  boardingSummaryLoading,
  boardingSummaryError,
  terminalQueuePosition,
  isFirstTerminalVehicle,
}: DriverTripCardProps) {
  const isReturn = leg.legType === "RETURN";

  const showTerminalQueue =
    isReturn && leg.originType === "TERMINAL" && leg.status === "WAITING";

  const canStartBoarding =
    leg.status === "WAITING" && (!showTerminalQueue || isFirstTerminalVehicle);

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      {/* HEADER */}
      <div className="border-b border-slate-100 p-6 dark:border-slate-800">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
              Current Trip
            </div>
            <h2 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
              {trip.tripNumber}
            </h2>
            <div className="mt-1 flex items-center gap-1.5 text-lg font-medium text-slate-600 dark:text-slate-300">
              <MapPin className="h-4 w-4 text-slate-400 dark:text-slate-500" />
              {route}
            </div>
          </div>
          <StatusBadge status={leg.status} />
        </div>
      </div>

      {/* VEHICLE / ROUTE / CAPACITY */}
      <div className="grid gap-5 border-b border-slate-100 p-6 dark:border-slate-800 md:grid-cols-3">
        <InfoItem
          label="Vehicle"
          value={trip.vehicle?.plateNumber ?? "-"}
          secondary={
            [trip.vehicle?.make, trip.vehicle?.model].filter(Boolean).join(" ") || "-"
          }
        />
        <InfoItem
          label="Route"
          value={route}
          secondary={isReturn ? "Terminal → Municipality" : "Municipality → Terminal"}
        />
        <InfoItem
          label="Capacity"
          value={String(seatCapacity)}
          secondary={`${availableSeats} available`}
        />
      </div>

      {/* DRIVER OPERATIONS */}
      <div className="border-b border-slate-100 p-6 dark:border-slate-800">
        <div className="text-sm font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
          Driver Operations
        </div>
        <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
          {getOperationText(leg)}
        </p>

        {showTerminalQueue && (
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
            <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Terminal Boarding Queue
            </div>
            <div className="mt-3 flex items-center justify-between gap-4">
              <div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">
                  {terminalQueuePosition ? `#${terminalQueuePosition}` : "#-"}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Cooperative queue
                </div>
              </div>
              {isFirstTerminalVehicle ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                  <CheckCircle2 className="h-4 w-4" />
                  Ready for Boarding
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                  <Clock className="h-4 w-4" />
                  Waiting
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* WAITING */}
      {leg.status === "WAITING" && (
        <div className="border-b border-slate-100 p-6 dark:border-slate-800">
          {canStartBoarding ? (
            <button
              type="button"
              disabled={startBoardingPending}
              onClick={onStartBoarding}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 dark:shadow-none"
            >
              {startBoardingPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {startBoardingPending ? "Starting Boarding..." : "Start Boarding"}
            </button>
          ) : (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-950/30">
              <div className="font-semibold text-amber-900 dark:text-amber-200">
                Waiting for your turn
              </div>
              <p className="mt-1 text-sm text-amber-800 dark:text-amber-300">
                Another vehicle in your cooperative is ahead of you.
              </p>
            </div>
          )}

          {startBoardingError && <ErrorBox message={startBoardingError} />}
        </div>
      )}

      {/* BOARDING */}
      {leg.status === "BOARDING" && (
        <div className="border-b border-slate-100 p-6 dark:border-slate-800">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                Passenger Boarding
              </h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {isReturn
                  ? "Board passengers for the terminal-to-municipality trip."
                  : "Board passengers before leaving the municipality."}
              </p>
            </div>
            <button
              type="button"
              onClick={onToggleBoarding}
              className="rounded-xl bg-slate-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600"
            >
              {showBoarding ? "Hide Boarding" : "Show Boarding"}
            </button>
          </div>

          {showBoarding && (
            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-800/40">
              <div className="grid gap-4 sm:grid-cols-3">
                <StatCard
                  label="Capacity"
                  value={boardingSummaryLoading ? "..." : seatCapacity}
                />
                <StatCard
                  label="Boarded"
                  value={boardingSummaryLoading ? "..." : boardedCount}
                />
                <StatCard
                  label="Available"
                  value={boardingSummaryLoading ? "..." : availableSeats}
                />
              </div>

              {boardingSummaryError && (
                <ErrorBox message="Unable to load boarding summary." />
              )}

              {isFull && (
                <div className="mt-4 rounded-lg bg-amber-100 p-3 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                  This vehicle is full.
                </div>
              )}

              {/* Simple seat adjustment */}
              <div className="mt-6 flex flex-col items-center gap-3">
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => onAdjustSeat(1)}
                    disabled={adjustSeatPending || availableSeats >= seatCapacity}
                    className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-2xl font-bold text-white shadow-sm hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label="Increase available seats"
                  >
                    +
                  </button>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-slate-900 dark:text-white">
                      {availableSeats}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      available
                    </div>
                  </div>
                  <button
  type="button"
  onClick={() => {
    console.log("Minus clicked");
    onAdjustSeat(-1);
  }}
  disabled={adjustSeatPending || availableSeats <= 0}
                    className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-2xl font-bold text-white shadow-sm hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label="Decrease available seats"
                  >
                    −
                  </button>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Tap + when a passenger leaves, tap − when a passenger boards.
                </p>
              </div>

              {/* START TRIP */}
              {boardedCount > 0 && (
                <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 p-5 dark:border-emerald-900/50 dark:bg-emerald-950/30">
                  <div className="font-semibold text-emerald-900 dark:text-emerald-200">
                    Ready to leave {isReturn ? "terminal" : "municipality"}
                  </div>
                  <p className="mt-1 text-sm text-emerald-800 dark:text-emerald-300">
                    Start Trip changes this operational leg to EN_ROUTE and activates GPS tracking.
                  </p>
                  <button
                    type="button"
                    disabled={startTripPending}
                    onClick={onStartTrip}
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm shadow-emerald-200 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 dark:shadow-none"
                  >
                    {startTripPending && <Loader2 className="h-4 w-4 animate-spin" />}
                    {startTripPending ? "Starting Trip..." : "Start Trip"}
                  </button>
                  {startTripError && <ErrorBox message={startTripError} />}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* EN ROUTE */}
      {leg.status === "EN_ROUTE" && (
        <div className="border-b border-slate-100 p-6 dark:border-slate-800">
          <div className="rounded-2xl border border-violet-100 bg-violet-50 p-5 dark:border-violet-900/50 dark:bg-violet-950/30">
            <div className="flex items-center gap-2 font-semibold text-violet-900 dark:text-violet-200">
              <Loader2 className="h-4 w-4 animate-spin" />
              En Route
            </div>
            <p className="mt-2 text-sm text-violet-800 dark:text-violet-300">{route}</p>
            <p className="mt-2 text-sm text-violet-700 dark:text-violet-400">
              GPS tracking is active. Your phone's location is being shared with
              commuters while this operational leg is active.
            </p>

            {leg.destinationType === "TERMINAL" && (
              <button
                type="button"
                disabled={approachingPending}
                onClick={onApproaching}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white shadow-sm shadow-orange-200 transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50 dark:shadow-none"
              >
                {approachingPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {approachingPending ? "Generating QR..." : "Mark Approaching Terminal"}
              </button>
            )}

            {leg.destinationType === "MUNICIPALITY" && (
              <button
                type="button"
                disabled={arrivedPending}
                onClick={onArrived}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm shadow-emerald-200 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 dark:shadow-none"
              >
                {arrivedPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {arrivedPending ? "Completing..." : "Arrived at Municipality"}
              </button>
            )}

            {approachingError && <ErrorBox message={approachingError} />}
            {arrivedError && <ErrorBox message={arrivedError} />}
          </div>
        </div>
      )}

      {/* APPROACHING / TERMINAL QR */}
      {leg.status === "APPROACHING" && (
        <div className="border-b border-slate-100 p-6 dark:border-slate-800">
          <div className="rounded-2xl border border-orange-100 bg-orange-50 p-6 dark:border-orange-900/50 dark:bg-orange-950/30">
            <div className="text-xs font-semibold uppercase tracking-wide text-orange-700 dark:text-orange-400">
              Terminal Verification
            </div>
            <h3 className="mt-1 text-xl font-bold text-orange-900 dark:text-orange-200">
              Approaching Terminal
            </h3>
            <p className="mt-2 text-sm text-orange-800 dark:text-orange-300">
              Show this QR code to the dispatcher for terminal vehicle verification.
            </p>

            {leg.terminalVerificationToken ? (
              <div className="mt-6 flex flex-col items-center">
                <div className="rounded-2xl bg-white p-5 shadow-sm">
                  <QRCode
                    value={JSON.stringify({
                      type: "TERMINALINK_TERMINAL_VERIFICATION",
                      token: leg.terminalVerificationToken,
                      tripId: trip.id,
                      tripNumber: trip.tripNumber,
                      legId: leg.id,
                    })}
                    size={240}
                    level="M"
                  />
                </div>
                <div className="mt-4 text-center">
                  <div className="font-semibold text-slate-900 dark:text-white">
                    {trip.tripNumber}
                  </div>
                  <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Present this QR at the terminal.
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-5 flex items-center gap-2 rounded-xl bg-white p-4 text-sm text-orange-700 dark:bg-slate-900 dark:text-orange-300">
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating terminal verification QR...
              </div>
            )}

            {approachingError && <ErrorBox message={approachingError} />}
          </div>
        </div>
      )}

      {/* ARRIVED */}
      {leg.status === "ARRIVED" && (
        <div className="border-b border-slate-100 p-6 dark:border-slate-800">
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5 dark:border-emerald-900/50 dark:bg-emerald-950/30">
            <div className="flex items-center gap-2 font-semibold text-emerald-900 dark:text-emerald-200">
              <CheckCircle2 className="h-4 w-4" />
              Arrived
            </div>
            <p className="mt-2 text-sm text-emerald-800 dark:text-emerald-300">
              {leg.destinationType === "MUNICIPALITY"
                ? "Arrived at the municipality."
                : "Arrived at the terminal."}
            </p>
            {leg.arrivedAt && (
              <div className="mt-3 text-sm text-emerald-700 dark:text-emerald-400">
                Arrived: {formatDate(leg.arrivedAt)}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TIMELINE */}
      <div className="p-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
          Trip Timeline
        </h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <TimelineItem label="Boarding Started" value={leg.boardingStartedAt} />
          <TimelineItem label="Started" value={leg.startedAt} />
          {leg.destinationType === "TERMINAL" && (
            <TimelineItem label="Approaching" value={leg.approachingAt} />
          )}
          <TimelineItem label="Arrived" value={leg.arrivedAt} />
          <TimelineItem label="Completed" value={leg.completedAt} />
        </div>
      </div>
    </section>
  );
}

// ============================================================
// SMALL COMPONENTS
// ============================================================

function SummaryCard({
  title,
  value,
  icon,
  accent = "slate",
}: {
  title: string;
  value: number;
  icon?: React.ReactNode;
  accent?: "slate" | "indigo" | "emerald";
}) {
  const accentClasses = {
    slate: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
    indigo: "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-300",
    emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300",
  }[accent];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-500 dark:text-slate-400">{title}</div>
        {icon && (
          <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${accentClasses}`}>
            {icon}
          </div>
        )}
      </div>
      <div className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{value}</div>
    </div>
  );
}

function InfoItem({
  label,
  value,
  secondary,
}: {
  label: string;
  value: string;
  secondary?: string;
}) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">
        {label}
      </div>
      <div className="mt-1 font-semibold text-slate-900 dark:text-white">{value}</div>
      {secondary && (
        <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{secondary}</div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="text-xs text-slate-500 dark:text-slate-400">{label}</div>
      <div className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{value}</div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 dark:focus:ring-indigo-900"
      />
    </div>
  );
}

function TimelineItem({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/50">
      <div className="text-xs text-slate-500 dark:text-slate-400">{label}</div>
      <div className="mt-1 text-sm font-medium text-slate-900 dark:text-white">
        {formatDate(value)}
      </div>
    </div>
  );
}

function ErrorBox({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="mt-4 flex items-start gap-2 whitespace-pre-line rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">
      <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
      {message}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const classes: Record<string, string> = {
    WAITING: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
    BOARDING: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
    EN_ROUTE: "bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300",
    APPROACHING: "bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300",
    ARRIVED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
    COMPLETED: "bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300",
    CANCELLED: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${
        classes[status] ?? "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
      }`}
    >
      {status}
    </span>
  );
}