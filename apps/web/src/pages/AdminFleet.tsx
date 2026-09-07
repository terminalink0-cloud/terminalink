// apps/web/src/pages/AdminFleet.tsx

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteDriver, getDrivers, updateDriver } from "../api/driver.api";
import { deleteVehicle, getVehicles, updateVehicle } from "../api/vehicles.api";
import api from "../api/axios";
import AddDriverModal from "../components/AddDriverModal";
import AddVehicleModal from "../components/AddVehicleModal";

// ============================================================
// TYPES
// ============================================================

type Vehicle = {
  id: string;
  cooperativeId?: string;
  plateNumber?: string;
  bodyNumber?: string | null;
  make?: string | null;
  model?: string | null;
  yearModel?: number | null;
  seatCapacity?: number;
  color?: string | null;
  qrToken?: string;
  status?: string;
  deletedAt?: string | null;
};

type Driver = {
  id: string;
  cooperativeId?: string;
  user?: {
    id?: string;
    displayName?: string;
    username?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
  };
  cooperative?: {
    id?: string;
    name?: string;
    code?: string;
  };
  licenseNumber?: string;
  licenseExpiry?: string | null;
  emergencyContact?: string | null;
  emergencyPhone?: string | null;
  isActive?: boolean;
  activeVehicleAssignment?: {
    id: string;
    status: string;
    assignedAt?: string;
    releasedAt?: string | null;
    notes?: string | null;
    vehicle?: Vehicle | null;
  } | null;
};

type Cooperative = {
  id: string;
  name: string;
  code?: string;
  active?: boolean;
};

type AssignmentForm = {
  vehicleId: string;
  notes: string;
};

type EditDriverForm = {
  licenseNumber: string;
  licenseExpiry: string;
  emergencyContact: string;
  emergencyPhone: string;
  isActive: boolean;
};

type EditVehicleForm = {
  plateNumber: string;
  bodyNumber: string;
  make: string;
  model: string;
  yearModel: string;
  color: string;
  seatCapacity: string;
};

type ApiError = {
  response?: { data?: { message?: string | string[] } | string };
  message?: string;
};

// ============================================================
// HELPERS
// ============================================================

function getErrorMessage(error: unknown): string {
  if (typeof error !== "object" || error === null) {
    return "An unexpected error occurred.";
  }
  const value = error as ApiError;
  const responseData = value.response?.data;
  if (typeof responseData === "string") return responseData;
  if (responseData && typeof responseData === "object") {
    const message = responseData.message;
    if (Array.isArray(message)) return message.join(", ");
    if (typeof message === "string") return message;
  }
  if (typeof value.message === "string" && value.message.trim()) {
    return value.message;
  }
  return "An unexpected error occurred.";
}

function normalizeArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (typeof value === "object" && value !== null) {
    const data = (value as { data?: unknown }).data;
    if (Array.isArray(data)) return data as T[];
  }
  return [];
}

function formatDate(value?: string | null): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString();
}

