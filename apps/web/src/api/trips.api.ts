import api from "./axios";


export async function getTrip(id:string){

  const response =
    await api.get(
      `/trips/${id}`,
    );


  return response.data;

}