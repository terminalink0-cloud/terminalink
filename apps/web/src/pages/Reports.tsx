// apps/web/src/pages/Reports.tsx

import { useQuery } from "@tanstack/react-query";
import { getReports } from "../api/reports.api";

export default function Reports() {
  const { data, isLoading } = useQuery({
    queryKey: ["reports"],
    queryFn: getReports,
  });

  if (isLoading) {
    return (
      <div className="p-6 text-gray-600 dark:text-slate-300">
        Loading reports...
      </div>
    );
  }

  const summary = data?.summary ?? {
    totalTrips: 0,
    completedTrips: 0,
    passengers: 0,
    revenue: 0,
  };

  const trips = data?.trips ?? [];

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-slate-900">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Reports</h1>
        <p className="text-gray-500 dark:text-slate-400">Transport operation analytics</p>
      </div>

      {/* SUMMARY CARDS - centered */}
      <div className="flex flex-wrap justify-center gap-6">
        <Card title="Total Trips" value={summary.totalTrips} />
        <Card title="Completed Trips" value={summary.completedTrips} />
      </div>

      {/* PERFORMANCE TABLE */}
      <div className="overflow-hidden rounded-xl bg-white shadow-sm dark:bg-slate-900">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Trip Performance</h2>
        </div>

        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-200 text-sm text-gray-500 dark:border-slate-800 dark:text-slate-400">
              <th className="p-4">Trip</th>
              <th className="p-4">Driver</th>
              <th className="p-4">Vehicle</th>
              <th className="p-4">Passengers</th>
              <th className="p-4">Status</th>
              <th className="p-4">Date</th>
            </tr>
          </thead>
          <tbody>
            {trips.map((trip: any) => (
              <tr
                key={trip.id}
                className="border-b border-gray-100 hover:bg-gray-50 dark:border-slate-800 dark:hover:bg-slate-800/50"
              >
                <td className="p-4 text-gray-900 dark:text-white">{trip.tripNumber}</td>
                <td className="p-4 text-gray-700 dark:text-slate-300">
                  {trip.driver?.user?.displayName ?? "-"}
                </td>
                <td className="p-4">
                  <div className="text-gray-900 dark:text-white">{trip.vehicle?.plateNumber}</div>
                  <div className="text-sm text-gray-500 dark:text-slate-400">
                    {trip.vehicle?.make} {trip.vehicle?.model}
                  </div>
                </td>
                <td className="p-4 text-gray-900 dark:text-white">
                  {trip.boardings?.length ?? 0}
                </td>
                <td className="p-4">
                  <span className="rounded-full bg-green-100 px-3 py-1 text-sm text-green-700 dark:bg-green-950/40 dark:text-green-300">
                    {trip.status}
                  </span>
                </td>
                <td className="p-4 text-gray-700 dark:text-slate-300">
                  {new Date(trip.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Card({ title, value }: { title: string; value: any }) {
  return (
    <div className="w-full max-w-xs rounded-xl bg-white p-6 shadow-sm dark:bg-slate-900">
      <p className="text-sm text-gray-500 dark:text-slate-400">{title}</p>
      <h2 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{value}</h2>
    </div>
  );
}