function driverLabel(driver: Driver): string {
  const displayName = driver.user?.displayName?.trim();
  if (displayName) return displayName;
  const fullName = [driver.user?.firstName, driver.user?.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();
  if (fullName) return fullName;
  const username = driver.user?.username?.trim();
  if (username) return username;
  return "Driver";
}

function vehicleLabel(vehicle?: Vehicle | null): string {
  if (!vehicle) return "No vehicle assigned";
  const name = [vehicle.make, vehicle.model].filter(Boolean).join(" ");
  if (name) return `${vehicle.plateNumber ?? "-"} — ${name}`;
  return vehicle.plateNumber ?? "Vehicle";
}

function getVehicleStatusClass(status?: string): string {
  switch (String(status ?? "").toUpperCase()) {
    case "ACTIVE":
      return "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300";
    case "INACTIVE":
      return "bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-300";
    case "MAINTENANCE":
      return "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-300";
    default:
      return "bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-300";
  }
}

// ============================================================
// COMPONENT
// ============================================================

export default function AdminFleet() {
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<"drivers" | "vehicles">("drivers");
  const [search, setSearch] = useState("");
  const [addDriverOpen, setAddDriverOpen] = useState(false);
  const [addVehicleOpen, setAddVehicleOpen] = useState(false);

  const [editDriver, setEditDriver] = useState<Driver | null>(null);
  const [driverForm, setDriverForm] = useState<EditDriverForm>({
    licenseNumber: "",
    licenseExpiry: "",
    emergencyContact: "",
    emergencyPhone: "",
    isActive: true,
  });

  const [editVehicle, setEditVehicle] = useState<Vehicle | null>(null);
  const [vehicleForm, setVehicleForm] = useState<EditVehicleForm>({
    plateNumber: "",
    bodyNumber: "",
    make: "",
    model: "",
    yearModel: "",
    color: "",
    seatCapacity: "14",
  });

  const [assignmentDriver, setAssignmentDriver] = useState<Driver | null>(null);
  const [assignmentForm, setAssignmentForm] = useState<AssignmentForm>({
    vehicleId: "",
    notes: "",
  });
  const [assignmentError, setAssignmentError] = useState("");
  const [actionError, setActionError] = useState("");

  const driversQuery = useQuery<Driver[]>({
    queryKey: ["drivers"],
    queryFn: async () => normalizeArray<Driver>(await getDrivers()),
    refetchInterval: 10_000,
  });

  const vehiclesQuery = useQuery<Vehicle[]>({
    queryKey: ["vehicles"],
    queryFn: async () => normalizeArray<Vehicle>(await getVehicles()),
    refetchInterval: 10_000,
  });

  const cooperativesQuery = useQuery<Cooperative[]>({
    queryKey: ["cooperatives"],
    queryFn: async () => {
      const response = await api.get("/cooperatives");
      return normalizeArray<Cooperative>(response.data);
    },
    staleTime: 60_000,
  });

  const drivers = driversQuery.data ?? [];
  const vehicles = vehiclesQuery.data ?? [];
  const cooperatives = cooperativesQuery.data ?? [];

  const availableVehicles = useMemo(() => {
    const assignedIds = new Set(
      drivers
        .map((driver) => driver.activeVehicleAssignment?.vehicle?.id)
        .filter((value): value is string => Boolean(value)),
    );
    return vehicles.filter((vehicle) => {
      if (vehicle.status !== "ACTIVE") return false;
      if (vehicle.deletedAt) return false;
      return !assignedIds.has(vehicle.id);
    });
  }, [drivers, vehicles]);

  const filteredDrivers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return drivers;
    return drivers.filter((driver) => {
      const name = driverLabel(driver).toLowerCase();
      const username = (driver.user?.username ?? "").toLowerCase();
      const license = (driver.licenseNumber ?? "").toLowerCase();
      const cooperative = (driver.cooperative?.name ?? "").toLowerCase();
      return name.includes(query) || username.includes(query) || license.includes(query) || cooperative.includes(query);
    });
  }, [drivers, search]);

  const filteredVehicles = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return vehicles;
    return vehicles.filter((vehicle) => {
      const plate = (vehicle.plateNumber ?? "").toLowerCase();
      const make = (vehicle.make ?? "").toLowerCase();
      const model = (vehicle.model ?? "").toLowerCase();
      const cooperativeName = (cooperatives.find((item) => item.id === vehicle.cooperativeId)?.name ?? "").toLowerCase();
      return plate.includes(query) || make.includes(query) || model.includes(query) || cooperativeName.includes(query);
    });
  }, [vehicles, cooperatives, search]);

  const activeDrivers = drivers.filter((driver) => driver.isActive !== false).length;
  const activeVehicles = vehicles.filter((vehicle) => vehicle.status === "ACTIVE" && !vehicle.deletedAt).length;

  const assignmentMutation = useMutation({
    mutationFn: async ({ driverId, vehicleId, notes }: { driverId: string; vehicleId: string; notes?: string }) => {
      const response = await api.post("/assignments", {
        driverId,
        vehicleId,
        notes: notes?.trim() || undefined,
      });
      return response.data;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["drivers"] }),
        queryClient.invalidateQueries({ queryKey: ["vehicles"] }),
      ]);
      setAssignmentDriver(null);
      setAssignmentForm({ vehicleId: "", notes: "" });
      setAssignmentError("");
    },
    onError: (error) => {
      setAssignmentError(getErrorMessage(error));
    },
  });

  const updateDriverMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: { licenseNumber: string; licenseExpiry?: string; emergencyContact?: string; emergencyPhone?: string; isActive?: boolean } }) => {
      return updateDriver(id, payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["drivers"] });
      setEditDriver(null);
      setActionError("");
    },
    onError: (error) => {
      setActionError(getErrorMessage(error));
    },
  });

  const deleteDriverMutation = useMutation({
    mutationFn: async (driverId: string) => deleteDriver(driverId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["drivers"] }),
        queryClient.invalidateQueries({ queryKey: ["vehicles"] }),
      ]);
      setActionError("");
    },
    onError: (error) => {
      setActionError(getErrorMessage(error));
    },
  });

  const updateVehicleMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: { plateNumber: string; bodyNumber?: string; make?: string; model?: string; yearModel?: number; color?: string; seatCapacity: number } }) => {
      return updateVehicle(id, payload);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["vehicles"] }),
        queryClient.invalidateQueries({ queryKey: ["drivers"] }),
      ]);
      setEditVehicle(null);
      setActionError("");
    },
    onError: (error) => {
      setActionError(getErrorMessage(error));
    },
  });

  const deleteVehicleMutation = useMutation({
    mutationFn: async (vehicleId: string) => deleteVehicle(vehicleId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["vehicles"] }),
        queryClient.invalidateQueries({ queryKey: ["drivers"] }),
      ]);
      setActionError("");
    },
    onError: (error) => {
      setActionError(getErrorMessage(error));
    },
  });

  function openAssignment(driver: Driver) {
    setAssignmentDriver(driver);
    setAssignmentForm({ vehicleId: "", notes: "" });
    setAssignmentError("");
  }

  function openDriverEdit(driver: Driver) {
    setActionError("");
    setDriverForm({
      licenseNumber: driver.licenseNumber ?? "",
      licenseExpiry: driver.licenseExpiry ? driver.licenseExpiry.slice(0, 10) : "",
      emergencyContact: driver.emergencyContact ?? "",
      emergencyPhone: driver.emergencyPhone ?? "",
      isActive: driver.isActive !== false,
    });
    setEditDriver(driver);
  }

  function openVehicleEdit(vehicle: Vehicle) {
    setActionError("");
    setVehicleForm({
      plateNumber: vehicle.plateNumber ?? "",
      bodyNumber: vehicle.bodyNumber ?? "",
      make: vehicle.make ?? "",
      model: vehicle.model ?? "",
      yearModel: vehicle.yearModel ? String(vehicle.yearModel) : "",
      color: vehicle.color ?? "",
      seatCapacity: String(vehicle.seatCapacity ?? 14),
    });
    setEditVehicle(vehicle);
  }

  function saveDriver() {
    if (!editDriver) return;
    const license = driverForm.licenseNumber.trim();
    if (!license) {
      setActionError("License number is required.");
      return;
    }
    updateDriverMutation.mutate({
      id: editDriver.id,
      payload: {
        licenseNumber: license,
        licenseExpiry: driverForm.licenseExpiry || undefined,
        emergencyContact: driverForm.emergencyContact.trim() || undefined,
        emergencyPhone: driverForm.emergencyPhone.trim() || undefined,
        isActive: driverForm.isActive,
      },
    });
  }

  function saveVehicle() {
    if (!editVehicle) return;
    const plate = vehicleForm.plateNumber.trim().toUpperCase();
    const capacity = Number(vehicleForm.seatCapacity);
    if (!plate) {
      setActionError("Plate number is required.");
      return;
    }
    if (!Number.isInteger(capacity) || capacity <= 0) {
      setActionError("Seat capacity must be a positive whole number.");
      return;
    }
    const yearModel = vehicleForm.yearModel.trim() ? Number(vehicleForm.yearModel) : undefined;
    if (yearModel !== undefined && (!Number.isInteger(yearModel) || yearModel < 1900 || yearModel > new Date().getFullYear() + 1)) {
      setActionError("Please enter a valid year model.");
      return;
    }
    updateVehicleMutation.mutate({
      id: editVehicle.id,
      payload: {
        plateNumber: plate,
        bodyNumber: vehicleForm.bodyNumber.trim() || undefined,
        make: vehicleForm.make.trim() || undefined,
        model: vehicleForm.model.trim() || undefined,
        yearModel,
        color: vehicleForm.color.trim() || undefined,
        seatCapacity: capacity,
      },
    });
  }

  function submitAssignment() {
    if (!assignmentDriver) return;
    if (!assignmentForm.vehicleId) {
      setAssignmentError("Please select a vehicle.");
      return;
    }
    assignmentMutation.mutate({
      driverId: assignmentDriver.id,
      vehicleId: assignmentForm.vehicleId,
      notes: assignmentForm.notes,
    });
  }

  function handleDeleteDriver(driver: Driver) {
    setActionError("");
    const confirmed = window.confirm(
      `Delete driver "${driverLabel(driver)}"?\n\nDrivers with operational history may not be permanently deletable. In that case, deactivate the driver instead.`,
    );
    if (!confirmed) return;
    deleteDriverMutation.mutate(driver.id);
  }

  function handleDeleteVehicle(vehicle: Vehicle) {
    setActionError("");
    const confirmed = window.confirm(
      `Delete vehicle "${vehicle.plateNumber ?? "this vehicle"}"?\n\nVehicles with trips, assignments, or GPS history may not be permanently deletable.`,
    );
    if (!confirmed) return;
    deleteVehicleMutation.mutate(vehicle.id);
  }

  if (driversQuery.isLoading || vehiclesQuery.isLoading || cooperativesQuery.isLoading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <div className="rounded-2xl bg-white px-6 py-5 text-sm text-gray-500 shadow-sm dark:bg-slate-900 dark:text-slate-400">
          Loading fleet...
        </div>
      </div>
    );
  }

  if (driversQuery.isError || vehiclesQuery.isError || cooperativesQuery.isError) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 dark:border-red-900/50 dark:bg-red-950/30">
        <h2 className="font-semibold text-red-800 dark:text-red-200">Unable to load fleet data.</h2>
        <p className="mt-2 text-sm text-red-700 dark:text-red-300">
          {getErrorMessage(driversQuery.error ?? vehiclesQuery.error ?? cooperativesQuery.error)}
        </p>
        <button
          type="button"
          onClick={() => {
            void Promise.all([
              driversQuery.refetch(),
              vehiclesQuery.refetch(),
              cooperativesQuery.refetch(),
            ]);
          }}
          className="mt-4 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-full space-y-6">
      {/* HEADER */}
      <section className="rounded-2xl border border-blue-100/70 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Fleet Administration</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Admin Fleet</h1>
            <p className="mt-2 max-w-2xl text-sm text-gray-500 dark:text-slate-400">
              Manage drivers, UVs, cooperative assignments, and vehicle availability.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => setAddDriverOpen(true)}
              className="rounded-xl border border-blue-200 bg-blue-50 px-5 py-3 text-sm font-semibold text-blue-700 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-900/50"
            >
              + Add Driver
            </button>
            <button
              type="button"
              onClick={() => setAddVehicleOpen(true)}
              className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
            >
              + Add Vehicle
            </button>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Drivers" value={drivers.length} description={`${activeDrivers} active`} />
        <StatCard title="Vehicles" value={vehicles.length} description={`${activeVehicles} active`} />
        <StatCard title="Available UVs" value={availableVehicles.length} description="Not currently assigned" />
        <StatCard title="Cooperatives" value={cooperatives.length} description="Registered organizations" />
      </section>

      {/* ACTION ERROR */}
      {actionError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          {actionError}
        </div>
      )}

      {/* TABS */}
      <section className="rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-900">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="inline-flex rounded-xl bg-gray-100 p-1 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => {
                setActiveTab("drivers");
                setSearch("");
              }}
              className={[
                "rounded-lg px-5 py-2 text-sm font-semibold",
                activeTab === "drivers"
                  ? "bg-white text-gray-900 shadow-sm dark:bg-slate-700 dark:text-white"
                  : "text-gray-500 hover:text-gray-800 dark:text-slate-400 dark:hover:text-slate-200",
              ].join(" ")}
            >
              Drivers
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("vehicles");
                setSearch("");
              }}
              className={[
                "rounded-lg px-5 py-2 text-sm font-semibold",
                activeTab === "vehicles"
                  ? "bg-white text-gray-900 shadow-sm dark:bg-slate-700 dark:text-white"
                  : "text-gray-500 hover:text-gray-800 dark:text-slate-400 dark:hover:text-slate-200",
              ].join(" ")}
            >
              Vehicles
            </button>
          </div>
          <div className="w-full lg:max-w-md">
            <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-slate-400">Search</label>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={
                activeTab === "drivers"
                  ? "Search driver, username, license, cooperative..."
                  : "Search plate, make, model, cooperative..."
              }
              className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-blue-500 dark:focus:bg-slate-900 dark:focus:ring-blue-900"
            />
          </div>
        </div>
      </section>

      {/* DRIVERS TABLE */}
      {activeTab === "drivers" && (
        <section className="overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-slate-900">
          <div className="border-b border-gray-100 px-6 py-5 dark:border-slate-800">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Driver Assignments</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">Assign an active vehicle directly to each driver.</p>
          </div>

          {filteredDrivers.length === 0 ? (
            <EmptyState icon="👤" title="No drivers found" text="Add a driver or change your search." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1150px] text-left">
                <thead>
                  <tr className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-500 dark:border-slate-800 dark:text-slate-400">
                    <th className="p-4">Driver</th>
                    <th className="p-4">Cooperative</th>
                    <th className="p-4">License</th>
                    <th className="p-4">Assigned Vehicle</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDrivers.map((driver) => {
                    const assigned = driver.activeVehicleAssignment?.vehicle ?? null;
                    return (
                      <tr
                        key={driver.id}
                        className="border-b border-gray-100 align-top hover:bg-gray-50 dark:border-slate-800 dark:hover:bg-slate-800/50"
                      >
                        <td className="p-4">
                          <div className="font-semibold text-gray-900 dark:text-white">{driverLabel(driver)}</div>
                          <div className="mt-1 text-xs text-gray-500 dark:text-slate-400">@{driver.user?.username ?? "-"}</div>
                        </td>
                        <td className="p-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{driver.cooperative?.name ?? "-"}</div>
                          <div className="mt-1 text-xs text-gray-500 dark:text-slate-400">{driver.cooperative?.code ?? "-"}</div>
                        </td>
                        <td className="p-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{driver.licenseNumber ?? "-"}</div>
                          <div className="mt-1 text-xs text-gray-500 dark:text-slate-400">Expiry: {formatDate(driver.licenseExpiry)}</div>
                        </td>
                        <td className="p-4">
                          {assigned ? (
                            <>
                              <div className="font-medium text-gray-900 dark:text-white">{vehicleLabel(assigned)}</div>
                              <div className="mt-1 text-xs text-gray-500 dark:text-slate-400">{assigned.seatCapacity ?? "-"} seats</div>
                            </>
                          ) : (
                            <span className="text-sm text-gray-400 dark:text-slate-500">No vehicle assigned</span>
                          )}
                        </td>
                        <td className="p-4">
                          <span
                            className={[
                              "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
                              driver.isActive !== false
                                ? "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300"
                                : "bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-300",
                            ].join(" ")}
                          >
                            {driver.isActive !== false ? "ACTIVE" : "INACTIVE"}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => openAssignment(driver)}
                              className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-900/50"
                            >
                              {assigned ? "Change Vehicle" : "Assign Vehicle"}
                            </button>
                            <button
                              type="button"
                              onClick={() => openDriverEdit(driver)}
                              className="rounded-lg bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              disabled={deleteDriverMutation.isPending}
                              onClick={() => handleDeleteDriver(driver)}
                              className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-900/50"
                            >
                              {deleteDriverMutation.isPending ? "Deactivating..." : "Deactivate"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* VEHICLES TABLE */}
      {activeTab === "vehicles" && (
        <section className="overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-slate-900">
          <div className="border-b border-gray-100 px-6 py-5 dark:border-slate-800">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Vehicle Fleet</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">Manage UV units and cooperative ownership.</p>
          </div>

          {filteredVehicles.length === 0 ? (
            <EmptyState icon="🚐" title="No vehicles found" text="Add a vehicle or change your search." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] text-left">
                <thead>
                  <tr className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-500 dark:border-slate-800 dark:text-slate-400">
                    <th className="p-4">Vehicle</th>
                    <th className="p-4">Cooperative</th>
                    <th className="p-4">Capacity</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Driver</th>
                    <th className="p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVehicles.map((vehicle) => {
                    const driver = drivers.find((item) => item.activeVehicleAssignment?.vehicle?.id === vehicle.id);
                    const cooperative = cooperatives.find((item) => item.id === vehicle.cooperativeId);
                    return (
                      <tr key={vehicle.id} className="border-b border-gray-100 align-top hover:bg-gray-50 dark:border-slate-800 dark:hover:bg-slate-800/50">
                        <td className="p-4">
                          <div className="font-semibold text-gray-900 dark:text-white">{vehicle.plateNumber ?? "-"}</div>
                          <div className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                            {[vehicle.make, vehicle.model].filter(Boolean).join(" ") || "Vehicle"}
                          </div>
                          <div className="mt-1 text-xs text-gray-400 dark:text-slate-500">Body: {vehicle.bodyNumber ?? "-"}</div>
                        </td>
                        <td className="p-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{cooperative?.name ?? "-"}</div>
                          <div className="mt-1 text-xs text-gray-500 dark:text-slate-400">{cooperative?.code ?? "-"}</div>
                        </td>
                        <td className="p-4">
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">{vehicle.seatCapacity ?? "-"}</span>
                          <span className="ml-1 text-xs text-gray-500 dark:text-slate-400">seats</span>
                        </td>
                        <td className="p-4">
                          <span
                            className={[
                              "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
                              getVehicleStatusClass(vehicle.status),
                            ].join(" ")}
                          >
                            {vehicle.status ?? "UNKNOWN"}
                          </span>
                        </td>
                        <td className="p-4">
                          {driver ? (
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">{driverLabel(driver)}</div>
                              <div className="mt-1 text-xs text-gray-500 dark:text-slate-400">Assigned</div>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400 dark:text-slate-500">Available</span>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => openVehicleEdit(vehicle)}
                              className="rounded-lg bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              disabled={deleteVehicleMutation.isPending}
                              onClick={() => handleDeleteVehicle(vehicle)}
                              className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-900/50"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* MODALS */}
      <AddDriverModal open={addDriverOpen} onClose={() => setAddDriverOpen(false)} />
      <AddVehicleModal open={addVehicleOpen} onClose={() => setAddVehicleOpen(false)} />

      {assignmentDriver && (
        <Modal
          title={assignmentDriver.activeVehicleAssignment?.vehicle ? "Change Assigned Vehicle" : "Assign Vehicle"}
          subtitle={`Assign an active vehicle to ${driverLabel(assignmentDriver)}.`}
          onClose={() => {
            if (assignmentMutation.isPending) return;
            setAssignmentDriver(null);
            setAssignmentError("");
          }}
        >
          {assignmentError && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
              {assignmentError}
            </div>
          )}
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-slate-300">Vehicle</label>
          <select
            value={assignmentForm.vehicleId}
            onChange={(event) => setAssignmentForm((current) => ({ ...current, vehicleId: event.target.value }))}
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-blue-500 dark:focus:ring-blue-900"
          >
            <option value="">Select available vehicle</option>
            {availableVehicles
              .filter((vehicle) => !assignmentDriver.cooperativeId || vehicle.cooperativeId === assignmentDriver.cooperativeId)
              .map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicleLabel(vehicle)}
                </option>
              ))}
          </select>
          <label className="mb-1.5 mt-5 block text-sm font-medium text-gray-700 dark:text-slate-300">Notes</label>
          <textarea
            value={assignmentForm.notes}
            onChange={(event) => setAssignmentForm((current) => ({ ...current, notes: event.target.value }))}
            rows={3}
            placeholder="Optional assignment notes"
            className="w-full resize-none rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500 dark:focus:border-blue-500 dark:focus:ring-blue-900"
          />
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setAssignmentDriver(null)}
              disabled={assignmentMutation.isPending}
              className="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={submitAssignment}
              disabled={assignmentMutation.isPending || !assignmentForm.vehicleId}
              className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {assignmentMutation.isPending ? "Assigning..." : "Assign Vehicle"}
            </button>
          </div>
        </Modal>
      )}

      {editDriver && (
        <Modal title="Edit Driver" subtitle={`Update ${driverLabel(editDriver)}.`} onClose={() => setEditDriver(null)}>
          <div className="grid gap-4 md:grid-cols-2">
            <Field
              label="License Number"
              value={driverForm.licenseNumber}
              onChange={(value) => setDriverForm((current) => ({ ...current, licenseNumber: value }))}
            />
            <Field
              label="License Expiry"
              type="date"
              value={driverForm.licenseExpiry}
              onChange={(value) => setDriverForm((current) => ({ ...current, licenseExpiry: value }))}
            />
            <Field
              label="Emergency Contact"
              value={driverForm.emergencyContact}
              onChange={(value) => setDriverForm((current) => ({ ...current, emergencyContact: value }))}
            />
            <Field
              label="Emergency Phone"
              value={driverForm.emergencyPhone}
              onChange={(value) => setDriverForm((current) => ({ ...current, emergencyPhone: value }))}
            />
          </div>
          <label className="mt-5 flex cursor-pointer items-center gap-3 rounded-xl bg-gray-50 p-4 dark:bg-slate-800">
            <input
              type="checkbox"
              checked={driverForm.isActive}
              onChange={(event) => setDriverForm((current) => ({ ...current, isActive: event.target.checked }))}
              className="h-4 w-4"
            />
            <span className="text-sm font-medium text-gray-800 dark:text-slate-200">Driver account is active</span>
          </label>
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setEditDriver(null)}
              disabled={updateDriverMutation.isPending}
              className="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={saveDriver}
              disabled={updateDriverMutation.isPending}
              className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {updateDriverMutation.isPending ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </Modal>
      )}

      {editVehicle && (
        <Modal title="Edit Vehicle" subtitle={`Update ${editVehicle.plateNumber ?? "vehicle"}.`} onClose={() => setEditVehicle(null)}>
          <div className="grid gap-4 md:grid-cols-2">
            <Field
              label="Plate Number"
              value={vehicleForm.plateNumber}
              onChange={(value) => setVehicleForm((current) => ({ ...current, plateNumber: value }))}
            />
            <Field
              label="Body Number"
              value={vehicleForm.bodyNumber}
              onChange={(value) => setVehicleForm((current) => ({ ...current, bodyNumber: value }))}
            />
            <Field
              label="Make"
              value={vehicleForm.make}
              onChange={(value) => setVehicleForm((current) => ({ ...current, make: value }))}
            />
            <Field
              label="Model"
              value={vehicleForm.model}
              onChange={(value) => setVehicleForm((current) => ({ ...current, model: value }))}
            />
            <Field
              label="Year Model"
              type="number"
              value={vehicleForm.yearModel}
              onChange={(value) => setVehicleForm((current) => ({ ...current, yearModel: value }))}
            />
            <Field
              label="Seat Capacity"
              type="number"
              value={vehicleForm.seatCapacity}
              onChange={(value) => setVehicleForm((current) => ({ ...current, seatCapacity: value }))}
            />
            <Field
              label="Color"
              value={vehicleForm.color}
              onChange={(value) => setVehicleForm((current) => ({ ...current, color: value }))}
            />
          </div>
          <div className="mt-5 rounded-xl bg-blue-50 p-4 text-sm text-blue-800 dark:bg-blue-950/40 dark:text-blue-300">
            The vehicle's QR token is generated and managed by the backend. It is not edited here.
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setEditVehicle(null)}
              disabled={updateVehicleMutation.isPending}
              className="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={saveVehicle}
              disabled={updateVehicleMutation.isPending}
              className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {updateVehicleMutation.isPending ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ============================================================
// STAT CARD
// ============================================================

function StatCard({ title, value, description }: { title: string; value: number; description: string }) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-slate-900">
      <p className="text-sm font-medium text-gray-500 dark:text-slate-400">{title}</p>
      <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
      <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">{description}</p>
    </div>
  );
}

// ============================================================
// EMPTY STATE
// ============================================================

function EmptyState({ icon, title, text }: { icon: string; title: string; text: string }) {
  return (
    <div className="p-12 text-center">
      <div className="text-4xl">{icon}</div>
      <h3 className="mt-3 font-semibold text-gray-900 dark:text-white">{title}</h3>
      <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">{text}</p>
    </div>
  );
}

// ============================================================
// MODAL
// ============================================================

function Modal({
  title,
  subtitle,
  children,
  onClose,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/40 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl dark:bg-slate-900"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-gray-100 bg-white px-6 py-5 dark:border-slate-800 dark:bg-slate-900">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
            {subtitle && <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-2 text-2xl leading-none text-gray-400 hover:bg-gray-100 dark:text-slate-500 dark:hover:bg-slate-800"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

// ============================================================
// FIELD
// ============================================================

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-slate-300">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-blue-500 dark:focus:bg-slate-900 dark:focus:ring-blue-900"
      />
    </div>
  );
}