
// apps/web/src/components/VehicleQrScanner.tsx

import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  BrowserMultiFormatReader,
} from "@zxing/browser";


// ============================================================
// TYPES
// ============================================================

type VehicleQrScannerProps = {
  expectedQrToken?: string | null;

  onVerified: (
    scannedToken: string,
  ) => void;

  onCancel: () => void;
};


// ============================================================
// QR PAYLOAD
// ============================================================

type TerminalVerificationPayload = {
  type?: string;

  token?: string;

  tripId?: string;

  tripNumber?: string;

  legId?: string;
};


// ============================================================
// PARSE SCANNED VALUE
// ============================================================

function parseTerminalVerificationQr(
  rawValue: string,
): string | null {
  const value =
    rawValue.trim();


  if (!value) {
    return null;
  }


  // ----------------------------------------------------------
  // New Terminalink terminal-verification QR
  // ----------------------------------------------------------

  try {
    const parsed =
      JSON.parse(value) as
        TerminalVerificationPayload;


    if (
      parsed.type ===
        "TERMINALINK_TERMINAL_VERIFICATION" &&
      typeof parsed.token ===
        "string" &&
      parsed.token.trim()
    ) {
      return parsed.token.trim();
    }
  } catch {
    // Not JSON. Continue below.
  }


  // ----------------------------------------------------------
  // Legacy/plain token QR
  // ----------------------------------------------------------

  return value;
}


// ============================================================
// COMPONENT
// ============================================================

export default function VehicleQrScanner({
  expectedQrToken,
  onVerified,
  onCancel,
}: VehicleQrScannerProps) {
  const videoRef =
    useRef<HTMLVideoElement | null>(
      null,
    );

  const readerRef =
    useRef<
      BrowserMultiFormatReader | null
    >(null);

  const controlsRef =
    useRef<{
      stop: () => void;
    } | null>(null);


  const [error, setError] =
    useState<string | null>(
      null,
    );


  const [scannedValue, setScannedValue] =
    useState<string | null>(
      null,
    );


  const [verified, setVerified] =
    useState(false);


  // ==========================================================
  // START CAMERA
  // ==========================================================

  useEffect(() => {
    let cancelled =
      false;


    async function startScanner() {
      try {
        setError(null);

        setScannedValue(null);

        setVerified(false);


        const video =
          videoRef.current;


        if (!video) {
          throw new Error(
            "Scanner video element is not available.",
          );
        }


        const reader =
          new BrowserMultiFormatReader();


        readerRef.current =
          reader;


        const devices =
          await BrowserMultiFormatReader.listVideoInputDevices();


        if (
          cancelled
        ) {
          return;
        }


        if (
          devices.length ===
          0
        ) {
          throw new Error(
            "No camera was found on this device.",
          );
        }


        // Prefer back/rear camera.
        const preferredDevice =
          devices.find(
            (
              device,
            ) =>
              /back|rear|environment/i.test(
                device.label,
              ),
          ) ??
          devices[0];


        const controls =
          await reader.decodeFromVideoDevice(
            preferredDevice.deviceId,
            video,
            (
              result,
              _error,
              controls,
            ) => {
              if (
                cancelled
              ) {
                controls?.stop();

                return;
              }


              if (!result) {
                return;
              }


              const raw =
                result.getText();


              setScannedValue(
                raw,
              );


              const token =
                parseTerminalVerificationQr(
                  raw,
                );


              if (!token) {
                setError(
                  "The scanned QR does not contain a valid verification token.",
                );

                return;
              }


              // ------------------------------------------------
              // Compare the parsed token, NOT the complete JSON.
              // ------------------------------------------------

              if (
                expectedQrToken &&
                token !==
                  expectedQrToken
              ) {
                setError(
                  [
                    "This QR code does not match the terminal verification token for this trip.",
                    `Scanned token: ${token}`,
                    `Expected token: ${expectedQrToken}`,
                  ].join(
                    "\n",
                  ),
                );

                return;
              }


              // ------------------------------------------------
              // Valid QR
              // ------------------------------------------------

              setVerified(
                true,
              );

              setError(
                null,
              );


              controls?.stop();


              onVerified(
                token,
              );
            },
          );


        controlsRef.current =
          controls;


      } catch (
        scannerError
      ) {
        if (
          cancelled
        ) {
          return;
        }


        const message =
          scannerError instanceof
            Error
            ? scannerError.message
            : "Unable to start QR scanner.";


        setError(
          message,
        );
      }
    }


    void startScanner();


    return () => {
      cancelled =
        true;


      try {
        controlsRef.current?.stop();
      } catch {
        // Ignore cleanup errors.
      }


      controlsRef.current =
        null;


      readerRef.current =
        null;


      const video =
        videoRef.current;


      if (video) {
        video.pause();

        video.srcObject =
          null;
      }
    };
  }, [
    expectedQrToken,
    onVerified,
  ]);


  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="
      rounded-xl
      border
      bg-white
      p-4
    ">

      <div className="
        text-sm
        font-semibold
        text-gray-900
      ">
        Scan Terminal Verification QR
      </div>


      <p className="
        mt-1
        text-xs
        text-gray-500
      ">
        Scan the QR displayed on the driver's
        dashboard.
      </p>


      <div className="
        relative
        mt-4
        overflow-hidden
        rounded-xl
        bg-black
      ">

        <video
          ref={
            videoRef
          }
          autoPlay
          muted
          playsInline
          className="
            aspect-video
            w-full
            object-cover
          "
        />


        <div className="
          pointer-events-none
          absolute
          inset-0
          flex
          items-center
          justify-center
        ">

          <div className="
            h-48
            w-48
            rounded-2xl
            border-4
            border-white
            shadow-lg
          " />

        </div>

      </div>


      {/* VERIFIED */}

      {verified && (
        <div className="
          mt-4
          rounded-lg
          bg-green-50
          p-3
          text-sm
          text-green-700
        ">
          Terminal verification QR accepted.
        </div>
      )}


      {/* ERROR */}

      {error && (
        <div className="
          mt-4
          whitespace-pre-line
          rounded-lg
          bg-red-50
          p-3
          text-sm
          text-red-700
        ">
          {error}
        </div>
      )}


      {/* SCANNED VALUE */}

      {scannedValue && (
        <div className="
          mt-3
          rounded-lg
          bg-gray-50
          p-3
        ">

          <div className="
            text-xs
            font-semibold
            uppercase
            tracking-wide
            text-gray-500
          ">
            Scanned value
          </div>


          <div className="
            mt-1
            break-all
            text-xs
            text-gray-700
          ">
            {scannedValue}
          </div>

        </div>
      )}


      {/* CONTROLS */}

      <div className="
        mt-4
        flex
        justify-end
      ">

        <button
          type="button"
          onClick={() => {
            try {
              controlsRef.current?.stop();
            } catch {
              // Ignore cleanup errors.
            }

            onCancel();
          }}
          className="
            rounded-lg
            bg-gray-100
            px-4
            py-2
            text-sm
            font-medium
            text-gray-700
            hover:bg-gray-200
          "
        >
          Cancel
        </button>

      </div>

    </div>
  );
}
