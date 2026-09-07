// apps/web/src/components/TripsTable.tsx

export type TripReport = {
  id: string;
  passengerName?: string;
  driverName?: string;
  vehicleNumber?: string;
  status?: string;
  fare?: number | string;
};

type Props = {
  trips: TripReport[];
};

export default function TripsTable({ trips }: Props) {
  return (
    <div className="overflow-hidden rounded-xl border bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <table className="w-full">
        <thead className="border-b bg-gray-50 dark:border-slate-800 dark:bg-slate-800/50">
          <tr>
            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-slate-300">
              Passenger
            </th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-slate-300">
              Driver
            </th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-slate-300">
              Vehicle
            </th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-slate-300">
              Status
            </th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-slate-300">
              Fare
            </th>
          </tr>
        </thead>
        <tbody>
          {trips.map((trip) => (
            <tr
              key={trip.id}
              className="border-b border-gray-100 hover:bg-gray-50 dark:border-slate-800 dark:hover:bg-slate-800/50"
            >
              <td className="px-6 py-4 text-gray-900 dark:text-white">
                {trip.passengerName ?? "-"}
              </td>
              <td className="px-6 py-4 text-gray-700 dark:text-slate-300">
                {trip.driverName ?? "-"}
              </td>
              <td className="px-6 py-4 text-gray-700 dark:text-slate-300">
                {trip.vehicleNumber ?? "-"}
              </td>
              <td className="px-6 py-4">
                <span className="rounded-full bg-green-100 px-3 py-1 text-sm text-green-700 dark:bg-green-950/40 dark:text-green-300">
                  {trip.status ?? "-"}
                </span>
              </td>
              <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                ₱{trip.fare ?? 0}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}