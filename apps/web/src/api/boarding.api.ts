import api from "./axios";


export type BoardingRecord = {

  id: string;

  tripId: string;

  passengerName: string;

  seatNumber: number | null;

  boardedAt: string;

};



export type BoardingAudit = {

  id: string;

  previousAvailableSeats: number;

  newAvailableSeats: number;

  updatedByUserId: string | null;

  createdAt: string;

  dispatcher: {

    id: string;

    username: string;

    role: string;

    displayName: string;

  } | null;

};



export type BoardingSummary = {

  tripId: string;

  tripNumber: string;

  status: string;

  seatCapacity: number;

  boardedCount: number;

  availableSeats: number;

  isFull: boolean;

  boardings: BoardingRecord[];

  latestBoardingAudit:
    BoardingAudit | null;

};



export async function boardPassenger(
  data: {
    tripId: string;

    passengerName: string;

    seatNumber?: number;
  },
) {

  const response =
    await api.post(
      "/boarding",
      data,
    );


  return response.data;

}



export async function getTripBoardings(
  tripId: string,
) {

  const response =
    await api.get(
      `/boarding/trip/${tripId}`,
    );


  return response.data as BoardingRecord[];

}



export async function getTripBoardingSummary(
  tripId: string,
) {

  const response =
    await api.get(
      `/boarding/trip/${tripId}/summary`,
    );


  return response.data as BoardingSummary;

}