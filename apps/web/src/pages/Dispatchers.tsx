// apps/web/src/pages/Dispatchers.tsx

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getDispatchers, deleteDispatcher, updateDispatcher } from "../api/dispatcher.api";
import AddDispatcherModal from "../components/AddDispatcherModal";
import EditDispatcherModal from "../components/EditDispatcherModal";

export default function Dispatchers() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedDispatcher, setSelectedDispatcher] = useState<any>(null);

  const { data: dispatchers = [], isLoading } = useQuery({
    queryKey: ["dispatchers"],
    queryFn: getDispatchers,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDispatcher,
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: ["dispatchers"] });
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateDispatcher(id, data),
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: ["dispatchers"] });
    },
  });

  function removeDispatcher(id: string) {
    if (window.confirm("Delete this dispatcher?")) {
      deleteMutation.mutate(id);
    }
  }

  function toggleStatus(dispatcher: any) {
    statusMutation.mutate({
      id: dispatcher.id,
      data: {
        isActive: !dispatcher.isActive,
      },
    });
  }

  if (isLoading) {
    return (
      <div className="p-6 text-gray-600 dark:text-slate-300">
        Loading dispatchers...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-4 rounded-xl bg-white p-4 shadow-sm dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">Dispatchers</h1>
          <p className="text-gray-500 dark:text-slate-400">Manage registered dispatchers.</p>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="w-full shrink-0 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 sm:w-auto"
        >
          Add Dispatcher
        </button>
      </div>

      {dispatchers.length === 0 ? (
        <div className="rounded-xl bg-white p-6 text-center text-gray-500 shadow-sm dark:bg-slate-900 dark:text-slate-400">
          No dispatchers found.
        </div>
      ) : (
        <>
          {/* MOBILE CARD LIST */}
          <div className="space-y-4 md:hidden">
            {dispatchers.map((dispatcher: any) => (
              <div
                key={dispatcher.id}
                className="rounded-xl bg-white p-4 shadow-sm dark:bg-slate-900"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-gray-900 dark:text-white">
                      {dispatcher.user?.displayName ?? "-"}
                    </p>
                    <p className="truncate text-sm text-gray-500 dark:text-slate-400">
                      @{dispatcher.user?.username ?? "-"}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
                      dispatcher.isActive
                        ? "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300"
                        : "bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-slate-300"
                    }`}
                  >
                    {dispatcher.isActive ? "ACTIVE" : "INACTIVE"}
                  </span>
                </div>

                <dl className="mt-3 space-y-1 text-sm">
                  <div className="flex justify-between gap-3">
                    <dt className="text-gray-500 dark:text-slate-400">Terminal</dt>
                    <dd className="truncate text-right text-gray-700 dark:text-slate-300">
                      {dispatcher.terminalName ?? "-"}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-gray-500 dark:text-slate-400">Email</dt>
                    <dd className="truncate text-right text-gray-700 dark:text-slate-300">
                      {dispatcher.user?.email ?? "-"}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-gray-500 dark:text-slate-400">Phone</dt>
                    <dd className="truncate text-right text-gray-700 dark:text-slate-300">
                      {dispatcher.user?.phone ?? "-"}
                    </dd>
                  </div>
                </dl>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => navigate(`/dispatchers/${dispatcher.id}`)}
                    className="flex-1 rounded bg-gray-100 px-3 py-2 text-sm text-gray-700 hover:bg-gray-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                  >
                    View
                  </button>
                  <button
                    onClick={() => {
                      setSelectedDispatcher(dispatcher);
                      setEditOpen(true);
                    }}
                    className="flex-1 rounded bg-blue-100 px-3 py-2 text-sm text-blue-700 hover:bg-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-900/50"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => toggleStatus(dispatcher)}
                    className="flex-1 rounded bg-yellow-100 px-3 py-2 text-sm text-yellow-700 hover:bg-yellow-200 dark:bg-yellow-950/40 dark:text-yellow-300 dark:hover:bg-yellow-900/50"
                  >
                    {dispatcher.isActive ? "Disable" : "Enable"}
                  </button>
                  <button
                    onClick={() => removeDispatcher(dispatcher.id)}
                    className="flex-1 rounded bg-red-100 px-3 py-2 text-sm text-red-600 hover:bg-red-200 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-900/50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* DESKTOP TABLE */}
          <div className="hidden overflow-hidden rounded-xl bg-white shadow-sm dark:bg-slate-900 md:block">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-200 text-sm text-gray-500 dark:border-slate-800 dark:text-slate-400">
                    <th className="p-4">Dispatcher</th>
                    <th className="p-4">Username</th>
                    <th className="p-4">Terminal</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Phone</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {dispatchers.map((dispatcher: any) => (
                    <tr
                      key={dispatcher.id}
                      className="border-b border-gray-100 hover:bg-gray-50 dark:border-slate-800 dark:hover:bg-slate-800/50"
                    >
                      <td className="p-4 text-gray-900 dark:text-white">
                        {dispatcher.user?.displayName ?? "-"}
                      </td>
                      <td className="p-4 text-gray-700 dark:text-slate-300">
                        {dispatcher.user?.username ?? "-"}
                      </td>
                      <td className="p-4 text-gray-700 dark:text-slate-300">
                        {dispatcher.terminalName ?? "-"}
                      </td>
                      <td className="p-4 text-gray-700 dark:text-slate-300">
                        {dispatcher.user?.email ?? "-"}
                      </td>
                      <td className="p-4 text-gray-700 dark:text-slate-300">
                        {dispatcher.user?.phone ?? "-"}
                      </td>
                      <td className="p-4">
                        <span
                          className={`rounded-full px-3 py-1 text-sm ${
                            dispatcher.isActive
                              ? "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300"
                              : "bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-slate-300"
                          }`}
                        >
                          {dispatcher.isActive ? "ACTIVE" : "INACTIVE"}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => navigate(`/dispatchers/${dispatcher.id}`)}
                            className="rounded bg-gray-100 px-3 py-1 text-sm text-gray-700 hover:bg-gray-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                          >
                            View
                          </button>
                          <button
                            onClick={() => {
                              setSelectedDispatcher(dispatcher);
                              setEditOpen(true);
                            }}
                            className="rounded bg-blue-100 px-3 py-1 text-sm text-blue-700 hover:bg-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-900/50"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => toggleStatus(dispatcher)}
                            className="rounded bg-yellow-100 px-3 py-1 text-sm text-yellow-700 hover:bg-yellow-200 dark:bg-yellow-950/40 dark:text-yellow-300 dark:hover:bg-yellow-900/50"
                          >
                            {dispatcher.isActive ? "Disable" : "Enable"}
                          </button>
                          <button
                            onClick={() => removeDispatcher(dispatcher.id)}
                            className="rounded bg-red-100 px-3 py-1 text-sm text-red-600 hover:bg-red-200 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-900/50"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <AddDispatcherModal
        open={addOpen}
        onClose={() => {
          setAddOpen(false);
        }}
      />
      <EditDispatcherModal
        open={editOpen}
        dispatcher={selectedDispatcher}
        onClose={() => {
          setEditOpen(false);
          setSelectedDispatcher(null);
        }}
      />
    </div>
  );
}
