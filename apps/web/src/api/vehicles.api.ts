import client from "./client"; // or "./axios" depending on which shared instance you use

export async function getVehicles() {
  const res = await client.get("/vehicles");
  return res.data;
}

export async function getVehicle(id: string) {
  const res = await client.get(`/vehicles/${id}`);
  return res.data;
}

export async function createVehicle(data: any) {
  const res = await client.post("/vehicles", data);
  return res.data;
}

export async function updateVehicle(id: string, data: any) {
  const res = await client.patch(`/vehicles/${id}`, data);
  return res.data;
}

export async function deleteVehicle(id: string) {
  const res = await client.delete(`/vehicles/${id}`);
  return res.data;
}