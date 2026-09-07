
// apps/web/src/pages/DispatcherTrips.tsx

import {
  useMemo,
} from "react";

import {
  useQuery,
} from "@tanstack/react-query";

import {
  getIncomingTrips,
} from "../api/dispatcher.api";


// ============================================================
// TYPES
// ============================================================

type DispatcherTrip = {
  id: string;

  tripNumber?: string;

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

  driver?: {
    user?: {
      displayName?: string;
      firstName?: string;
      lastName?: string;
    };
  };

  vehicle?: {
    plateNumber?: string;
    make?: string;
    model?: string;
  };

  route?: {
    origin?: {
      id?: string;
      name?: string;
    };

    destination?: {
      id?: string;
      name?: string;
    };
  };

  municipality?: {
    id?: string;
    name?: string;
  };

  queueEntries?: Array<{
    id: string;
    queuePosition: number;
    status: string;
  }>;
};


// ============================================================
// HELPERS
// ============================================================

function getDriverName(
  trip: DispatcherTrip,
): string {
  const displayName =
    trip.driver?.user?.displayName;

  if (
    typeof displayName === "string" &&
    displayName.trim().length > 0
  ) {
    return displayName;
  }

  const firstName =
    trip.driver?.user?.firstName ?? "";

  const lastName =
    trip.driver?.user?.lastName ?? "";

  const value =
    `${firstName} ${lastName}`.trim();

  return value || "-";
}


function getVehicleName(
  trip: DispatcherTrip,
): string {
  const make =
    trip.vehicle?.make ?? "";

  const model =
    trip.vehicle?.model ?? "";

  const value =
    `${make} ${model}`.trim();

  return value || "-";
}


function getRouteName(
  trip: DispatcherTrip,
): string {
  const origin =
    trip.route?.origin?.name ?? "-";

  const destination =
    trip.route?.destination?.name ?? "-";

  return `${origin} → ${destination}`;
}


function getBoardedCount(
  trip: DispatcherTrip,
): number {
  if (
    typeof trip.seatCapacity !== "number" ||
    typeof trip.availableSeats !== "number"
  ) {
    return 0;
  }

  return Math.max(
    0,
    trip.seatCapacity -
      trip.availableSeats,
  );
}


function formatDate(
  value?: string | null,
): string {
  if (!value) {
    return "-";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "-";
  }

  return date.toLocaleString();
}


function getStageLabel(
  trip: DispatcherTrip,
): string {
  switch (trip.status) {
    case "WAITING":
      return "Waiting";

    case "EN_ROUTE":
      return "En Route";

    case "APPROACHING":
      return "Approaching";

    case "DOCKED":
      return "Arrived";

    case "BOARDING":
      return "Boarding";

    case "DEPARTED":
      return "Departed";

    case "COMPLETED":
      return "Completed";

    case "CANCELLED":
      return "Cancelled";

    default:
      return trip.status;
  }
}


// ============================================================
// STATUS BADGE
// ============================================================

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const colors: Record<
    string,
    string
  > = {
    WAITING:
      "bg-gray-100 text-gray-700",

    EN_ROUTE:
      "bg-purple-100 text-purple-700",

    APPROACHING:
      "bg-orange-100 text-orange-700",

    DOCKED:
      "bg-yellow-100 text-yellow-700",

    BOARDING:
      "bg-blue-100 text-blue-700",

    DEPARTED:
      "bg-green-100 text-green-700",

    COMPLETED:
      "bg-emerald-100 text-emerald-700",

    CANCELLED:
      "bg-red-100 text-red-700",
  };

  const className =
    colors[status] ??
    "bg-gray-100 text-gray-700";

  return (
    <span
      className={[
        "inline-flex",
        "rounded-full",
        "px-3",
        "py-1",
        "text-xs",
        "font-medium",
        className,
      ].join(" ")}
    >
      {getStageLabel({
        status,
      } as DispatcherTrip)}
    </span>
  );
}


// ============================================================
// SEAT DISPLAY
// ============================================================

