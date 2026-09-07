
// apps/web/src/api/assignments.api.ts

import api from "./axios";

export type AssignmentVehicle = {
  id: string;
  cooperativeId: string;
  plateNumber: string;
  bodyNumber?: string | null;
  seatCapacity: number;
  make?: string | null;
  model?: string | null;
  status: string;
};

export type AssignmentDriver = {
  id: string;
  cooperativeId: string;
  licenseNumber: string;
  isActive: boolean;
  user?: {
    id?: string;
    username?: string;
    displayName?: string;
    role?: string;
    status?: string;
  };
};

export type DriverVehicleAssignment = {
  id: string;
  driverId: string;
  vehicleId: string;
  assignedByUserId?: string | null;
  status: string;
  assignedAt: string;
  releasedAt?: string | null;
  notes?: string | null;

  driver?: AssignmentDriver;
  vehicle?: AssignmentVehicle;
};

export async function getAssignments(): Promise<
  DriverVehicleAssignment[]
> {
  const response =
    await api.get("/assignments");

  if (Array.isArray(response.data)) {
    return response.data;
  }

  if (
    response.data &&
    Array.isArray(response.data.data)
  ) {
    return response.data.data;
  }

  return [];
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
              notes: notes.trim(),
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
        status: "RELEASED",
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
