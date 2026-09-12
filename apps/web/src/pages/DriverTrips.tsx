// apps/web/src/pages/DriverTrips.tsx

import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getMyDriverTrips, markMyTripApproaching, markMyTripEnRoute } from "../api/driver.api";

type DriverTrip = {
  id: string;
  tripNumber: string;
  direction?: string;
  status: string;
  seatCapacity?: number;
  availableSeats?: number;
  startedAt?: string | null;
  boardingStartedAt?: string | null;
  departedAt?: string | null;
  arrivedAt?: string | null;
  completedAt?: string | null;
  estimatedArrival?: string | null;
  createdAt?: string | null;
  vehicle?: {
    plateNumber?: string;
    make?: string;
    model?: string;
  };
  route?: {
    origin?: { name?: string };
    destination?: { name?: string };
  };
  municipality?: { name?: string };
};

type ApiError = {
  response?: { data?: { message?: string | string[] } | string };
  message?: string;
};

function getErrorMessage(error: unknown): string | null {
  if (typeof error !== "object" || error === null) return null;
  const value = error as ApiError;
  const responseData = value.response?.data;
  if (typeof responseData === "string") return responseData;
  if (responseData && typeof responseData === "object") {
    const message = responseData.message;
    if (Array.isArray(message)) return message.join(", ");
    if (typeof message === "string") return message;
  }
  if (typeof value.message === "string") return value.message;
  return null;
}

function formatDate(value?: string | null): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
}

function getVehicleName(trip: DriverTrip): string {
  const make = trip.vehicle?.make ?? "";
  const model = trip.vehicle?.model ?? "";
  const value = `${make} ${model}`.trim();
  return value || "-";
}

function getRouteName(trip: DriverTrip): string {
  const origin = trip.route?.origin?.name ?? "-";
  const destination = trip.route?.destination?.name ?? "-";
  return `${origin} → ${destination}`;
}

function getBoardedCount(trip: DriverTrip): number {
  const capacity = trip.seatCapacity ?? 0;
  const available = trip.availableSeats ?? 0;
  return Math.max(0, capacity - available);
}

function getStatusClass(status: string): string {
  const classes: Record<string, string> = {
    WAITING: "bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-slate-300",
    EN_ROUTE: "bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300",
    APPROACHING: "bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300",
    DOCKED: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-300",
    BOARDING: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
    DEPARTED: "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300",
    COMPLETED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
    CANCELLED: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300",
  };
  return classes[status] ?? "bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-slate-300";
}

function getStatusLabel(status: string): string {
  return status === "DOCKED" ? "ARRIVED" : status;
}

