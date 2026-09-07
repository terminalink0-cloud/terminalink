import api from "./axios";


export async function getTrip(id:string){

  const response =
    await api.get(
      `/trips/${id}`,
    );


  return response.data;

}

export type TripReport = {
  id: string;
  passengerName?: string;
  driverName?: string;
  vehicleNumber?: string;
  status?: string;
  fare?: number | string;
};