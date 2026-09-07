
// apps/web/src/api/driver.api.ts

import api from "./axios";


// ============================================================
// TYPES
// ============================================================

export type DriverUser = {
  id?: string;
  username?: string;
  role?: string;
  status?: string;
  firstName?: string;
  middleName?: string | null;
  lastName?: string;
  displayName?: string;
  phone?: string | null;
  email?: string | null;
  lastLoginAt?: string | null;
};


export type DriverCooperative = {
  id?: string;
  name?: string;
  code?: string;
  contactPerson?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  active?: boolean;
};


export type DriverVehicle = {
  id: string;
  cooperativeId?: string;
  plateNumber?: string;
  bodyNumber?: string | null;
  seatCapacity?: number;
  make?: string | null;
  model?: string | null;
  yearModel?: number | null;
  color?: string | null;
  qrToken?: string;
  status?: string;
};


export type ActiveVehicleAssignment = {
  id: string;
  status: string;
  assignedAt: string;
  releasedAt?: string | null;
  notes?: string | null;
  vehicle: DriverVehicle;
};


export type DriverProfile = {
  id: string;
  userId: string;
  cooperativeId: string;
  licenseNumber: string;
  licenseExpiry?: string | null;
  emergencyContact?: string | null;
  emergencyPhone?: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;

  user?: DriverUser;
  cooperative?: DriverCooperative;

  activeVehicleAssignment:
    | ActiveVehicleAssignment
    | null;
};


export type DriverQueueEntry = {
  id: string;
  tripLegId: string;
  queuePosition: number;
  status: string;
  createdAt?: string;
  updatedAt?: string;
};


export type DriverBoardingRecord = {
  id: string;
  tripId?: string;
  tripLegId?: string;
  passengerName: string;
  seatNumber: number | null;
  boardedAt: string;
};


export type DriverTripLeg = {
  id: string;
  tripId?: string;

  legType:
    | "OUTBOUND"
    | "RETURN"
    | string;

  originType:
    | "MUNICIPALITY"
    | "TERMINAL"
    | string;

  destinationType:
    | "MUNICIPALITY"
    | "TERMINAL"
    | string;

  status:
    | "WAITING"
    | "BOARDING"
    | "EN_ROUTE"
    | "APPROACHING"
    | "ARRIVED"
    | "COMPLETED"
    | "CANCELLED"
    | string;

  boardingStartedAt?: string | null;
  startedAt?: string | null;
  approachingAt?: string | null;
  arrivedAt?: string | null;
  completedAt?: string | null;

  terminalVerificationToken?:
    | string
    | null;

  terminalVerificationIssuedAt?:
    | string
    | null;

  createdAt?: string;
  updatedAt?: string;

  queueEntries?: DriverQueueEntry[];

  boardings?: DriverBoardingRecord[];
};


export type DriverRoute = {
  id?: string;

  origin?: {
    id?: string;
    name?: string;
    latitude?: number | null;
    longitude?: number | null;
  };

  destination?: {
    id?: string;
    name?: string;
    latitude?: number | null;
    longitude?: number | null;
  };
};


export type DriverTrip = {
  id: string;
  tripNumber: string;

  driverId?: string;
  vehicleId?: string;
  routeId?: string;
  municipalityId?: string;

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

  notes?: string | null;

  vehicle?: DriverVehicle;

  route?: DriverRoute;

  municipality?: {
    id?: string;
    name?: string;
    latitude?: number | null;
    longitude?: number | null;
  };

  legs?: DriverTripLeg[];

  currentLeg?:
    | DriverTripLeg
    | null;

  terminalQueuePosition:
    | number
    | null;

  isFirstTerminalVehicle:
    boolean;
};


// ============================================================
// DRIVER ADMIN / PROFILE
// ============================================================

export async function getDrivers(): Promise<
  DriverProfile[]
> {
  const response =
    await api.get(
      "/drivers",
    );

  if (
    Array.isArray(
      response.data,
    )
  ) {
    return response.data;
  }

  if (
    response.data &&
    Array.isArray(
      response.data.data,
    )
  ) {
    return response.data.data;
  }

  return [];
}


export async function getDriver(
  id: string,
): Promise<DriverProfile> {
  const response =
    await api.get(
      `/drivers/${id}`,
    );

  return response.data;
}


export type CreateDriverPayload = {
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  cooperativeId: string;
  licenseNumber: string;
  licenseExpiry?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  isActive?: boolean;
};


export async function createDriver(
  data: CreateDriverPayload,
) {
  const response =
    await api.post(
      "/drivers",
      data,
    );

  return response.data;
}


