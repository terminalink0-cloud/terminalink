import axios from "axios";


const API_URL =
  "http://localhost:3001/vehicles";



const authHeaders = () => {

  const token =
    localStorage.getItem("token");


  return {

    headers: {

      Authorization:
        `Bearer ${token}`

    }

  };

};






export async function getVehicles(){


  const res =
    await axios.get(

      API_URL,

      authHeaders()

    );


  return res.data;

}







export async function getVehicle(
  id:string
){


  const res =
    await axios.get(

      `${API_URL}/${id}`,

      authHeaders()

    );


  return res.data;

}







export async function createVehicle(
  data:any
){


  const res =
    await axios.post(

      API_URL,

      data,

      authHeaders()

    );


  return res.data;

}







export async function updateVehicle(
  id:string,
  data:any
){


  const res =
    await axios.patch(

      `${API_URL}/${id}`,

      data,

      authHeaders()

    );


  return res.data;

}







export async function deleteVehicle(
  id:string
){


  const res =
    await axios.delete(

      `${API_URL}/${id}`,

      authHeaders()

    );


  return res.data;

}