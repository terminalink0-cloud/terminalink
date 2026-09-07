
// apps/web/src/api/routes.api.ts

import api from "./axios";

export async function getRoutes() {
  const response = await api.get("/routes");

  return response.data;
}

export async function getRoute(id: string) {
  const response = await api.get(`/routes/${id}`);

  return response.data;
}
