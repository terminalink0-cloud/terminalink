/*
  Terminalink terminal verification QR

  Adds a one-time verification token to TripLeg.
  The driver receives the token when marking an
  outbound municipality -> terminal leg as APPROACHING.
*/

ALTER TABLE "TripLeg"
ADD COLUMN IF NOT EXISTS
  "terminalVerificationToken" TEXT;

ALTER TABLE "TripLeg"
ADD COLUMN IF NOT EXISTS
  "terminalVerificationIssuedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX IF NOT EXISTS
  "TripLeg_terminalVerificationToken_key"
ON "TripLeg"("terminalVerificationToken");