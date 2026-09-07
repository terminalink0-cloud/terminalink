const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("Creating Dispatcher test trip...");

  // ------------------------------------------------------------
  // Cooperative
  // ------------------------------------------------------------

  const cooperative =
    await prisma.cooperative.upsert({
      where: {
        code: "TEST",
      },

      update: {},

      create: {
        name: "Terminalink Test Cooperative",
        code: "TEST",
        contactPerson: "Test Administrator",
        phone: "09000000000",
        email: "test@terminalink.local",
        address: "Test Terminal",
        active: true,
      },
    });


  // ------------------------------------------------------------
  // Municipalities
  // ------------------------------------------------------------

  const manila =
    await prisma.municipality.upsert({
      where: {
        name: "Manila",
      },

      update: {},

      create: {
        name: "Manila",
        latitude: 14.5995,
        longitude: 120.9842,
        active: true,
      },
    });


  const batangas =
    await prisma.municipality.upsert({
      where: {
        name: "Batangas",
      },

      update: {},

      create: {
        name: "Batangas",
        latitude: 13.7565,
        longitude: 121.0583,
        active: true,
      },
    });


  // ------------------------------------------------------------
  // Route
  // ------------------------------------------------------------

  const route =
    await prisma.route.upsert({
      where: {
        originId_destinationId: {
          originId: manila.id,
          destinationId: batangas.id,
        },
      },

      update: {
        distanceKm: 110,
        estimatedMinutes: 150,
        displayOrder: 1,
        active: true,
      },

      create: {
        originId: manila.id,
        destinationId: batangas.id,
        distanceKm: 110,
        estimatedMinutes: 150,
        displayOrder: 1,
        active: true,
      },
    });


  // ------------------------------------------------------------
  // Find an existing driver
  // ------------------------------------------------------------

  const driverUser =
    await prisma.user.findFirst({
      where: {
        role: "DRIVER",
      },
    });


  if (!driverUser) {
    throw new Error(
      "No DRIVER user exists. Create a driver account first.",
    );
  }


  const driver =
    await prisma.driverProfile.findUnique({
      where: {
        userId: driverUser.id,
      },
    });


  if (!driver) {
    throw new Error(
      "The DRIVER user has no DriverProfile.",
    );
  }


  // ------------------------------------------------------------
  // Vehicle
  // ------------------------------------------------------------

  const vehicle =
    await prisma.vehicle.upsert({
      where: {
        plateNumber: "TEST-123",
      },

      update: {
        cooperativeId:
          cooperative.id,

        bodyNumber:
          "TEST-BODY-001",

        seatCapacity:
          14,

        make:
          "Toyota",

        model:
          "HiAce",

        yearModel:
          2024,

        color:
          "White",

        status:
          "ACTIVE",

        deletedAt:
          null,
      },

      create: {
        cooperativeId:
          cooperative.id,

        plateNumber:
          "TEST-123",

        bodyNumber:
          "TEST-BODY-001",

        seatCapacity:
          14,

        make:
          "Toyota",

        model:
          "HiAce",

        yearModel:
          2024,

        color:
          "White",

        qrToken:
          "TEST-QR-001",

        status:
          "ACTIVE",
      },
    });


  // ------------------------------------------------------------
  // Trip
  // ------------------------------------------------------------

  const existingTrip =
    await prisma.trip.findUnique({
      where: {
        tripNumber:
          "TEST-TRIP-001",
      },
    });


  let trip;


  if (existingTrip) {

    trip =
      await prisma.trip.update({
        where: {
          id: existingTrip.id,
        },

        data: {
          driverId:
            driver.id,

          vehicleId:
            vehicle.id,

          routeId:
            route.id,

          municipalityId:
            batangas.id,

          direction:
            "OUTBOUND",

          status:
            "WAITING",

          seatCapacity:
            14,

          availableSeats:
            14,

          startedAt:
            null,

          boardingStartedAt:
            null,

          departedAt:
            null,

          arrivedAt:
            null,

          completedAt:
            null,

          cancelReason:
            null,

          notes:
            "Dispatcher workflow test trip",

          estimatedArrival:
            new Date(),
        },
      });

  } else {

    trip =
      await prisma.trip.create({
        data: {
          tripNumber:
            "TEST-TRIP-001",

          driverId:
            driver.id,

          vehicleId:
            vehicle.id,

          routeId:
            route.id,

          municipalityId:
            batangas.id,

          direction:
            "OUTBOUND",

          status:
            "WAITING",

          seatCapacity:
            14,

          availableSeats:
            14,

          estimatedArrival:
            new Date(),

          notes:
            "Dispatcher workflow test trip",
        },
      });

  }


  // ------------------------------------------------------------
  // Queue entry
  // ------------------------------------------------------------

  const queue =
    await prisma.queueEntry.upsert({
      where: {
        tripId:
          trip.id,
      },

      update: {
        queuePosition:
          1,

        status:
          "WAITING",
      },

      create: {
        tripId:
          trip.id,

        queuePosition:
          1,

        status:
          "WAITING",
      },
    });


  console.log("");
  console.log("====================================");
  console.log("Dispatcher test trip created");
  console.log("====================================");
  console.log("");
  console.log("Driver:");
  console.log(
    `  ${driverUser.displayName} (${driverUser.username})`,
  );
  console.log("");
  console.log("Vehicle:");
  console.log("  plate: TEST-123");
  console.log("  vehicle: Toyota HiAce");
  console.log("");
  console.log("Trip:");
  console.log("  number:", trip.tripNumber);
  console.log("  status:", trip.status);
  console.log("");
  console.log("Queue:");
  console.log("  position:", queue.queuePosition);
  console.log("");
  console.log("Route:");
  console.log("  Manila -> Batangas");
  console.log("");
}


main()
  .catch((error) => {
    console.error(
      "TEST DATA ERROR:",
      error,
    );

    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });