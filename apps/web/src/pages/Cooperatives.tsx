// apps/web/src/pages/Cooperatives.tsx

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../api/axios";

// ============================================================
// TYPES
// ============================================================

type Cooperative = {
  id: string;
  name: string;
  code: string;
  contactPerson?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
  vehicles?: Array<{ id: string }>;
  drivers?: Array<{ id: string }>;
};

type CooperativeForm = {
  name: string;
  code: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  active: boolean;
};

// ============================================================
// HELPERS
// ============================================================

function getErrorMessage(error: unknown): string {
  if (typeof error !== "object" || error === null) {
    return "Something went wrong.";
  }

  const value = error as {
    response?: { data?: { message?: string | string[] } | string };
    message?: string;
  };

  const data = value.response?.data;

  if (typeof data === "string") {
    return data;
  }

  if (data && typeof data === "object") {
    const message = data.message;
    if (Array.isArray(message)) {
      return message.join(", ");
    }
    if (typeof message === "string") {
      return message;
    }
  }

  if (typeof value.message === "string" && value.message.trim()) {
    return value.message;
  }

  return "Something went wrong.";
}

function emptyForm(): CooperativeForm {
  return {
    name: "",
    code: "",
    contactPerson: "",
    phone: "",
    email: "",
    address: "",
    active: true,
  };
}

function formatDate(value?: string): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString();
}

// ============================================================
// MAIN
// ============================================================

export default function Cooperatives() {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCooperative, setEditingCooperative] = useState<Cooperative | null>(null);
  const [form, setForm] = useState<CooperativeForm>(emptyForm());
  const [formError, setFormError] = useState("");

  // ==========================================================
  // QUERY
  // ==========================================================

  const cooperativesQuery = useQuery<Cooperative[]>({
    queryKey: ["cooperatives"],
    queryFn: async () => {
      const response = await api.get("/cooperatives");
      return Array.isArray(response.data) ? response.data : [];
    },
    refetchInterval: 15_000,
  });

  const cooperatives = cooperativesQuery.data ?? [];

  // ==========================================================
  // FILTER
  // ==========================================================

  const filteredCooperatives = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return cooperatives.filter((cooperative) => {
      const matchesSearch =
        !normalizedSearch ||
        cooperative.name.toLowerCase().includes(normalizedSearch) ||
        cooperative.code.toLowerCase().includes(normalizedSearch) ||
        (cooperative.address ?? "").toLowerCase().includes(normalizedSearch);

      const matchesStatus =
        activeFilter === "ALL" ||
        (activeFilter === "ACTIVE" && cooperative.active) ||
        (activeFilter === "INACTIVE" && !cooperative.active);

      return matchesSearch && matchesStatus;
    });
  }, [cooperatives, search, activeFilter]);

  // ==========================================================
  // STATS
  // ==========================================================

  const totalCount = cooperatives.length;
  const activeCount = cooperatives.filter((cooperative) => cooperative.active).length;
  const inactiveCount = totalCount - activeCount;

  // ==========================================================
  // CREATE
  // ==========================================================

  const createMutation = useMutation({
    mutationFn: async (payload: CooperativeForm) => {
      const response = await api.post("/cooperatives", {
        ...payload,
        contactPerson: payload.contactPerson || undefined,
        phone: payload.phone || undefined,
        email: payload.email || undefined,
        address: payload.address || undefined,
      });
      return response.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["cooperatives"] });
      closeModal();
    },
  });

  // ==========================================================
  // UPDATE
  // ==========================================================

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: CooperativeForm }) => {
      const response = await api.patch(`/cooperatives/${id}`, {
        ...payload,
        contactPerson: payload.contactPerson || undefined,
        phone: payload.phone || undefined,
        email: payload.email || undefined,
        address: payload.address || undefined,
      });
      return response.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["cooperatives"] });
      closeModal();
    },
  });

  // ==========================================================
  // DELETE
  // ==========================================================

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/cooperatives/${id}`);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["cooperatives"] });
    },
  });

  // ==========================================================
  // TOGGLE ACTIVE
  // ==========================================================

  const toggleMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const response = await api.patch(`/cooperatives/${id}`, { active });
      return response.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["cooperatives"] });
    },
  });

  // ==========================================================
  // MODAL HELPERS
  // ==========================================================

  function openCreateModal() {
    setEditingCooperative(null);
    setForm(emptyForm());
    setFormError("");
    createMutation.reset();
    updateMutation.reset();
    setModalOpen(true);
  }

  function openEditModal(cooperative: Cooperative) {
    setEditingCooperative(cooperative);
    setForm({
      name: cooperative.name,
      code: cooperative.code,
      contactPerson: cooperative.contactPerson ?? "",
      phone: cooperative.phone ?? "",
      email: cooperative.email ?? "",
      address: cooperative.address ?? "",
      active: cooperative.active,
    });
    setFormError("");
    createMutation.reset();
    updateMutation.reset();
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingCooperative(null);
    setForm(emptyForm());
    setFormError("");
  }

  // ==========================================================
  // FORM
  // ==========================================================

  function updateForm(field: keyof CooperativeForm, value: string | boolean) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function submitForm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");

    if (!form.name.trim()) {
      setFormError("Cooperative name is required.");
      return;
    }

    if (!form.code.trim()) {
      setFormError("Cooperative code is required.");
      return;
    }

    if (editingCooperative) {
      updateMutation.mutate({
        id: editingCooperative.id,
        payload: {
          ...form,
          name: form.name.trim(),
          code: form.code.trim().toUpperCase(),
        },
      });
      return;
    }

    createMutation.mutate({
      ...form,
      name: form.name.trim(),
      code: form.code.trim().toUpperCase(),
    });
  }

  // ==========================================================
  // DELETE
  // ==========================================================

  function handleDelete(cooperative: Cooperative) {
    const driverCount = cooperative.drivers?.length ?? 0;
    const vehicleCount = cooperative.vehicles?.length ?? 0;
    const dependencyText = driverCount > 0 || vehicleCount > 0 ? `\n\nDrivers: ${driverCount}\nVehicles: ${vehicleCount}` : "";

    const confirmed = window.confirm(
      `Delete "${cooperative.name}"?${dependencyText}\n\nIf this cooperative is referenced by drivers, vehicles, or trips, the server may reject the deletion. Deactivating it is safer.`,
    );

    if (!confirmed) return;
    deleteMutation.mutate(cooperative.id);
  }

  // ==========================================================
  // LOADING
  // ==========================================================

  if (cooperativesQuery.isLoading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <div className="rounded-2xl bg-white px-6 py-5 text-sm text-gray-500 shadow-sm dark:bg-slate-900 dark:text-slate-400">
          Loading cooperatives...
        </div>
      </div>
    );
  }

  // ==========================================================
  // ERROR
  // ==========================================================

  if (cooperativesQuery.isError) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 dark:border-red-900/50 dark:bg-red-950/30">
        <h2 className="font-semibold text-red-800 dark:text-red-200">Unable to load cooperatives.</h2>
        <p className="mt-2 text-sm text-red-700 dark:text-red-300">{getErrorMessage(cooperativesQuery.error)}</p>
        <button
          type="button"
          onClick={() => void cooperativesQuery.refetch()}
          className="mt-4 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  const mutationError = getErrorMessage(
    createMutation.error ?? updateMutation.error ?? deleteMutation.error ?? toggleMutation.error,
  );

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="min-h-full space-y-6">
      {/* HEADER */}
      <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Fleet Administration</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Cooperatives</h1>
            <p className="mt-2 max-w-2xl text-sm text-gray-500 dark:text-slate-400">
              Manage registered transport cooperatives, service areas, contacts, and operational status.
            </p>
          </div>
          <button
            type="button"
            onClick={openCreateModal}
            className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            + Add Cooperative
          </button>
        </div>
      </section>

      {/* STATS */}
      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard title="Total Cooperatives" value={totalCount} className="bg-white dark:bg-slate-900" />
        <StatCard title="Active" value={activeCount} className="bg-green-50 dark:bg-green-950/40" />
        <StatCard title="Inactive" value={inactiveCount} className="bg-gray-50 dark:bg-slate-800" />
      </section>

      {/* FILTERS */}
      <section className="rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-900">
        <div className="flex flex-col gap-3 md:flex-row md:items-end">
          <div className="flex-1">
            <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-slate-400">Search</label>
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search cooperative, code, or address..."
              className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-blue-500 dark:focus:bg-slate-900 dark:focus:ring-blue-900"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-slate-400">Status</label>
            <select
              value={activeFilter}
              onChange={(event) => setActiveFilter(event.target.value as "ALL" | "ACTIVE" | "INACTIVE")}
              className="min-w-[160px] rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-blue-500 dark:focus:ring-blue-900"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
        </div>
      </section>

      {/* ERROR */}
      {(createMutation.isError || updateMutation.isError || deleteMutation.isError || toggleMutation.isError) && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          {mutationError}
        </div>
      )}

      {/* TABLE */}
      <section className="overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-slate-900">
        <div className="border-b border-gray-100 px-6 py-4 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white">Registered Cooperatives</h2>
              <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">{filteredCooperatives.length} cooperative(s)</p>
            </div>
          </div>
        </div>

        {filteredCooperatives.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-4xl">🏢</div>
            <h3 className="mt-3 font-semibold text-gray-900 dark:text-white">No cooperatives found</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">Try changing your search or status filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-left">
              <thead>
                <tr className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-500 dark:border-slate-800 dark:text-slate-400">
                  <th className="p-4">Cooperative</th>
                  <th className="p-4">Code</th>
                  <th className="p-4">Service Area</th>
                  <th className="p-4">Contact</th>
                  <th className="p-4">Fleet</th>
                  <th className="p-4">Drivers</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCooperatives.map((cooperative) => {
                  const vehicleCount = cooperative.vehicles?.length ?? 0;
                  const driverCount = cooperative.drivers?.length ?? 0;

                  return (
                    <tr
                      key={cooperative.id}
                      className="border-b border-gray-100 align-top hover:bg-gray-50 dark:border-slate-800 dark:hover:bg-slate-800/50"
                    >
                      {/* NAME */}
                      <td className="p-4">
                        <div className="font-semibold text-gray-900 dark:text-white">{cooperative.name}</div>
                        <div className="mt-1 text-xs text-gray-400 dark:text-slate-500">Created {formatDate(cooperative.createdAt)}</div>
                      </td>
                      {/* CODE */}
                      <td className="p-4">
                        <span className="inline-flex rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                          {cooperative.code}
                        </span>
                      </td>
                      {/* ADDRESS */}
                      <td className="p-4">
                        <div className="max-w-[260px] text-sm text-gray-700 dark:text-slate-300">{cooperative.address ?? "-"}</div>
                      </td>
                      {/* CONTACT */}
                      <td className="p-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{cooperative.contactPerson ?? "-"}</div>
                        <div className="mt-1 text-xs text-gray-500 dark:text-slate-400">{cooperative.phone ?? cooperative.email ?? "-"}</div>
                      </td>
                      {/* FLEET */}
                      <td className="p-4">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">{vehicleCount}</span>
                        <span className="ml-1 text-xs text-gray-500 dark:text-slate-400">vehicle(s)</span>
                      </td>
                      {/* DRIVERS */}
                      <td className="p-4">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">{driverCount}</span>
                        <span className="ml-1 text-xs text-gray-500 dark:text-slate-400">driver(s)</span>
                      </td>
                      {/* STATUS */}
                      <td className="p-4">
                        <span
                          className={[
                            "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
                            cooperative.active
                              ? "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300"
                              : "bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-300",
                          ].join(" ")}
                        >
                          {cooperative.active ? "ACTIVE" : "INACTIVE"}
                        </span>
                      </td>
                      {/* ACTIONS */}
                      <td className="p-4">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(cooperative)}
                            className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-900/50"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            disabled={toggleMutation.isPending}
                            onClick={() => {
                              toggleMutation.mutate({ id: cooperative.id, active: !cooperative.active });
                            }}
                            className="rounded-lg bg-yellow-50 px-3 py-2 text-xs font-semibold text-yellow-700 hover:bg-yellow-100 disabled:opacity-50 dark:bg-yellow-950/40 dark:text-yellow-300 dark:hover:bg-yellow-900/50"
                          >
                            {cooperative.active ? "Deactivate" : "Activate"}
                          </button>
                          <button
                            type="button"
                            disabled={deleteMutation.isPending}
                            onClick={() => handleDelete(cooperative)}
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

      {/* MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl dark:bg-slate-900">
            {/* MODAL HEADER */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-6 py-5 dark:border-slate-800 dark:bg-slate-900">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {editingCooperative ? "Edit Cooperative" : "Add Cooperative"}
                </h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">Manage the cooperative's registration details.</p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-full px-2 text-2xl leading-none text-gray-400 hover:bg-gray-100 dark:text-slate-500 dark:hover:bg-slate-800"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {/* FORM */}
            <form onSubmit={submitForm} className="space-y-5 p-6">
              {formError && (
                <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">{formError}</div>
              )}

              {/* NAME */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-slate-300">Cooperative Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(event) => updateForm("name", event.target.value)}
                  placeholder="Happy Island Transport Service Cooperative"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-blue-500 dark:focus:ring-blue-900"
                />
              </div>

              {/* CODE */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-slate-300">Cooperative Code</label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(event) => updateForm("code", event.target.value)}
                  placeholder="HAPITRANSCO"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm uppercase outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-blue-500 dark:focus:ring-blue-900"
                />
              </div>

              {/* CONTACT + PHONE */}
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-slate-300">Contact Person</label>
                  <input
                    type="text"
                    value={form.contactPerson}
                    onChange={(event) => updateForm("contactPerson", event.target.value)}
                    placeholder="Contact person"
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-blue-500 dark:focus:ring-blue-900"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-slate-300">Phone</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(event) => updateForm("phone", event.target.value)}
                    placeholder="09XXXXXXXXX"
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-blue-500 dark:focus:ring-blue-900"
                  />
                </div>
              </div>

              {/* EMAIL */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-slate-300">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) => updateForm("email", event.target.value)}
                  placeholder="cooperative@example.com"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-blue-500 dark:focus:ring-blue-900"
                />
              </div>

              {/* ADDRESS */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-slate-300">Location / Service Area</label>
                <textarea
                  rows={3}
                  value={form.address}
                  onChange={(event) => updateForm("address", event.target.value)}
                  placeholder="Bagatabao, Bagamanoc, Catanduanes"
                  className="w-full resize-none rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-blue-500 dark:focus:ring-blue-900"
                />
              </div>

              {/* ACTIVE */}
              <label className="flex cursor-pointer items-center gap-3 rounded-xl bg-gray-50 p-4 dark:bg-slate-800">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(event) => updateForm("active", event.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span>
                  <span className="block text-sm font-medium text-gray-800 dark:text-slate-200">Active cooperative</span>
                  <span className="mt-0.5 block text-xs text-gray-500 dark:text-slate-400">
                    Active cooperatives can be used for current operations.
                  </span>
                </span>
              </label>

              {/* ACTIONS */}
              <div className="flex justify-end gap-3 border-t border-gray-100 pt-5 dark:border-slate-800">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? "Saving..."
                    : editingCooperative
                      ? "Save Changes"
                      : "Create Cooperative"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// STAT CARD
// ============================================================

function StatCard({ title, value, className }: { title: string; value: number; className?: string }) {
  return (
    <div className={`rounded-2xl p-6 shadow-sm ${className ?? "bg-white dark:bg-slate-900"}`}>
      <p className="text-sm font-medium text-gray-500 dark:text-slate-400">{title}</p>
      <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
    </div>
  );
}