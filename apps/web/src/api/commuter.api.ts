import api from "./axios";


export type LiveVehicle = {
  tripId: string;
  tripLegId: string;

  tripNumber: string;

  status: string;

  availableSeats: number;
  seatCapacity: number;

  vehicle: {
    id: string;
    plateNumber: string;
    make: string | null;
    model: string | null;
  };

  driver: {
    id: string;
    displayName: string;
  };

  cooperative: {
    id: string;
    name: string;
  };

  route: {
    origin: string;
    destination: string;
  };

  location: {
    latitude: number;
    longitude: number;
    accuracy: number | null;
    heading: number | null;
    speed: number | null;
    recordedAt: string;
  };
};


export async function getLiveVehicles(): Promise<
  LiveVehicle[]
> {
  const response =
    await api.get(
      "/tracking/live",
    );

  return Array.isArray(
    response.data,
  )
    ? response.data
    : [];
}