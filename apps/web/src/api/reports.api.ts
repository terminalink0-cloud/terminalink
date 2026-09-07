import api from "./axios";



/*
|--------------------------------------------------------------------------
| DASHBOARD
|--------------------------------------------------------------------------
*/


export async function getDashboard() {

  const response =
    await api.get(
      "/reports/dashboard"
    );


  return response.data;

}



/*
|--------------------------------------------------------------------------
| REPORTS
|--------------------------------------------------------------------------
*/


export async function getReports() {

  const response =
    await api.get(
      "/reports"
    );


  return response.data;

}



/*
|--------------------------------------------------------------------------
| TRIP PERFORMANCE
|--------------------------------------------------------------------------
*/


export async function getTripReports() {

  const response =
    await api.get(
      "/reports/trips"
    );


  return response.data;

}



/*
|--------------------------------------------------------------------------
| REVENUE
|--------------------------------------------------------------------------
*/


export async function getRevenueReport() {

  const response =
    await api.get(
      "/reports/revenue"
    );


  return response.data;

}