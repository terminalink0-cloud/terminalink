
// apps/web/src/api/dispatcher.api.ts

import api from "./axios";


// ============================================================
// TYPES
// ============================================================

export type CreateDispatcherData = {
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  terminalName: string;
};

export type UpdateDispatcherData = {
  terminalName?: string;
  isActive?: boolean;
};

export type UpdateTripStatusData = {
  status: string;
};

export type DepartTripData = {
  confirmUnfilledSeats?: boolean;
};


// ============================================================
// ADMIN DISPATCHER MANAGEMENT
// ============================================================

export async function getDispatchers() {
  const response =
    await api.get(
      "/dispatchers",
    );

  return response.data;
}


export async function getDispatcher(
  id: string,
) {
  const response =
    await api.get(
      `/dispatchers/${id}`,
    );

  return response.data;
}


export async function createDispatcher(
  data: CreateDispatcherData,
) {
  const response =
    await api.post(
      "/dispatchers",
      data,
    );

  return response.data;
}


export async function updateDispatcher(
  id: string,
  data: UpdateDispatcherData,
) {
  const response =
    await api.patch(
      `/dispatchers/${id}`,
      data,
    );

  return response.data;
}


export async function deleteDispatcher(
  id: string,
) {
  const response =
    await api.delete(
      `/dispatchers/${id}`,
    );

  return response.data;
}


// ============================================================
// DISPATCHER OPERATIONS
// ============================================================

export async function getDispatcherDashboard() {
  const response =
    await api.get(
      "/dispatcher/dashboard",
    );

  return response.data;
}


export async function getIncomingTrips() {
  const response =
    await api.get(
      "/dispatcher/trips/incoming",
    );

  return response.data;
}


export async function updateTripStatus(
  tripId: string,
  status: string,
) {
  const data: UpdateTripStatusData = {
    status,
  };

  const response =
    await api.patch(
      `/dispatcher/trips/${tripId}/status`,
      data,
    );

  return response.data;
}


export async function markTripArrived(
  tripId: string,
) {
  const response =
    await api.patch(
      `/dispatcher/trips/${tripId}/arrived`,
    );

  return response.data;
}


export async function startBoarding(
  tripId: string,
) {
  const response =
    await api.patch(
      `/dispatcher/trips/${tripId}/boarding`,
    );

  return response.data;
}


// ============================================================
// DEPARTURE
// ============================================================

export async function departTrip(
  tripId: string,
  confirmUnfilledSeats = false,
) {
  const data: DepartTripData = {
    confirmUnfilledSeats,
  };

  const response =
    await api.patch(
      `/dispatcher/trips/${tripId}/depart`,
      data,
    );

  return response.data;
}

export async function completeTrip(
  tripId: string,
) {
  const response =
    await api.patch(
      `/dispatcher/trips/${tripId}/complete`,
    );

  return response.data;
}