export default function DriverTrips() {
  const queryClient = useQueryClient();

  const { data, isLoading, isError, refetch, isFetching } = useQuery<DriverTrip[]>({
    queryKey: ["driver-my-trips"],
    queryFn: getMyDriverTrips as any,
    refetchInterval: 10_000,
  });

  const trips = Array.isArray(data) ? data : [];

  const activeTrips = useMemo(
    () => trips.filter((trip) => trip.status !== "COMPLETED" && trip.status !== "CANCELLED"),
    [trips],
  );

  const completedTrips = useMemo(
    () => trips.filter((trip) => trip.status === "COMPLETED"),
    [trips],
  );

  const enRouteMutation = useMutation({
    mutationFn: markMyTripEnRoute,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["driver-my-trips"] });
      await queryClient.invalidateQueries({ queryKey: ["driver-trips"] });
    },
  });

  const approachingMutation = useMutation({
    mutationFn: markMyTripApproaching,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["driver-my-trips"] });
      await queryClient.invalidateQueries({ queryKey: ["driver-trips"] });
    },
  });

  const actionError =
    getErrorMessage(enRouteMutation.error) ?? getErrorMessage(approachingMutation.error);

  if (isLoading) {
    return (
      <div className="p-3 sm:p-6">
        <div className="rounded-xl bg-white p-5 text-sm shadow-sm sm:p-6 sm:text-base dark:bg-slate-900 dark:text-slate-300">
          Loading your trips...
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-3 sm:p-6">
        <div className="rounded-xl bg-red-50 p-4 text-red-700 sm:p-5 dark:bg-red-950/30 dark:text-red-300">
          <h2 className="font-semibold">Unable to load your trips.</h2>
          <p className="mt-2 text-sm">Please verify that the driver service is available.</p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="mt-4 w-full rounded-lg bg-red-600 px-4 py-3 text-sm font-medium text-white hover:bg-red-700 active:bg-red-800 sm:w-auto sm:py-2"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* HEADER */}
      <div className="rounded-xl bg-white p-4 shadow-sm sm:p-6 dark:bg-slate-900">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl dark:text-white">My Trips</h1>
            <p className="mt-2 text-sm text-gray-500 sm:text-base dark:text-slate-400">
              View your assigned trips and manage your trip progress.
            </p>
          </div>
          <button
            type="button"
            disabled={isFetching}
            onClick={() => void refetch()}
            className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 active:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:py-2 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            {isFetching ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* SUMMARY */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <SummaryCard label="Total Trips" value={trips.length} />
        <SummaryCard label="Active Trips" value={activeTrips.length} />
        <SummaryCard label="Completed" value={completedTrips.length} />
        <SummaryCard label="Current" value={activeTrips.length > 0 ? 1 : 0} />
      </div>

      {/* ACTION ERROR */}
      {actionError && (
        <div className="rounded-lg bg-red-100 p-4 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
          {actionError}
        </div>
      )}

      {/* ACTIVE */}
      <section className="overflow-hidden rounded-xl bg-white shadow-sm dark:bg-slate-900">
        <div className="border-b border-gray-200 p-4 sm:p-6 dark:border-slate-800">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-gray-900 sm:text-xl dark:text-white">Active Trips</h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                Trips that still require driver operations.
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
              {activeTrips.length}
            </span>
          </div>
        </div>

        {activeTrips.length === 0 ? (
          <EmptyState title="No active trips" description="You currently have no active assigned trips." />
        ) : (
          <ActiveTripList
            trips={activeTrips}
            enRoutePending={enRouteMutation.isPending}
            enRouteTripId={enRouteMutation.variables}
            approachingPending={approachingMutation.isPending}
            approachingTripId={approachingMutation.variables}
            onStartTrip={(tripId) => enRouteMutation.mutate(tripId)}
            onMarkApproaching={(tripId) => approachingMutation.mutate(tripId)}
          />
        )}
      </section>

      {/* COMPLETED */}
      <section className="overflow-hidden rounded-xl bg-white shadow-sm dark:bg-slate-900">
        <div className="border-b border-gray-200 p-4 sm:p-6 dark:border-slate-800">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-gray-900 sm:text-xl dark:text-white">Completed Trips</h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                Your completed trip history.
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
              {completedTrips.length}
            </span>
          </div>
        </div>

        {completedTrips.length === 0 ? (
          <EmptyState
            title="No completed trips"
            description="Completed trips will appear here after your trips are finished."
          />
        ) : (
          <>
            <div className="space-y-4 p-4 md:hidden">
              {completedTrips.map((trip) => (
                <CompletedTripCard key={trip.id} trip={trip} />
              ))}
            </div>
            <div className="hidden md:block">
              <TripTable trips={completedTrips} historical />
            </div>
          </>
        )}
      </section>
    </div>
  );
}

// ... (all subcomponents remain the same as previously provided, with adjustments for optional fields)

