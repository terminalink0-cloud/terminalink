// apps/web/src/pages/DriverDetails.tsx

import { useQuery } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { getDriver } from "../api/driver.api";
import type { DriverProfile as BaseDriverProfile } from "../api/driver.api";

type DriverWithDetails = BaseDriverProfile & {
  vehicle?: {
    plateNumber?: string;
    make?: string;
    model?: string;
    seatCapacity?: number;
  };
  trips?: Array<{
    id: string;
    tripNumber?: string;
    status?: string;
    createdAt?: string;
  }>;
};

function formatDate(value?: string | null): string {
  if (!value) return "-";
  const date = new Date(value);
  if (isNaN(date.getTime())) return "-";
  return date.toLocaleDateString();
}

export default function DriverDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: driver, isLoading } = useQuery<DriverWithDetails>({
    queryKey: ["driver", id],
    queryFn: () => getDriver(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return <div className="p-6 text-gray-500 dark:text-slate-400">Loading driver...</div>;
  }

  if (!driver) {
    return <div className="p-6 text-red-500">Driver not found.</div>;
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="rounded-lg bg-gray-200 px-4 py-2 dark:bg-slate-700 dark:text-white"
      >
        ← Back
      </button>

      {/* PROFILE */}
      <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-slate-900">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {driver.user?.displayName ?? "Driver"}
        </h1>
        <p className="text-gray-500 dark:text-slate-400">
          Username: {driver.user?.username ?? "-"}
        </p>
        <span
          className={`mt-3 inline-block rounded-full px-3 py-1 text-sm ${
            driver.isActive
              ? "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300"
              : "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300"
          }`}
        >
          {driver.isActive ? "ACTIVE" : "INACTIVE"}
        </span>
      </div>

      {/* DRIVER INFO */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-slate-900">
          <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
            License Information
          </h2>
          <p className="text-gray-700 dark:text-slate-300">
            License: <strong>{driver.licenseNumber ?? "-"}</strong>
          </p>
          <p className="text-gray-700 dark:text-slate-300">
            Expiry: <strong>{formatDate(driver.licenseExpiry)}</strong>
          </p>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-slate-900">
          <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
            Emergency Contact
          </h2>
          <p className="text-gray-700 dark:text-slate-300">{driver.emergencyContact ?? "-"}</p>
          <p className="text-gray-500 dark:text-slate-400">{driver.emergencyPhone ?? "-"}</p>
        </div>
      </div>

      {/* VEHICLE */}
      <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-slate-900">
        <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
          Assigned Vehicle
        </h2>
        {driver.vehicle ? (
          <div className="text-gray-700 dark:text-slate-300">
            <p>
              Plate: <strong>{driver.vehicle.plateNumber ?? "-"}</strong>
            </p>
            <p>
              Vehicle: {driver.vehicle.make ?? "-"} {driver.vehicle.model ?? "-"}
            </p>
            <p>Seats: {driver.vehicle.seatCapacity ?? "-"}</p>
          </div>
        ) : (
          <p className="text-gray-500 dark:text-slate-400">No assigned vehicle.</p>
        )}
      </div>

      {/* TRIPS */}
      <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-slate-900">
        <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
          Trip History
        </h2>
        {driver.trips && driver.trips.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500 dark:border-slate-800 dark:text-slate-400">
                  <th className="p-3">Trip</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {driver.trips.map((trip) => (
                  <tr key={trip.id} className="border-b border-gray-100 dark:border-slate-800">
                    <td className="p-3 text-gray-900 dark:text-white">{trip.tripNumber ?? trip.id}</td>
                    <td className="p-3 text-gray-700 dark:text-slate-300">{trip.status ?? "-"}</td>
                    <td className="p-3 text-gray-700 dark:text-slate-300">{formatDate(trip.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 dark:text-slate-400">No trips found.</p>
        )}
      </div>
    </div>
  );
}