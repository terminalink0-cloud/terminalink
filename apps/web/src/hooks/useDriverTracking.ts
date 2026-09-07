
// apps/web/src/hooks/useDriverTracking.ts

import {
  useEffect,
  useRef,
} from "react";

import api from "../api/axios";


// ============================================================
// TYPES
// ============================================================

type UseDriverTrackingOptions = {
  enabled: boolean;

  tripId:
    | string
    | null;

  tripLegId:
    | string
    | null;
};


// ============================================================
// HOOK
// ============================================================

export function useDriverTracking({
  enabled,
  tripId,
  tripLegId,
}: UseDriverTrackingOptions) {
  const watchIdRef =
    useRef<number | null>(
      null,
    );


  const lastSentAtRef =
    useRef<number>(
      0,
    );


  useEffect(() => {
    // --------------------------------------------------------
    // Do not track unless we have an active operational leg.
    // --------------------------------------------------------

    if (
      !enabled ||
      !tripId ||
      !tripLegId
    ) {
      return;
    }


    // --------------------------------------------------------
    // Browser support
    // --------------------------------------------------------

    if (
      !navigator.geolocation
    ) {
      console.error(
        "Geolocation is not supported by this browser.",
      );

      return;
    }


    // --------------------------------------------------------
    // Send location to the API
    //
    // We throttle updates to approximately once every 2 sec.
    // The browser itself may provide positions more frequently.
    // --------------------------------------------------------

    const sendLocation =
      async (
        position: GeolocationPosition,
      ) => {
        const now =
          Date.now();


        if (
          now -
            lastSentAtRef.current <
          2000
        ) {
          return;
        }


        lastSentAtRef.current =
          now;


        try {
          await api.post(
            "/tracking/location",
            {
              tripId,

              tripLegId,

              latitude:
                position.coords.latitude,

              longitude:
                position.coords.longitude,

              accuracy:
                Number.isFinite(
                  position.coords.accuracy,
                )
                  ? position.coords.accuracy
                  : undefined,

              heading:
                position.coords.heading !==
                  null &&
                Number.isFinite(
                  position.coords.heading,
                )
                  ? position.coords.heading
                  : undefined,

              speed:
                position.coords.speed !==
                  null &&
                Number.isFinite(
                  position.coords.speed,
                )
                  ? Math.max(
                      position.coords.speed,
                      0,
                    )
                  : undefined,

              recordedAt:
                new Date(
                  position.timestamp,
                ).toISOString(),
            },
          );
        } catch (
          error
        ) {
          console.error(
            "Unable to send driver GPS location.",
            error,
          );
        }
      };


    // --------------------------------------------------------
    // GPS error
    // --------------------------------------------------------

    const handleError =
      (
        error: GeolocationPositionError,
      ) => {
        switch (
          error.code
        ) {
          case GeolocationPositionError.PERMISSION_DENIED:
            console.error(
              "Location permission was denied.",
            );
            break;

          case GeolocationPositionError.POSITION_UNAVAILABLE:
            console.error(
              "Driver GPS position is unavailable.",
            );
            break;

          case GeolocationPositionError.TIMEOUT:
            console.error(
              "Driver GPS request timed out.",
            );
            break;

          default:
            console.error(
              "Unknown driver GPS error.",
              error,
            );
        }
      };


    // --------------------------------------------------------
    // Start watching the driver's location.
    // --------------------------------------------------------

    watchIdRef.current =
      navigator.geolocation.watchPosition(
        sendLocation,
        handleError,
        {
          enableHighAccuracy:
            true,

          maximumAge:
            3000,

          timeout:
            15000,
        },
      );


    // --------------------------------------------------------
    // Cleanup when:
    //
    // EN_ROUTE -> APPROACHING -> ARRIVED
    //
    // or the page/component changes trip.
    // --------------------------------------------------------

    return () => {
      if (
        watchIdRef.current !==
        null
      ) {
        navigator.geolocation.clearWatch(
          watchIdRef.current,
        );

        watchIdRef.current =
          null;
      }


      lastSentAtRef.current =
        0;
    };
  }, [
    enabled,
    tripId,
    tripLegId,
  ]);
}