function SeatDisplay({
  trip,
}: {
  trip: DispatcherTrip;
}) {
  const boarded =
    getBoardedCount(trip);

  const capacity =
    trip.seatCapacity ?? 0;

  const available =
    trip.availableSeats ?? 0;


  if (
    trip.status ===
    "COMPLETED"
  ) {
    return (
      <div>
        <div className="
          font-medium
          text-gray-900
        ">
          {boarded}
          {" boarded"}
        </div>

        <div className="
          mt-1
          text-xs
          text-gray-500
        ">
          {capacity}
          {" capacity"}
        </div>
      </div>
    );
  }


  if (
    trip.status ===
    "DEPARTED"
  ) {
    return (
      <div>
        <div className="
          font-medium
          text-gray-900
        ">
          {boarded}
          {" boarded"}
        </div>

        <div className="
          mt-1
          text-xs
          text-gray-500
        ">
          {capacity}
          {" capacity"}
        </div>
      </div>
    );
  }


  return (
    <div>
      <div className="
        font-medium
        text-gray-900
      ">
        {boarded}
        {" / "}
        {capacity}
      </div>

      <div className="
        mt-1
        text-xs
        text-gray-500
      ">
        {available}
        {" available"}
      </div>
    </div>
  );
}


// ============================================================
// MAIN
// ============================================================