function ActiveTripList({
  trips,
  enRoutePending,
  enRouteTripId,
  approachingPending,
  approachingTripId,
  onStartTrip,
  onMarkApproaching,
}: {
  trips: DriverTrip[];
  enRoutePending: boolean;
  enRouteTripId?: string;
  approachingPending: boolean;
  approachingTripId?: string;
  onStartTrip: (tripId: string) => void;
  onMarkApproaching: (tripId: string) => void;
}) {
  return (
    <div className="divide-y divide-gray-100 dark:divide-slate-800">
      {trips.map((trip) => {
        const isStarting = enRoutePending && enRouteTripId === trip.id;
        const isApproaching = approachingPending && approachingTripId === trip.id;

        return (
          <div key={trip.id} className="p-4 sm:p-6">
            <div className="flex flex-col gap-4 sm:gap-5 xl:flex-row xl:items-start xl:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-bold text-gray-900 sm:text-xl dark:text-white">{trip.tripNumber}</h3>
                  <StatusBadge status={trip.status} />
                </div>
                <div className="mt-2 text-gray-600 dark:text-slate-300">{getRouteName(trip)}</div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <InfoCard
                    label="Vehicle"
                    value={trip.vehicle?.plateNumber ?? "-"}
                    secondary={getVehicleName(trip)}
                  />
                  <InfoCard label="Capacity" value={String(trip.seatCapacity ?? "-")} />
                  <InfoCard label="Available" value={String(trip.availableSeats ?? "-")} />
                  <InfoCard label="ETA" value={formatDate(trip.estimatedArrival)} />
                </div>
              </div>

              <div className="flex w-full flex-col gap-2 xl:w-auto xl:min-w-[230px]">
                {trip.status === "WAITING" && (
                  <button
                    type="button"
                    disabled={isStarting || enRoutePending}
                    onClick={() => onStartTrip(trip.id)}
                    className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 active:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isStarting ? "Starting..." : "Start Trip"}
                  </button>
                )}

                {trip.status === "EN_ROUTE" && (
                  <button
                    type="button"
                    disabled={isApproaching || approachingPending}
                    onClick={() => onMarkApproaching(trip.id)}
                    className="w-full rounded-lg bg-orange-500 px-4 py-3 text-sm font-semibold text-white hover:bg-orange-600 active:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isApproaching ? "Updating..." : "Mark Approaching"}
                  </button>
                )}

                {trip.status === "APPROACHING" && (
                  <div className="rounded-lg bg-yellow-100 p-3 text-sm font-medium text-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-300">
                    Approaching terminal. Waiting for dispatcher arrival processing.
                  </div>
                )}

                {trip.status === "DOCKED" && (
                  <div className="rounded-lg bg-yellow-100 p-3 text-sm font-medium text-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-300">
                    Arrived at terminal. Dispatcher controls boarding.
                  </div>
                )}

                {trip.status === "BOARDING" && (
                  <div className="rounded-lg bg-blue-100 p-3 text-sm font-medium text-blue-800 dark:bg-blue-950/40 dark:text-blue-300">
                    Passenger boarding is currently in progress.
                  </div>
                )}
              </div>
            </div>

            <div className="mt-5 border-t border-gray-100 pt-4 dark:border-slate-800">
              <div className="grid gap-2 text-xs text-gray-500 dark:text-slate-400 sm:grid-cols-2 lg:grid-cols-4">
                <TimelineItem label="Created" value={trip.createdAt} />
                <TimelineItem label="Started" value={trip.startedAt} />
                <TimelineItem label="Arrived" value={trip.arrivedAt} />
                <TimelineItem label="Boarding" value={trip.boardingStartedAt} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TripTable({ trips, historical = false }: { trips: DriverTrip[]; historical?: boolean }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1100px] text-left">
        {/* table content same as before, use trip.seatCapacity ?? 0 */}
        <thead>
          <tr className="border-b border-gray-200 text-sm text-gray-500 dark:border-slate-800 dark:text-slate-400">
            <th className="p-4">Trip</th>
            <th className="p-4">Route</th>
            <th className="p-4">Vehicle</th>
            <th className="p-4">Seats</th>
            <th className="p-4">Status</th>
            <th className="p-4">Timeline</th>
            <th className="p-4">{historical ? "Completed" : "ETA"}</th>
          </tr>
        </thead>
        <tbody>
          {trips.map((trip) => {
            const boarded = getBoardedCount(trip);
            return (
              <tr key={trip.id} className="border-b border-gray-100 hover:bg-gray-50 dark:border-slate-800 dark:hover:bg-slate-800/50">
                <td className="p-4">
                  <div className="font-semibold text-gray-900 dark:text-white">{trip.tripNumber}</div>
                  <div className="mt-1 text-xs text-gray-500 dark:text-slate-400">{trip.direction ?? "-"}</div>
                </td>
                <td className="p-4 text-gray-700 dark:text-slate-300">{getRouteName(trip)}</td>
                <td className="p-4">
                  <div className="font-medium text-gray-900 dark:text-white">{trip.vehicle?.plateNumber ?? "-"}</div>
                  <div className="mt-1 text-xs text-gray-500 dark:text-slate-400">{getVehicleName(trip)}</div>
                </td>
                <td className="p-4">
                  <div className="font-medium text-gray-900 dark:text-white">{boarded} boarded</div>
                  <div className="mt-1 text-xs text-gray-500 dark:text-slate-400">{trip.seatCapacity ?? "-"} capacity</div>
                </td>
                <td className="p-4">
                  <StatusBadge status={trip.status} />
                </td>
                <td className="p-4">
                  <div className="min-w-[220px] space-y-1 text-xs text-gray-500 dark:text-slate-400">
                    <TimelineItem label="Created" value={trip.createdAt} />
                    <TimelineItem label="Arrived" value={trip.arrivedAt} />
                    <TimelineItem label="Boarding" value={trip.boardingStartedAt} />
                    <TimelineItem label="Departed" value={trip.departedAt} />
                    <TimelineItem label="Completed" value={trip.completedAt} />
                  </div>
                </td>
                <td className="p-4 text-gray-700 dark:text-slate-300">
                  {formatDate(historical ? trip.completedAt : trip.estimatedArrival)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function CompletedTripCard({ trip }: { trip: DriverTrip }) {
  const boarded = getBoardedCount(trip);
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800/50">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-semibold text-gray-900 dark:text-white">{trip.tripNumber}</h3>
          <p className="truncate text-sm text-gray-500 dark:text-slate-400">{getRouteName(trip)}</p>
        </div>
        <StatusBadge status={trip.status} />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <div>
          <span className="text-gray-500 dark:text-slate-400">Vehicle:</span>{" "}
          <span className="font-medium text-gray-900 dark:text-white">{trip.vehicle?.plateNumber ?? "-"}</span>
        </div>
        <div>
          <span className="text-gray-500 dark:text-slate-400">Seats:</span>{" "}
          <span className="font-medium text-gray-900 dark:text-white">{boarded}/{trip.seatCapacity ?? "-"}</span>
        </div>
        <div>
          <span className="text-gray-500 dark:text-slate-400">Completed:</span>{" "}
          <span className="font-medium text-gray-900 dark:text-white">{formatDate(trip.completedAt)}</span>
        </div>
        <div>
          <span className="text-gray-500 dark:text-slate-400">Direction:</span>{" "}
          <span className="font-medium text-gray-900 dark:text-white">{trip.direction ?? "-"}</span>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm sm:p-5 dark:bg-slate-900">
      <div className="truncate text-xs text-gray-500 sm:text-sm dark:text-slate-400">{label}</div>
      <div className="mt-2 text-xl font-bold text-gray-900 sm:text-2xl dark:text-white">{value}</div>
    </div>
  );
}

function InfoCard({ label, value, secondary }: { label: string; value: string; secondary?: string }) {
  return (
    <div className="min-w-0 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
      <div className="text-xs text-gray-500 dark:text-slate-400">{label}</div>
      <div className="mt-1 truncate font-semibold text-gray-900 dark:text-white">{value}</div>
      {secondary && <div className="mt-1 truncate text-xs text-gray-500 dark:text-slate-400">{secondary}</div>}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getStatusClass(status)}`}>
      {getStatusLabel(status)}
    </span>
  );
}

function TimelineItem({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <span className="font-medium text-gray-700 dark:text-slate-300">{label}:</span>{" "}
      {formatDate(value)}
    </div>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="p-10 text-center">
      <h3 className="text-lg font-medium text-gray-700 dark:text-slate-300">{title}</h3>
      <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">{description}</p>
    </div>
  );
}
