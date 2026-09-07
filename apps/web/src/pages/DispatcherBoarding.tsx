
// apps/web/src/pages/DispatcherBoarding.tsx

import {
  useState,
} from "react";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  getIncomingTrips,
  startBoarding,
} from "../api/dispatcher.api";

import {
  boardPassenger,
  getTripBoardingSummary,
} from "../api/boarding.api";

import type {
  BoardingSummary,
} from "../api/boarding.api";


type Trip = {
  id: string;
  tripNumber?: string;
  direction?: string;
  status: string;
  seatCapacity?: number;
  availableSeats?: number;

  driver?: {
    user?: {
      displayName?: string;
    };
  };

  vehicle?: {
    plateNumber?: string;
    make?: string;
    model?: string;
  };
};


type Passenger = {
  id: string;
  passengerName: string;
  seatNumber?: number | null;
  boardedAt: string;
};


type ApiError = {
  response?: {
    data?: {
      message?: string | string[];
    };
  };
};


function getErrorMessage(
  error: unknown,
): string | null {
  if (
    typeof error !== "object" ||
    error === null
  ) {
    return null;
  }

  const value =
    error as ApiError;

  const message =
    value.response?.data?.message;

  if (Array.isArray(message)) {
    return message.join(", ");
  }

  if (typeof message === "string") {
    return message;
  }

  return null;
}


export default function DispatcherBoarding() {
  const queryClient =
    useQueryClient();

  const [
    selectedTripId,
    setSelectedTripId,
  ] = useState<string | null>(null);

  const [
    passengerName,
    setPassengerName,
  ] = useState("");

  const [
    seatNumber,
    setSeatNumber,
  ] = useState("");

  const tripsQuery =
    useQuery<Trip[]>({
      queryKey: [
        "dispatcher-boarding-trips",
      ],

      queryFn:
        getIncomingTrips,

      refetchInterval:
        10000,
    });

  const summaryQuery =
    useQuery<BoardingSummary>({
      queryKey: [
        "dispatcher-boarding-summary",
        selectedTripId,
      ],

      queryFn: async () => {
        if (!selectedTripId) {
          throw new Error(
            "No trip selected",
          );
        }

        return getTripBoardingSummary(
          selectedTripId,
        );
      },

      enabled:
        selectedTripId !== null,

      refetchInterval:
        selectedTripId !== null
          ? 5000
          : false,
    });

  const startBoardingMutation =
    useMutation({
      mutationFn:
        startBoarding,

      onSuccess:
        async (_data, tripId) => {
          setSelectedTripId(
            tripId,
          );

          await queryClient.invalidateQueries({
            queryKey: [
              "dispatcher-boarding-trips",
            ],
          });
        },
    });

  const boardMutation =
    useMutation({
      mutationFn:
        boardPassenger,

      onSuccess:
        async () => {
          setPassengerName("");
          setSeatNumber("");

          await queryClient.invalidateQueries({
            queryKey: [
              "dispatcher-boarding-trips",
            ],
          });

          if (selectedTripId) {
            await queryClient.invalidateQueries({
              queryKey: [
                "dispatcher-boarding-summary",
                selectedTripId,
              ],
            });
          }
        },
    });

  if (tripsQuery.isLoading) {
    return (
      <div className="p-6">
        <div className="
          rounded-xl
          bg-white
          p-6
          shadow-sm
        ">
          Loading boarding operations...
        </div>
      </div>
    );
  }

  if (tripsQuery.isError) {
    return (
      <div className="p-6">
        <div className="
          rounded-xl
          bg-red-50
          p-5
          text-red-700
        ">
          Unable to load boarding trips.
        </div>
      </div>
    );
  }

  const trips =
    Array.isArray(tripsQuery.data)
      ? tripsQuery.data.filter(
          (trip) =>
            trip.status ===
              "DOCKED" ||
            trip.status ===
              "BOARDING",
        )
      : [];

  const summary =
    summaryQuery.data;

  const passengers: Passenger[] =
    Array.isArray(
      summary?.boardings,
    )
      ? (
          summary
            .boardings as Passenger[]
        )
      : [];

  let boardedCount = 0;

  if (
    typeof summary?.boardedCount ===
      "number"
  ) {
    boardedCount =
      summary.boardedCount;
  } else if (
    typeof summary?.seatCapacity ===
      "number" &&
    typeof summary?.availableSeats ===
      "number"
  ) {
    boardedCount =
      Math.max(
        0,
        summary.seatCapacity -
          summary.availableSeats,
      );
  }

  const seatCapacity =
    summary?.seatCapacity ??
    trips.find(
      (trip) =>
        trip.id ===
        selectedTripId,
    )?.seatCapacity ??
    0;

  const availableSeats =
    summary?.availableSeats ??
    trips.find(
      (trip) =>
        trip.id ===
        selectedTripId,
    )?.availableSeats ??
    0;

  const isFull =
    summary?.isFull ??
    availableSeats <= 0;

  const boardingError =
    getErrorMessage(
      boardMutation.error,
    );

  const startBoardingError =
    getErrorMessage(
      startBoardingMutation.error,
    );

  return (
    <div className="
      space-y-6
    ">

      <div className="
        rounded-xl
        bg-white
        p-6
        shadow-sm
      ">
        <h1 className="
          text-3xl
          font-bold
          text-gray-900
        ">
          Boarding
        </h1>

        <p className="
          mt-2
          text-gray-500
        ">
          Manage passenger boarding and seat assignments.
        </p>
      </div>


      <div className="
        grid
        gap-6
        lg:grid-cols-[360px_1fr]
      ">

        <div className="
          rounded-xl
          bg-white
          p-5
          shadow-sm
        ">

          <h2 className="
            mb-4
            text-lg
            font-semibold
            text-gray-900
          ">
            Boarding Trips
          </h2>

          {trips.length === 0 ? (
            <div className="
              rounded-lg
              bg-gray-50
              p-4
              text-sm
              text-gray-500
            ">
              No trips are currently available for boarding.
            </div>
          ) : (
            <div className="
              space-y-2
            ">
              {trips.map((trip) => {
                const selected =
                  selectedTripId ===
                  trip.id;

                return (
                  <button
                    key={trip.id}
                    type="button"
                    onClick={() => {
                      setSelectedTripId(
                        trip.id,
                      );

                      setPassengerName("");
                      setSeatNumber("");
                    }}
                    className={[
                      "w-full",
                      "rounded-lg",
                      "border",
                      "p-4",
                      "text-left",
                      "transition",
                      selected
                        ? "border-blue-600 bg-blue-50"
                        : "border-gray-200 hover:bg-gray-50",
                    ].join(" ")}
                  >
                    <div className="
                      font-semibold
                      text-gray-900
                    ">
                      {trip.tripNumber ?? "-"}
                    </div>

                    <div className="
                      mt-1
                      text-sm
                      text-gray-500
                    ">
                      {trip.driver?.user?.displayName ?? "-"}
                    </div>

                    <div className="
                      mt-1
                      text-xs
                      text-gray-500
                    ">
                      {trip.vehicle?.plateNumber ?? "-"}
                    </div>

                    <div className="
                      mt-2
                      flex
                      items-center
                      justify-between
                      gap-2
                    ">
                      <StatusBadge
                        status={
                          trip.status
                        }
                      />

                      {trip.status ===
                        "BOARDING" && (
                        <span className="
                          text-xs
                          font-medium
                          text-gray-600
                        ">
                          Ready
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>


        <div className="
          rounded-xl
          bg-white
          p-6
          shadow-sm
        ">

          {!selectedTripId ? (
            <div className="
              flex
              min-h-[420px]
              items-center
              justify-center
              rounded-xl
              bg-gray-50
              p-8
              text-center
            ">
              <div>
                <h2 className="
                  text-lg
                  font-semibold
                  text-gray-700
                ">
                  Select a trip
                </h2>

                <p className="
                  mt-2
                  text-sm
                  text-gray-500
                ">
                  Choose a trip from the left to manage boarding.
                </p>
              </div>
            </div>
          ) : (
            <div className="
              space-y-6
            ">

              {startBoardingError && (
                <div className="
                  rounded-lg
                  bg-red-100
                  p-3
                  text-sm
                  text-red-700
                ">
                  {startBoardingError}
                </div>
              )}

              {summaryQuery.isError && (
                <div className="
                  rounded-lg
                  bg-red-100
                  p-3
                  text-sm
                  text-red-700
                ">
                  Unable to load boarding details.
                </div>
              )}


              <div className="
                grid
                grid-cols-3
                gap-4
              ">

                <Stat
                  label="Capacity"
                  value={
                    summaryQuery.isLoading
                      ? "..."
                      : seatCapacity
                  }
                />

                <Stat
                  label="Boarded"
                  value={
                    summaryQuery.isLoading
                      ? "..."
                      : boardedCount
                  }
                />

                <Stat
                  label="Available"
                  value={
                    summaryQuery.isLoading
                      ? "..."
                      : availableSeats
                  }
                />

              </div>


              {trips.find(
                (trip) =>
                  trip.id ===
                  selectedTripId,
              )?.status === "DOCKED" && (
                <button
                  type="button"
                  disabled={
                    startBoardingMutation.isPending
                  }
                  onClick={() => {
                    startBoardingMutation.mutate(
                      selectedTripId,
                    );
                  }}
                  className="
                    rounded-lg
                    bg-blue-600
                    px-4
                    py-3
                    text-sm
                    font-semibold
                    text-white
                    disabled:opacity-50
                  "
                >
                  {
                    startBoardingMutation.isPending
                      ? "Starting..."
                      : "Start Boarding"
                  }
                </button>
              )}


              {isFull && (
                <div className="
                  rounded-lg
                  bg-yellow-100
                  p-4
                  text-sm
                  text-yellow-800
                ">
                  This vehicle is full.
                </div>
              )}


              <div className="
                rounded-xl
                border
                bg-gray-50
                p-5
              ">

                <h2 className="
                  text-lg
                  font-semibold
                  text-gray-900
                ">
                  Board Passenger
                </h2>

                <div className="
                  mt-4
                  space-y-3
                ">

                  <input
                    type="text"
                    value={passengerName}
                    onChange={(event) => {
                      setPassengerName(
                        event.target.value,
                      );
                    }}
                    placeholder="Passenger name"
                    disabled={
                      isFull ||
                      trips.find(
                        (trip) =>
                          trip.id ===
                          selectedTripId,
                      )?.status !==
                        "BOARDING"
                    }
                    className="
                      w-full
                      rounded-lg
                      border
                      bg-white
                      p-3
                      text-sm
                      outline-none
                      focus:ring-2
                      focus:ring-blue-500
                      disabled:bg-gray-100
                    "
                  />

                  <input
                    type="number"
                    min={1}
                    max={seatCapacity}
                    value={seatNumber}
                    onChange={(event) => {
                      setSeatNumber(
                        event.target.value,
                      );
                    }}
                    placeholder="Seat number"
                    disabled={
                      isFull ||
                      trips.find(
                        (trip) =>
                          trip.id ===
                          selectedTripId,
                      )?.status !==
                        "BOARDING"
                    }
                    className="
                      w-full
                      rounded-lg
                      border
                      bg-white
                      p-3
                      text-sm
                      outline-none
                      focus:ring-2
                      focus:ring-blue-500
                      disabled:bg-gray-100
                    "
                  />

                  <button
                    type="button"
                    disabled={
                      boardMutation.isPending ||
                      isFull ||
                      passengerName.trim().length === 0 ||
                      trips.find(
                        (trip) =>
                          trip.id ===
                          selectedTripId,
                      )?.status !==
                        "BOARDING"
                    }
                    onClick={() => {
                      if (!selectedTripId) {
                        return;
                      }

                      const name =
                        passengerName.trim();

                      if (!name) {
                        return;
                      }

                      const rawSeat =
                        seatNumber.trim();

                      let parsedSeat:
                        number |
                        undefined;

                      if (rawSeat) {
                        const value =
                          Number(rawSeat);

                        if (
                          Number.isInteger(
                            value,
                          ) &&
                          value > 0
                        ) {
                          parsedSeat =
                            value;
                        }
                      }

                      boardMutation.mutate({
                        tripId:
                          selectedTripId,

                        passengerName:
                          name,

                        ...(parsedSeat !==
                          undefined
                          ? {
                              seatNumber:
                                parsedSeat,
                            }
                          : {}),
                      });
                    }}
                    className="
                      w-full
                      rounded-lg
                      bg-indigo-600
                      px-4
                      py-3
                      text-sm
                      font-semibold
                      text-white
                      disabled:cursor-not-allowed
                      disabled:opacity-50
                    "
                  >
                    {boardMutation.isPending
                      ? "Boarding..."
                      : "Board Passenger"}
                  </button>

                  {boardingError && (
                    <div className="
                      rounded-lg
                      bg-red-100
                      p-3
                      text-sm
                      text-red-700
                    ">
                      {boardingError}
                    </div>
                  )}
                </div>
              </div>


              <div>
                <div className="
                  mb-3
                  flex
                  items-center
                  justify-between
                  gap-3
                ">
                  <h2 className="
                    text-lg
                    font-semibold
                    text-gray-900
                  ">
                    Boarded Passengers
                  </h2>

                  <span className="
                    text-sm
                    text-gray-500
                  ">
                    {boardedCount}
                    {" / "}
                    {seatCapacity}
                  </span>
                </div>

                {passengers.length === 0 ? (
                  <div className="
                    rounded-lg
                    bg-gray-50
                    p-4
                    text-sm
                    text-gray-500
                  ">
                    No passengers boarded yet.
                  </div>
                ) : (
                  <div className="
                    divide-y
                    overflow-hidden
                    rounded-lg
                    border
                  ">
                    {passengers.map(
                      (passenger) => (
                        <div
                          key={
                            passenger.id
                          }
                          className="
                            flex
                            items-center
                            justify-between
                            gap-4
                            p-4
                          "
                        >
                          <div>
                            <div className="
                              font-medium
                              text-gray-900
                            ">
                              {
                                passenger.passengerName
                              }
                            </div>

                            <div className="
                              mt-1
                              text-xs
                              text-gray-500
                            ">
                              {
                                new Date(
                                  passenger.boardedAt,
                                ).toLocaleTimeString()
                              }
                            </div>
                          </div>

                          <span className="
                            rounded-full
                            bg-blue-100
                            px-3
                            py-1
                            text-sm
                            font-semibold
                            text-blue-700
                          ">
                            Seat{" "}
                            {
                              passenger.seatNumber ??
                              "-"
                            }
                          </span>
                        </div>
                      ),
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


function Stat({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="
      rounded-lg
      border
      bg-gray-50
      p-4
    ">
      <div className="
        text-xs
        text-gray-500
      ">
        {label}
      </div>

      <div className="
        mt-1
        text-2xl
        font-bold
        text-gray-900
      ">
        {value}
      </div>
    </div>
  );
}


function StatusBadge({
  status,
}: {
  status: string;
}) {
  const classes: Record<
    string,
    string
  > = {
    WAITING:
      "bg-gray-100 text-gray-700",

    DOCKED:
      "bg-yellow-100 text-yellow-700",

    BOARDING:
      "bg-blue-100 text-blue-700",

    DEPARTED:
      "bg-green-100 text-green-700",

    COMPLETED:
      "bg-emerald-100 text-emerald-700",
  };

  const className =
    classes[status] ??
    "bg-gray-100 text-gray-700";

  return (
    <span className={[
      "inline-flex",
      "rounded-full",
      "px-2.5",
      "py-1",
      "text-xs",
      "font-medium",
      className,
    ].join(" ")}>
      {status}
    </span>
  );
}