export async function updateDriver(
  id: string,
  data: {
    cooperativeId?: string;
    licenseNumber?: string;
    licenseExpiry?: string;
    emergencyContact?: string;
    emergencyPhone?: string;
    isActive?: boolean;
  },
): Promise<DriverProfile> {
  const response =
    await api.patch(
      `/drivers/${id}`,
      data,
    );

  return response.data;
}


export async function deleteDriver(
  id: string,
): Promise<unknown> {
  const response =
    await api.delete(
      `/drivers/${id}`,
    );

  return response.data;
}


export async function getMyDriverProfile(): Promise<
  DriverProfile
> {
  const response =
    await api.get(
      "/drivers/me",
    );

  return response.data;
}


export async function updateMyDriverProfile(
  driverProfileId: string,
  data: {
    licenseNumber?: string;
    licenseExpiry?: string;
    emergencyContact?: string;
    emergencyPhone?: string;
  },
): Promise<DriverProfile> {
  const response =
    await api.patch(
      `/drivers/${driverProfileId}/me`,
      data,
    );

  return response.data;
}


// ============================================================
// DRIVER-OWNED TRIP CREATION
// ============================================================

export async function createMyDriverTrip(
  data: {
    routeId: string;
    municipalityId: string;
    tripNumber?: string;
    notes?: string;
  },
): Promise<DriverTrip> {
  const response =
    await api.post(
      "/driver/trips",
      data,
    );

  return response.data;
}


// ============================================================
// DRIVER TRIPS
// ============================================================

export async function getMyDriverTrips(): Promise<
  DriverTrip[]
> {
  const response =
    await api.get(
      "/driver/trips",
    );

  if (
    Array.isArray(
      response.data,
    )
  ) {
    return response.data;
  }

  if (
    response.data &&
    Array.isArray(
      response.data.data,
    )
  ) {
    return response.data.data;
  }

  return [];
}


export async function getMyDriverTrip(
  tripId: string,
): Promise<DriverTrip> {
  const response =
    await api.get(
      `/driver/trips/${tripId}`,
    );

  return response.data;
}


// ============================================================
// DRIVER OPERATIONS
// ============================================================

export async function startMyTripBoarding(
  tripId: string,
): Promise<DriverTrip> {
  const response =
    await api.patch(
      `/driver/trips/${tripId}/boarding`,
    );

  return response.data;
}


export async function startMyTrip(
  tripId: string,
): Promise<DriverTrip> {
  const response =
    await api.patch(
      `/driver/trips/${tripId}/start`,
    );

  return response.data;
}


export async function markMyTripApproaching(
  tripId: string,
): Promise<DriverTrip> {
  const response =
    await api.patch(
      `/driver/trips/${tripId}/approaching`,
    );

  return response.data;
}


export async function markMyTripArrived(
  tripId: string,
): Promise<DriverTrip> {
  const response =
    await api.patch(
      `/driver/trips/${tripId}/arrived`,
    );

  return response.data;
}


export async function markMyTripEnRoute(
  tripId: string,
): Promise<DriverTrip> {
  return startMyTrip(
    tripId,
  );
}


// ============================================================
// ASSIGNMENTS
// ============================================================

export type DriverVehicleAssignment = {
  id: string;
  driverId: string;
  vehicleId: string;
  assignedByUserId?: string | null;
  status: string;
  assignedAt: string;
  releasedAt?: string | null;
  notes?: string | null;
  driver?: DriverProfile;
  vehicle?: DriverVehicle;
};


export async function getAssignments(): Promise<
  DriverVehicleAssignment[]
> {
  const response =
    await api.get(
      "/assignments",
    );

  return Array.isArray(
    response.data,
  )
    ? response.data
    : [];
}


export async function assignVehicleToDriver(
  driverId: string,
  vehicleId: string,
  notes?: string,
): Promise<DriverVehicleAssignment> {
  const response =
    await api.post(
      "/assignments",
      {
        driverId,
        vehicleId,
        ...(notes?.trim()
          ? {
              notes:
                notes.trim(),
            }
          : {}),
      },
    );

  return response.data;
}


export async function releaseVehicleAssignment(
  assignmentId: string,
): Promise<DriverVehicleAssignment> {
  const response =
    await api.patch(
      `/assignments/${assignmentId}`,
      {
        status:
          "RELEASED",
      },
    );

  return response.data;
}


export async function deleteVehicleAssignment(
  assignmentId: string,
): Promise<unknown> {
  const response =
    await api.delete(
      `/assignments/${assignmentId}`,
    );

  return response.data;
}


export async function removeDriver(
  id: string,
): Promise<unknown> {
  return deleteDriver(
    id,
  );
}
