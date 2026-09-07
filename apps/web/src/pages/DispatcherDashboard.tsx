// apps/web/src/pages/DispatcherDashboard.tsx

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getDispatcherDashboard, getIncomingTrips } from "../api/dispatcher.api";
import VehicleQrScanner from "../components/VehicleQrScanner";
import api from "../api/axios";

// ============================================================
// TYPES
// ============================================================

type TripLeg = {
  id: string;
  legType?: string;
  originType?: string;
  destinationType?: string;
  status: string;
  terminalVerificationToken?: string | null;
  terminalVerificationIssuedAt?: string | null;
  arrivedAt?: string | null;
  createdAt?: string;
  queueEntries?: Array<{
    id: string;
    queuePosition: number;
    status: string;
  }>;
};

type Trip = {
  id: string;
  tripNumber?: string;
  direction?: string;
  status: string;
  seatCapacity?: number;
  availableSeats?: number;
  estimatedArrival?: string | null;
  startedAt?: string | null;
  boardingStartedAt?: string | null;
  departedAt?: string | null;
  arrivedAt?: string | null;
  completedAt?: string | null;
  driver?: {
    user?: {
      displayName?: string;
      firstName?: string;
      lastName?: string;
    };
    cooperative?: {
      id?: string;
      name?: string;
    };
  };
  vehicle?: {
    plateNumber?: string;
    make?: string;
    model?: string;
    qrToken?: string;
  };
  route?: {
    origin?: { name?: string };
    destination?: { name?: string };
  };
  municipality?: {
    id?: string;
    name?: string;
  };
  legs?: TripLeg[];
  currentLeg?: TripLeg | null;
  terminalQueuePosition?: number | null;
};

type ApiError = {
  response?: {
    data?: { message?: string | string[]; code?: string } | string;
  };
  message?: string;
};

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
  if (typeof value.message === "string" && value.message.trim().length > 0) return value.message;
  return null;
}

function getDriverName(trip: Trip): string {
  const displayName = trip.driver?.user?.displayName;
  if (typeof displayName === "string" && displayName.trim().length > 0) return displayName;
  const firstName = trip.driver?.user?.firstName ?? "";
  const lastName = trip.driver?.user?.lastName ?? "";
  return `${firstName} ${lastName}`.trim() || "-";
}

function getVehicleName(trip: Trip): string {
  const make = trip.vehicle?.make ?? "";
  const model = trip.vehicle?.model ?? "";
  return `${make} ${model}`.trim() || "-";
}

function getRouteName(trip: Trip): string {
  const origin = trip.route?.origin?.name ?? "-";
  const destination = trip.route?.destination?.name ?? "-";
  return `${origin} → ${destination}`;
}

function formatDate(value?: string | null): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
}

function getStatusClass(status: string): string {
  const classes: Record<string, string> = {
    WAITING: "bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-slate-300",
    BOARDING: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
    EN_ROUTE: "bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300",
    APPROACHING: "bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300",
    DOCKED: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-300",
    DEPARTED: "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300",
    COMPLETED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
    CANCELLED: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300",
  };
  return classes[status] ?? "bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-slate-300";
}

function getCurrentLeg(trip: Trip): TripLeg | null {
  if (trip.currentLeg) return trip.currentLeg;
  return (
    trip.legs
      ?.filter((leg) => leg.status !== "COMPLETED" && leg.status !== "CANCELLED")
      .sort((a, b) => Date.parse(b.createdAt ?? "") - Date.parse(a.createdAt ?? ""))[0] ?? null
  );
}

// ============================================================
// ICONS
// ============================================================

function DispatchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7" aria-hidden="true">
      <path
        d="M4.5 17.25V8.25a1.5 1.5 0 0 1 1.5-1.5h9l4.5 4.5v6a1.5 1.5 0 0 1-1.5 1.5h-1.5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M15 6.75V11.25H19.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="8.25" cy="17.25" r="1.75" stroke="currentColor" strokeWidth="1.75" />
      <circle cx="16.5" cy="17.25" r="1.75" stroke="currentColor" strokeWidth="1.75" />
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

function RefreshIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
      <path
        d="M4.5 12a7.5 7.5 0 0 1 12.9-5.2M19.5 12a7.5 7.5 0 0 1-12.9 5.2M4.5 12H2.25m17.25 0H21.75M16.5 6.75h3V3.75M7.5 17.25h-3v3"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function QrIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
      <rect x="3.75" y="3.75" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.75" />
      <rect x="14.25" y="3.75" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.75" />
      <rect x="3.75" y="14.25" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  );
}

function SpinnerIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={`${className} animate-spin`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-75" d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function EmptyTrayIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="mx-auto h-10 w-10 text-gray-300 dark:text-slate-600" aria-hidden="true">
      <path
        d="M4.5 13.5 6.75 6h10.5l2.25 7.5M4.5 13.5v4.5a1.5 1.5 0 0 0 1.5 1.5h12a1.5 1.5 0 0 0 1.5-1.5v-4.5M4.5 13.5h4.5a1.5 3 0 0 0 6 0h4.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ============================================================
// MAIN
// ============================================================

export default function DispatcherDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [qrScanningTripId, setQrScanningTripId] = useState<string | null>(null);

  const dashboardQuery = useQuery({
    queryKey: ["dispatcher-dashboard"],
    queryFn: getDispatcherDashboard,
    refetchInterval: 10_000,
  });

  const tripsQuery = useQuery<Trip[]>({
    queryKey: ["dispatcher-trips"],
    queryFn: getIncomingTrips,
    refetchInterval: 5_000,
  });

  async function refreshDispatcherData() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["dispatcher-dashboard"] }),
      queryClient.invalidateQueries({ queryKey: ["dispatcher-trips"] }),
    ]);
  }

  const arrivedMutation = useMutation({
    mutationFn: async ({ tripId, token }: { tripId: string; token: string }) => {
      const response = await api.post(`/dispatcher/trips/${tripId}/verify-arrival`, { token });
      return response.data;
    },
    onSuccess: async () => {
      setQrScanningTripId(null);
      await refreshDispatcherData();
    },
  });

  if (dashboardQuery.isLoading || tripsQuery.isLoading) {
    return (
      <div className="min-h-dvh bg-gradient-to-b from-blue-50/60 via-gray-50 to-gray-50 p-6 dark:from-slate-900 dark:via-slate-950 dark:to-slate-950">
        <div className="flex items-center gap-3 rounded-2xl bg-white p-6 text-gray-600 shadow-sm dark:bg-slate-900 dark:text-slate-300">
          <SpinnerIcon className="h-5 w-5 text-blue-600" />
          Loading dispatcher console...
        </div>
      </div>
    );
  }

  if (dashboardQuery.isError || tripsQuery.isError) {
    return (
      <div className="min-h-dvh bg-gradient-to-b from-blue-50/60 via-gray-50 to-gray-50 p-6 dark:from-slate-900 dark:via-slate-950 dark:to-slate-950">
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700 shadow-sm dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          <AlertIcon />
          <div className="flex-1">
            <h2 className="font-semibold">Unable to load dispatcher operations.</h2>
            <p className="mt-1 text-sm text-red-600 dark:text-red-300">
              Verify that the API is running on http://localhost:3001.
            </p>
            <button
              type="button"
              onClick={() => void refreshDispatcherData()}
              className="mt-4 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const dashboard = dashboardQuery.data;
  const trips = Array.isArray(tripsQuery.data) ? tripsQuery.data : [];
  const arrivalError = getApiErrorMessage(arrivedMutation.error);

  return (
    <div className="min-h-dvh space-y-6 bg-gradient-to-b from-blue-50/60 via-gray-50 to-gray-50 p-6 dark:from-slate-900 dark:via-slate-950 dark:to-slate-950">
      {/* HEADER */}
      <section className="rounded-2xl border border-blue-100/70 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 shadow-sm ring-1 ring-blue-100 dark:bg-blue-950/40 dark:text-blue-300 dark:ring-blue-900">
              <DispatchIcon />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl dark:text-white">
                Dispatcher Console
              </h1>
              <p className="mt-1 text-sm text-gray-500 sm:text-base dark:text-slate-400">
                Verify arriving vehicles and monitor terminal operations.
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={() => navigate("/commuter")}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
                <path d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h10.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
              </svg>
              View Live Commuter Map
            </button>
            <div className="flex items-center justify-center gap-1.5 rounded-xl bg-blue-50 px-3.5 py-2 text-sm font-medium text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
              <RefreshIcon />
              Auto-refresh: 5s
            </div>
          </div>
        </div>
      </section>

      {/* SUMMARY */}
      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard title="Waiting" value={dashboard?.waiting ?? 0} accent="gray" />
        <SummaryCard title="Boarding" value={dashboard?.boarding ?? 0} accent="blue" />
        <SummaryCard title="Departed" value={dashboard?.departed ?? 0} accent="green" />
        <SummaryCard title="Completed" value={dashboard?.completed ?? 0} accent="emerald" />
      </section>

      {/* TERMINAL OPERATIONS */}
      <section className="overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-slate-900">
        <div className="border-b border-gray-100 p-6 dark:border-slate-800">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Terminal Operations</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">Vehicle arrivals and current trip status.</p>
        </div>

        {trips.length === 0 ? (
          <div className="p-10 text-center">
            <EmptyTrayIcon />
            <div className="mt-4 text-lg font-medium text-gray-700 dark:text-slate-300">No trips currently requiring terminal attention.</div>
            <div className="mt-2 text-sm text-gray-500 dark:text-slate-400">Approaching vehicles will appear here automatically.</div>
          </div>
        ) : (
          <>
            {/* Mobile Cards (visible only on small screens) */}
            <div className="space-y-4 p-4 md:hidden">
              {trips.map((trip) => (
                <MobileTripCard
                  key={trip.id}
                  trip={trip}
                  isScanning={qrScanningTripId === trip.id}
                  isArriving={arrivedMutation.isPending && arrivedMutation.variables?.tripId === trip.id}
                  arrivalError={arrivalError}
                  onStartScan={() => setQrScanningTripId(trip.id)}
                  onVerify={(token) => arrivedMutation.mutate({ tripId: trip.id, token })}
                  onCancelScan={() => setQrScanningTripId(null)}
                />
              ))}
            </div>

            {/* Desktop Table (hidden on small screens) */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[1250px] text-left">
                <thead>
                  <tr className="border-b border-gray-100 text-sm text-gray-500 dark:border-slate-800 dark:text-slate-400">
                    <th className="p-4 font-medium">Queue</th>
                    <th className="p-4 font-medium">Trip</th>
                    <th className="p-4 font-medium">Direction</th>
                    <th className="p-4 font-medium">Driver</th>
                    <th className="p-4 font-medium">Vehicle</th>
                    <th className="p-4 font-medium">Seats</th>
                    <th className="p-4 font-medium">Status</th>
                    <th className="p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {trips.map((trip) => {
                    const currentLeg = getCurrentLeg(trip);
                    const queuePosition =
                      currentLeg?.queueEntries?.find((entry) => entry.status === "WAITING" || entry.status === "BOARDING")?.queuePosition ??
                      trip.terminalQueuePosition ??
                      "-";
                    const isScanning = qrScanningTripId === trip.id;
                    const isArriving = arrivedMutation.isPending && arrivedMutation.variables?.tripId === trip.id;
                    const verificationToken = currentLeg?.terminalVerificationToken ?? null;

                    return (
                      <tr key={trip.id} className="border-b border-gray-100 align-top transition-colors hover:bg-gray-50 dark:border-slate-800 dark:hover:bg-slate-800/50">
                        <td className="p-4">
                          <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700 dark:bg-slate-800 dark:text-slate-300">
                            #{queuePosition}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="font-semibold text-gray-900 dark:text-white">{trip.tripNumber ?? "-"}</div>
                          <div className="mt-1 text-xs text-gray-500 dark:text-slate-400">{getRouteName(trip)}</div>
                        </td>
                        <td className="p-4">
                          <span className="text-sm font-medium text-gray-700 dark:text-slate-300">{trip.direction ?? "-"}</span>
                        </td>
                        <td className="p-4">
                          <div className="font-medium text-gray-900 dark:text-white">{getDriverName(trip)}</div>
                        </td>
                        <td className="p-4">
                          <div className="font-medium text-gray-900 dark:text-white">{trip.vehicle?.plateNumber ?? "-"}</div>
                          <div className="mt-1 text-xs text-gray-500 dark:text-slate-400">{getVehicleName(trip)}</div>
                        </td>
                        <td className="p-4">
                          <div className="text-sm text-gray-700 dark:text-slate-300">{trip.seatCapacity ?? "-"} seats</div>
                          {typeof trip.availableSeats === "number" && (trip.status === "BOARDING" || trip.status === "DOCKED") && (
                            <div className="mt-1 text-xs text-gray-500 dark:text-slate-400">{trip.availableSeats} available</div>
                          )}
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${getStatusClass(trip.status)}`}>
                            {trip.status}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="min-w-[380px] space-y-3">
                            {/* Same action content as before, but kept for desktop */}
                            {trip.status === "APPROACHING" && (
                              <>
                                {!isScanning && (
                                  <div className="rounded-xl border border-orange-100 bg-orange-50 p-3 text-sm text-orange-800 dark:border-orange-900/50 dark:bg-orange-950/30 dark:text-orange-300">
                                    Driver is approaching the terminal. Scan the driver-issued terminal verification QR.
                                  </div>
                                )}
                                {!verificationToken && !isScanning && (
                                  <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
                                    <AlertIcon />
                                    <span>No active terminal verification QR was issued for this trip.</span>
                                  </div>
                                )}
                                {isScanning ? (
                                  verificationToken ? (
                                    <VehicleQrScanner
                                      expectedQrToken={verificationToken}
                                      onVerified={() => {
                                        arrivedMutation.mutate({ tripId: trip.id, token: verificationToken });
                                      }}
                                      onCancel={() => setQrScanningTripId(null)}
                                    />
                                  ) : (
                                    <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
                                      This trip has no active terminal verification QR. Refresh and try again.
                                    </div>
                                  )
                                ) : (
                                  <button
                                    type="button"
                                    disabled={isArriving || !verificationToken}
                                    onClick={() => setQrScanningTripId(trip.id)}
                                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    {isArriving ? <SpinnerIcon className="h-4 w-4" /> : <QrIcon />}
                                    {isArriving ? "Verifying..." : "Scan Terminal QR"}
                                  </button>
                                )}
                                {arrivalError && (
                                  <div className="flex items-start gap-2 rounded-xl bg-red-100 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
                                    <AlertIcon />
                                    <span>{arrivalError}</span>
                                  </div>
                                )}
                              </>
                            )}
                            {trip.status === "DOCKED" && (
                              <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900/50 dark:bg-yellow-950/30">
                                <div className="font-medium text-yellow-900 dark:text-yellow-200">Vehicle at terminal</div>
                                <div className="mt-1 text-sm text-yellow-800 dark:text-yellow-300">Driver controls passenger boarding.</div>
                              </div>
                            )}
                            {trip.status === "BOARDING" && (
                              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-900/50 dark:bg-blue-950/30">
                                <div className="font-medium text-blue-900 dark:text-blue-200">Driver is boarding passengers.</div>
                                <div className="mt-1 text-sm text-blue-800 dark:text-blue-300">Passenger and seat operations are handled by the driver.</div>
                              </div>
                            )}
                            {trip.status === "EN_ROUTE" && (
                              <div className="rounded-xl border border-purple-200 bg-purple-50 p-4 dark:border-purple-900/50 dark:bg-purple-950/30">
                                <div className="font-medium text-purple-900 dark:text-purple-200">Vehicle is en route.</div>
                                <div className="mt-1 text-sm text-purple-800 dark:text-purple-300">Waiting for the driver to report approaching the terminal.</div>
                              </div>
                            )}
                            {trip.status === "WAITING" && (
                              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
                                <div className="font-medium text-gray-800 dark:text-slate-200">Waiting for driver.</div>
                                <div className="mt-1 text-sm text-gray-500 dark:text-slate-400">No dispatcher action is required here.</div>
                              </div>
                            )}
                            {trip.status === "DEPARTED" && (
                              <div className="rounded-xl border border-green-200 bg-green-50 p-4 dark:border-green-900/50 dark:bg-green-950/30">
                                <div className="font-medium text-green-900 dark:text-green-200">Vehicle departed.</div>
                                <div className="mt-1 text-sm text-green-800 dark:text-green-300">No boarding or departure action is required here.</div>
                              </div>
                            )}
                            {trip.status === "COMPLETED" && (
                              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/30">
                                <div className="font-medium text-emerald-900 dark:text-emerald-200">Trip completed.</div>
                                <div className="mt-1 text-sm text-emerald-800 dark:text-emerald-300">{formatDate(trip.completedAt)}</div>
                              </div>
                            )}
                            {trip.status === "CANCELLED" && (
                              <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-950/30">
                                <div className="font-medium text-red-900 dark:text-red-200">Trip cancelled.</div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      <p className="pt-2 text-center text-xs text-gray-400 dark:text-slate-500">
        Provincial Integrated Transport Terminal · Virac, Catanduanes
      </p>
    </div>
  );
}

// ============================================================
// MOBILE TRIP CARD (for small screens)
// ============================================================

function MobileTripCard({
  trip,
  isScanning,
  isArriving,
  arrivalError,
  onStartScan,
  onVerify,
  onCancelScan,
}: {
  trip: Trip;
  isScanning: boolean;
  isArriving: boolean;
  arrivalError: string | null;
  onStartScan: () => void;
  onVerify: (token: string) => void;
  onCancelScan: () => void;
}) {
  const currentLeg = getCurrentLeg(trip);
  const queuePosition =
    currentLeg?.queueEntries?.find((entry) => entry.status === "WAITING" || entry.status === "BOARDING")?.queuePosition ??
    trip.terminalQueuePosition ??
    "-";
  const verificationToken = currentLeg?.terminalVerificationToken ?? null;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800/50">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700 dark:bg-slate-700 dark:text-slate-300">
              #{queuePosition}
            </span>
            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClass(trip.status)}`}>
              {trip.status}
            </span>
          </div>
          <h3 className="mt-2 font-semibold text-gray-900 dark:text-white">{trip.tripNumber ?? "-"}</h3>
          <p className="text-sm text-gray-500 dark:text-slate-400">{getRouteName(trip)}</p>
        </div>
        {trip.vehicle?.plateNumber && (
          <div className="text-right">
            <div className="font-medium text-gray-900 dark:text-white">{trip.vehicle.plateNumber}</div>
            <div className="text-xs text-gray-500 dark:text-slate-400">{getVehicleName(trip)}</div>
          </div>
        )}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <div>
          <span className="text-gray-500 dark:text-slate-400">Driver:</span>{" "}
          <span className="font-medium text-gray-900 dark:text-white">{getDriverName(trip)}</span>
        </div>
        <div>
          <span className="text-gray-500 dark:text-slate-400">Seats:</span>{" "}
          <span className="font-medium text-gray-900 dark:text-white">
            {trip.seatCapacity ?? "-"}
            {typeof trip.availableSeats === "number" && (trip.status === "BOARDING" || trip.status === "DOCKED")
              ? ` (${trip.availableSeats} avail.)`
              : ""}
          </span>
        </div>
      </div>

      <div className="mt-3">
        {/* Same action content as desktop, but condensed */}
        {trip.status === "APPROACHING" && (
          <>
            {!isScanning && (
              <div className="rounded-lg border border-orange-100 bg-orange-50 p-3 text-sm text-orange-800 dark:border-orange-900/50 dark:bg-orange-950/30 dark:text-orange-300">
                Driver is approaching the terminal. Scan the terminal verification QR.
              </div>
            )}
            {!verificationToken && !isScanning && (
              <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
                <AlertIcon />
                <span>No active terminal verification QR issued.</span>
              </div>
            )}
            {isScanning ? (
              verificationToken ? (
                <VehicleQrScanner
                  expectedQrToken={verificationToken}
                  onVerified={() => onVerify(verificationToken)}
                  onCancel={onCancelScan}
                />
              ) : (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
                  This trip has no active terminal verification QR. Refresh and try again.
                </div>
              )
            ) : (
              <button
                type="button"
                disabled={isArriving || !verificationToken}
                onClick={onStartScan}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isArriving ? <SpinnerIcon className="h-4 w-4" /> : <QrIcon />}
                {isArriving ? "Verifying..." : "Scan Terminal QR"}
              </button>
            )}
            {arrivalError && (
              <div className="mt-2 flex items-start gap-2 rounded-lg bg-red-100 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
                <AlertIcon />
                <span>{arrivalError}</span>
              </div>
            )}
          </>
        )}

        {trip.status === "DOCKED" && (
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-900/50 dark:bg-yellow-950/30">
            <div className="font-medium text-yellow-900 dark:text-yellow-200">Vehicle at terminal</div>
            <div className="mt-1 text-sm text-yellow-800 dark:text-yellow-300">Driver controls passenger boarding.</div>
          </div>
        )}

        {trip.status === "BOARDING" && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-900/50 dark:bg-blue-950/30">
            <div className="font-medium text-blue-900 dark:text-blue-200">Driver is boarding passengers.</div>
            <div className="mt-1 text-sm text-blue-800 dark:text-blue-300">Passenger and seat operations are handled by the driver.</div>
          </div>
        )}

        {trip.status === "EN_ROUTE" && (
          <div className="rounded-lg border border-purple-200 bg-purple-50 p-3 dark:border-purple-900/50 dark:bg-purple-950/30">
            <div className="font-medium text-purple-900 dark:text-purple-200">Vehicle is en route.</div>
            <div className="mt-1 text-sm text-purple-800 dark:text-purple-300">Waiting for the driver to report approaching the terminal.</div>
          </div>
        )}

        {trip.status === "WAITING" && (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-slate-700 dark:bg-slate-800/50">
            <div className="font-medium text-gray-800 dark:text-slate-200">Waiting for driver.</div>
            <div className="mt-1 text-sm text-gray-500 dark:text-slate-400">No dispatcher action is required here.</div>
          </div>
        )}

        {trip.status === "DEPARTED" && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-900/50 dark:bg-green-950/30">
            <div className="font-medium text-green-900 dark:text-green-200">Vehicle departed.</div>
            <div className="mt-1 text-sm text-green-800 dark:text-green-300">No boarding or departure action is required here.</div>
          </div>
        )}

        {trip.status === "COMPLETED" && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-900/50 dark:bg-emerald-950/30">
            <div className="font-medium text-emerald-900 dark:text-emerald-200">Trip completed.</div>
            <div className="mt-1 text-sm text-emerald-800 dark:text-emerald-300">{formatDate(trip.completedAt)}</div>
          </div>
        )}

        {trip.status === "CANCELLED" && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900/50 dark:bg-red-950/30">
            <div className="font-medium text-red-900 dark:text-red-200">Trip cancelled.</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// SUMMARY CARD
// ============================================================

function SummaryCard({
  title,
  value,
  accent = "gray",
}: {
  title: string;
  value: number;
  accent?: "gray" | "blue" | "green" | "emerald";
}) {
  const accentClasses: Record<string, string> = {
    gray: "bg-gray-100 dark:bg-slate-800",
    blue: "bg-blue-100 dark:bg-blue-950/40",
    green: "bg-green-100 dark:bg-green-950/40",
    emerald: "bg-emerald-100 dark:bg-emerald-950/40",
  };

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-500 dark:text-slate-400">{title}</p>
        <span className={`h-2.5 w-2.5 rounded-full ${accentClasses[accent]}`} />
      </div>
      <h2 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{value}</h2>
    </div>
  );
}