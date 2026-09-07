// database/prisma/seed.ts

import {
  PrismaClient,
} from "@prisma/client";


const prisma =
  new PrismaClient();


async function seedCooperativesAndRoutes() {
  console.log(
    "Seeding cooperatives, municipalities, and routes...",
  );


  // ==========================================================
  // COOPERATIVES
  // ==========================================================

  const cooperatives = [
    {
      code: "HAPITRANSCO",

      name:
        "Happy Island Transport Service Cooperative",

      address:
        "Bagatabao, Bagamanoc, Catanduanes",

      active:
        true,
    },

    {
      code: "CAPATRASCO",

      name:
        "Caramoran Pandan Transport Service Cooperative",

      address:
        "Barangay Datag East, Caramoran, Catanduanes",

      active:
        true,
    },

    {
      code: "CATTRANSCO",

      name:
        "Catanduanes Transport Service Cooperative",

      address:
        "San Vicente, Viga, Catanduanes",

      active:
        true,
    },

    {
      code:
        "VISARCAPANTRANSCO",

      name:
        "Virac-San Andres-Caramoran-Pandan Transport Service Cooperative",

      address:
        "Cavinitan, Virac, Catanduanes",

      active:
        true,
    },

    {
      code:
        "GIVITRANSCO",

      name:
        "Gigmoto-Viga Transport Service Cooperative",

      address:
        "Gigmoto-Viga-Virac, Catanduanes",

      active:
        true,
    },
  ];


  for (
    const cooperative of cooperatives
  ) {
    await prisma.cooperative.upsert({
      where: {
        code:
          cooperative.code,
      },

      update: {
        name:
          cooperative.name,

        address:
          cooperative.address,

        active:
          cooperative.active,
      },

      create: {
        code:
          cooperative.code,

        name:
          cooperative.name,

        address:
          cooperative.address,

        active:
          cooperative.active,
      },
    });
  }


  // ==========================================================
  // MUNICIPALITIES
  //
  // Coordinates are intentionally left null here because the
  // schema permits nullable coordinates and we should not seed
  // guessed GPS coordinates into production data.
  // ==========================================================

  const municipalityNames = [
    "Virac",
    "Bagamanoc",
    "Caramoran",
    "Pandan",
    "Viga",
    "Gigmoto",
    "San Andres",
  ];


  const municipalities =
    new Map<
      string,
      {
        id: string;
        name: string;
      }
    >();


  for (
    const name of municipalityNames
  ) {
    const municipality =
      await prisma.municipality.upsert({
        where: {
          name,
        },

        update: {
          active:
            true,
        },

        create: {
          name,

          active:
            true,
        },
      });


    municipalities.set(
      name,
      municipality,
    );
  }


  // ==========================================================
  // ROUTE HELPER
  // ==========================================================

  async function upsertRoute({
    origin,
    destination,
    distanceKm,
    estimatedMinutes,
    displayOrder,
  }: {
    origin: string;
    destination: string;
    distanceKm: number;
    estimatedMinutes: number;
    displayOrder: number;
  }) {
    const originMunicipality =
      municipalities.get(
        origin,
      );


    const destinationMunicipality =
      municipalities.get(
        destination,
      );


    if (
      !originMunicipality ||
      !destinationMunicipality
    ) {
      throw new Error(
        `Municipality missing for route ${origin} → ${destination}`,
      );
    }


    await prisma.route.upsert({
      where: {
        originId_destinationId: {
          originId:
            originMunicipality.id,

          destinationId:
            destinationMunicipality.id,
        },
      },

      update: {
        distanceKm,

        estimatedMinutes,

        displayOrder,

        active:
          true,
      },

      create: {
        originId:
          originMunicipality.id,

        destinationId:
          destinationMunicipality.id,

        distanceKm,

        estimatedMinutes,

        displayOrder,

        active:
          true,
      },
    });
  }


  // ==========================================================
  // ROUTES
  //
  // These are the primary corridors represented by the
  // cooperatives you supplied.
  //
  // Distances/times below are operational seed values and should
  // be refined later using your actual route data/GIS source.
  // ==========================================================

  await upsertRoute({
    origin:
      "Bagamanoc",

    destination:
      "Virac",

    distanceKm:
      53,

    estimatedMinutes:
      90,

    displayOrder:
      10,
  });


  await upsertRoute({
    origin:
      "Virac",

    destination:
      "Bagamanoc",

    distanceKm:
      53,

    estimatedMinutes:
      90,

    displayOrder:
      11,
  });


  await upsertRoute({
    origin:
      "Caramoran",

    destination:
      "Virac",

    distanceKm:
      62,

    estimatedMinutes:
      105,

    displayOrder:
      20,
  });


  await upsertRoute({
    origin:
      "Virac",

    destination:
      "Caramoran",

    distanceKm:
      62,

    estimatedMinutes:
      105,

    displayOrder:
      21,
  });


  await upsertRoute({
    origin:
      "Pandan",

    destination:
      "Virac",

    distanceKm:
      76,

    estimatedMinutes:
      125,

    displayOrder:
      30,
  });


  await upsertRoute({
    origin:
      "Virac",

    destination:
      "Pandan",

    distanceKm:
      76,

    estimatedMinutes:
      125,

    displayOrder:
      31,
  });


  await upsertRoute({
    origin:
      "Viga",

    destination:
      "Virac",

    distanceKm:
      43,

    estimatedMinutes:
      75,

    displayOrder:
      40,
  });


  await upsertRoute({
    origin:
      "Virac",

    destination:
      "Viga",

    distanceKm:
      43,

    estimatedMinutes:
      75,

    displayOrder:
      41,
  });


  await upsertRoute({
    origin:
      "Gigmoto",

    destination:
      "Viga",

    distanceKm:
      30,

    estimatedMinutes:
      50,

    displayOrder:
      50,
  });


  await upsertRoute({
    origin:
      "Viga",

    destination:
      "Gigmoto",

    distanceKm:
      30,

    estimatedMinutes:
      50,

    displayOrder:
      51,
  });


  await upsertRoute({
    origin:
      "Gigmoto",

    destination:
      "Virac",

    distanceKm:
      55,

    estimatedMinutes:
      95,

    displayOrder:
      52,
  });


  await upsertRoute({
    origin:
      "Virac",

    destination:
      "Gigmoto",

    distanceKm:
      55,

    estimatedMinutes:
      95,

    displayOrder:
      53,
  });


  await upsertRoute({
    origin:
      "San Andres",

    destination:
      "Virac",

    distanceKm:
      38,

    estimatedMinutes:
      65,

    displayOrder:
      60,
  });


  await upsertRoute({
    origin:
      "Virac",

    destination:
      "San Andres",

    distanceKm:
      38,

    estimatedMinutes:
      65,

    displayOrder:
      61,
  });


  await upsertRoute({
    origin:
      "San Andres",

    destination:
      "Caramoran",

    distanceKm:
      42,

    estimatedMinutes:
      70,

    displayOrder:
      62,
  });


  await upsertRoute({
    origin:
      "Caramoran",

    destination:
      "San Andres",

    distanceKm:
      42,

    estimatedMinutes:
      70,

    displayOrder:
      63,
  });


  await upsertRoute({
    origin:
      "Caramoran",

    destination:
      "Pandan",

    distanceKm:
      19,

    estimatedMinutes:
      30,

    displayOrder:
      64,
  });


  await upsertRoute({
    origin:
      "Pandan",

    destination:
      "Caramoran",

    distanceKm:
      19,

    estimatedMinutes:
      30,

    displayOrder:
      65,
  });


  console.log(
    "Cooperatives seeded:",
    cooperatives.length,
  );


  console.log(
    "Municipalities seeded:",
    municipalityNames.length,
  );


  console.log(
    "Routes seeded successfully.",
  );
}


async function main() {
  await seedCooperativesAndRoutes();
}


main()
  .catch(
    (error) => {
      console.error(
        error,
      );

      process.exit(
        1,
      );
    },
  )
  .finally(
    async () => {
      await prisma.$disconnect();
    },
  );