export default function DispatcherTrips() {
  const {
    data,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useQuery<DispatcherTrip[]>({
    queryKey: [
      "dispatcher-trips-page",
    ],

    queryFn:
      getIncomingTrips,

    refetchInterval:
      10_000,
  });


  const trips =
    Array.isArray(data)
      ? data
      : [];


  const counts =
    useMemo(() => {
      let waiting = 0;
      let boarding = 0;
      let departed = 0;
      let completed = 0;
      let cancelled = 0;

      for (const trip of trips) {
        if (
          trip.status ===
          "WAITING"
        ) {
          waiting += 1;
        }

        if (
          trip.status ===
          "BOARDING"
        ) {
          boarding += 1;
        }

        if (
          trip.status ===
          "DEPARTED"
        ) {
          departed += 1;
        }

        if (
          trip.status ===
          "COMPLETED"
        ) {
          completed += 1;
        }

        if (
          trip.status ===
          "CANCELLED"
        ) {
          cancelled += 1;
        }
      }

      return {
        total: trips.length,
        waiting,
        boarding,
        departed,
        completed,
        cancelled,
      };
    }, [trips]);


  const activeTrips =
    useMemo(
      () =>
        trips.filter(
          (trip) =>
            trip.status !==
              "COMPLETED" &&
            trip.status !==
              "CANCELLED",
        ),
      [trips],
    );


  const completedTrips =
    useMemo(
      () =>
        trips.filter(
          (trip) =>
            trip.status ===
            "COMPLETED",
        ),
      [trips],
    );


  // ==========================================================
  // LOADING
  // ==========================================================

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="
          rounded-xl
          bg-white
          p-6
          shadow-sm
        ">
          Loading dispatcher trips...
        </div>
      </div>
    );
  }


  // ==========================================================
  // ERROR
  // ==========================================================

  if (isError) {
    return (
      <div className="p-6">
        <div className="
          rounded-xl
          bg-red-50
          p-5
          text-red-700
        ">
          <h2 className="
            font-semibold
          ">
            Unable to load dispatcher trips.
          </h2>

          <p className="
            mt-2
            text-sm
          ">
            The dispatcher trip service could
            not be reached.
          </p>

          <button
            type="button"
            onClick={() => {
              void refetch();
            }}
            className="
              mt-4
              rounded-lg
              bg-red-600
              px-4
              py-2
              text-sm
              font-medium
              text-white
              hover:bg-red-700
            "
          >
            Retry
          </button>
        </div>
      </div>
    );
  }


  return (
    <div className="
      space-y-6
    ">

      {/* =====================================================
          HEADER
      ====================================================== */}

      <div className="
        rounded-xl
        bg-white
        p-6
        shadow-sm
      ">

        <div className="
          flex
          flex-col
          gap-4
          md:flex-row
          md:items-center
          md:justify-between
        ">

          <div>

            <h1 className="
              text-3xl
              font-bold
              text-gray-900
            ">
              Trips
            </h1>

            <p className="
              mt-2
              text-gray-500
            ">
              Monitor dispatcher trip operations
              and current trip status.
            </p>

          </div>


          <div className="
            flex
            items-center
            gap-3
          ">

            <div className="
              rounded-lg
              bg-gray-50
              px-4
              py-2
              text-sm
              text-gray-500
            ">
              Auto-refresh: 10s
            </div>

            <button
              type="button"
              disabled={isFetching}
              onClick={() => {
                void refetch();
              }}
              className="
                rounded-lg
                border
                border-gray-200
                bg-white
                px-4
                py-2
                text-sm
                font-medium
                text-gray-700
                hover:bg-gray-50
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              {isFetching
                ? "Refreshing..."
                : "Refresh"}
            </button>

          </div>

        </div>

      </div>


      {/* =====================================================
          SUMMARY
      ====================================================== */}

      <div className="
        grid
        gap-4
        sm:grid-cols-2
        lg:grid-cols-5
      ">

        <MiniStat
          label="Total"
          value={
            counts.total
          }
        />

        <MiniStat
          label="Waiting"
          value={
            counts.waiting
          }
        />

        <MiniStat
          label="Boarding"
          value={
            counts.boarding
          }
        />

        <MiniStat
          label="Departed"
          value={
            counts.departed
          }
        />

        <MiniStat
          label="Completed"
          value={
            counts.completed
          }
        />

      </div>


      {/* =====================================================
          ACTIVE TRIPS
      ====================================================== */}

      <div className="
        overflow-hidden
        rounded-xl
        bg-white
        shadow-sm
      ">

        <div className="
          border-b
          p-6
        ">

          <div className="
            flex
            items-center
            justify-between
            gap-4
          ">

            <div>

              <h2 className="
                text-xl
                font-bold
                text-gray-900
              ">
                Active Trips
              </h2>

              <p className="
                mt-1
                text-sm
                text-gray-500
              ">
                Trips currently participating
                in terminal operations.
              </p>

            </div>

            <div className="
              rounded-full
              bg-blue-100
              px-3
              py-1
              text-sm
              font-medium
              text-blue-700
            ">
              {activeTrips.length}
            </div>

          </div>

        </div>


        {activeTrips.length === 0 ? (
          <EmptyState
            title="No active trips"
            description="There are currently no trips requiring terminal operations."
          />
        ) : (
          <TripTable
            trips={
              activeTrips
            }
          />
        )}

      </div>


      {/* =====================================================
          COMPLETED HISTORY
      ====================================================== */}

      <div className="
        overflow-hidden
        rounded-xl
        bg-white
        shadow-sm
      ">

        <div className="
          border-b
          p-6
        ">

          <div className="
            flex
            items-center
            justify-between
            gap-4
          ">

            <div>

              <h2 className="
                text-xl
                font-bold
                text-gray-900
              ">
                Completed Trip History
              </h2>

              <p className="
                mt-1
                text-sm
                text-gray-500
              ">
                Recently completed dispatcher trips.
              </p>

            </div>

            <div className="
              rounded-full
              bg-emerald-100
              px-3
              py-1
              text-sm
              font-medium
              text-emerald-700
            ">
              {completedTrips.length}
            </div>

          </div>

        </div>


        {completedTrips.length === 0 ? (
          <EmptyState
            title="No completed trips"
            description="Completed trips will appear here after the dispatcher marks them completed."
          />
        ) : (
          <TripTable
            trips={
              completedTrips
            }
          />
        )}

      </div>


      {/* =====================================================
          CANCELLED
      ====================================================== */}

      {counts.cancelled > 0 && (
        <div className="
          rounded-xl
          border
          border-red-200
          bg-red-50
          p-5
        ">

          <div className="
            flex
            items-center
            justify-between
            gap-4
          ">

            <div>

              <h2 className="
                font-semibold
                text-red-900
              ">
                Cancelled Trips
              </h2>

              <p className="
                mt-1
                text-sm
                text-red-700
              ">
                {counts.cancelled}
                {" "}
                cancelled trip
                {counts.cancelled === 1
                  ? ""
                  : "s"}
                {" "}
                are included in the current results.
              </p>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}


// ============================================================
// TRIP TABLE
// ============================================================

function TripTable({
  trips,
}: {
  trips: DispatcherTrip[];
}) {
  return (
    <div className="
      overflow-x-auto
    ">

      <table className="
        w-full
        min-w-[1200px]
        text-left
      ">

        <thead>

          <tr className="
            border-b
            text-sm
            text-gray-500
          ">

            <th className="p-4">
              Trip
            </th>

            <th className="p-4">
              Route
            </th>

            <th className="p-4">
              Driver
            </th>

            <th className="p-4">
              Vehicle
            </th>

            <th className="p-4">
              Seats
            </th>

            <th className="p-4">
              Status
            </th>

            <th className="p-4">
              Timeline
            </th>

          </tr>

        </thead>


        <tbody>

          {trips.map(
            (trip) => {

              return (
                <tr
                  key={
                    trip.id
                  }
                  className="
                    border-b
                    hover:bg-gray-50
                  "
                >

                  {/* TRIP */}

                  <td className="p-4">

                    <div className="
                      font-semibold
                      text-gray-900
                    ">
                      {
                        trip.tripNumber ??
                        "-"
                      }
                    </div>

                    <div className="
                      mt-1
                      text-xs
                      text-gray-500
                    ">
                      {
                        trip.direction ??
                        "-"
                      }
                    </div>

                  </td>


                  {/* ROUTE */}

                  <td className="p-4">

                    <div className="
                      font-medium
                      text-gray-900
                    ">
                      {
                        getRouteName(
                          trip,
                        )
                      }
                    </div>

                    {trip.municipality?.name && (
                      <div className="
                        mt-1
                        text-xs
                        text-gray-500
                      ">
                        {
                          trip.municipality.name
                        }
                      </div>
                    )}

                  </td>


                  {/* DRIVER */}

                  <td className="p-4">

                    {
                      getDriverName(
                        trip,
                      )
                    }

                  </td>


                  {/* VEHICLE */}

                  <td className="p-4">

                    <div className="
                      font-medium
                      text-gray-900
                    ">
                      {
                        trip.vehicle
                          ?.plateNumber ??
                        "-"
                      }
                    </div>

                    <div className="
                      mt-1
                      text-xs
                      text-gray-500
                    ">
                      {
                        getVehicleName(
                          trip,
                        )
                      }
                    </div>

                  </td>


                  {/* SEATS */}

                  <td className="p-4">

                    <SeatDisplay
                      trip={
                        trip
                      }
                    />

                  </td>


                  {/* STATUS */}

                  <td className="p-4">

                    <StatusBadge
                      status={
                        trip.status
                      }
                    />

                  </td>


                  {/* TIMELINE */}

                  <td className="p-4">

                    <Timeline
                      trip={
                        trip
                      }
                    />

                  </td>

                </tr>
              );
            },
          )}

        </tbody>

      </table>

    </div>
  );
}


// ============================================================
// TIMELINE
// ============================================================

function Timeline({
  trip,
}: {
  trip: DispatcherTrip;
}) {
  return (
    <div className="
      min-w-[220px]
      space-y-1
      text-xs
      text-gray-500
    ">

      {trip.createdAt && (
        <div>
          Created:{" "}
          {formatDate(
            trip.createdAt,
          )}
        </div>
      )}

      {trip.arrivedAt && (
        <div>
          Arrived:{" "}
          {formatDate(
            trip.arrivedAt,
          )}
        </div>
      )}

      {trip.boardingStartedAt && (
        <div>
          Boarding:{" "}
          {formatDate(
            trip.boardingStartedAt,
          )}
        </div>
      )}

      {trip.departedAt && (
        <div>
          Departed:{" "}
          {formatDate(
            trip.departedAt,
          )}
        </div>
      )}

      {trip.completedAt && (
        <div>
          Completed:{" "}
          {formatDate(
            trip.completedAt,
          )}
        </div>
      )}

      {!trip.createdAt &&
        !trip.arrivedAt &&
        !trip.boardingStartedAt &&
        !trip.departedAt &&
        !trip.completedAt && (
          <div>
            No timeline data
          </div>
        )}

    </div>
  );
}


// ============================================================
// MINI STAT
// ============================================================

function MiniStat({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="
      rounded-xl
      bg-white
      p-5
      shadow-sm
    ">

      <div className="
        text-sm
        text-gray-500
      ">
        {label}
      </div>

      <div className="
        mt-2
        text-2xl
        font-bold
        text-gray-900
      ">
        {value}
      </div>

    </div>
  );
}


// ============================================================
// EMPTY STATE
// ============================================================

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="
      p-10
      text-center
    ">

      <h3 className="
        text-lg
        font-medium
        text-gray-700
      ">
        {title}
      </h3>

      <p className="
        mt-2
        text-sm
        text-gray-500
      ">
        {description}
      </p>

    </div>
  );
}
