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
      <div className="rounded-xl bg-white p-4 shadow-sm dark:bg-slate-900 sm:p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">Reports</h1>
        <p className="text-gray-500 dark:text-slate-400">Transport operation analytics</p>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-2 gap-4 sm:flex sm:flex-wrap sm:justify-center sm:gap-6">
        <Card title="Total Trips" value={summary.totalTrips} />
        <Card title="Completed Trips" value={summary.completedTrips} />
      </div>

      {/* PERFORMANCE */}
      <div className="overflow-hidden rounded-xl bg-white shadow-sm dark:bg-slate-900">
        <div className="p-4 sm:p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white sm:text-xl">Trip Performance</h2>
        </div>

        {trips.length === 0 ? (
          <div className="p-6 text-center text-gray-500 dark:text-slate-400">
            No trips found.
          </div>
        ) : (
          <>
            {/* MOBILE CARD LIST */}
            <div className="space-y-4 border-t border-gray-100 p-4 dark:border-slate-800 md:hidden">
              {trips.map((trip: any) => (
                <div
                  key={trip.id}
                  className="rounded-lg border border-gray-100 p-4 dark:border-slate-800"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {trip.tripNumber}
                    </p>
                    <span className="shrink-0 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700 dark:bg-green-950/40 dark:text-green-300">
                      {trip.status}
                    </span>
                  </div>

                  <dl className="mt-3 space-y-1 text-sm">
                    <div className="flex justify-between gap-3">
                      <dt className="text-gray-500 dark:text-slate-400">Driver</dt>
                      <dd className="truncate text-right text-gray-700 dark:text-slate-300">
                        {trip.driver?.user?.displayName ?? "-"}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-gray-500 dark:text-slate-400">Vehicle</dt>
                      <dd className="truncate text-right text-gray-700 dark:text-slate-300">
                        {trip.vehicle?.plateNumber}
                        {trip.vehicle?.make ? ` · ${trip.vehicle.make} ${trip.vehicle?.model ?? ""}` : ""}
                      </dd>
                    </div>
                    
                    <div className="flex justify-between gap-3">
                      <dt className="text-gray-500 dark:text-slate-400">Date</dt>
                      <dd className="text-right text-gray-700 dark:text-slate-300">
                        {new Date(trip.createdAt).toLocaleDateString()}
                      </dd>
                    </div>
                  </dl>
                </div>
              ))}
            </div>

            {/* DESKTOP TABLE */}
            <div className="hidden overflow-x-auto md:block">
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
          </>
        )}
      </div>
    </div>
  );
}

function Card({ title, value }: { title: string; value: any }) {
  return (
    <div className="w-full rounded-xl bg-white p-4 shadow-sm dark:bg-slate-900 sm:max-w-xs sm:p-6">
      <p className="text-sm text-gray-500 dark:text-slate-400">{title}</p>
      <h2 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">{value}</h2>
    </div>
  );
}
